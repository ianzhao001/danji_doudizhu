import {
  Category,
  Rank,
  isBombLike,
  recognize,
  type Card,
  type HandPattern,
  type Move,
  enumerateMoves,
  legalFollows,
} from '../../../assets/scripts/rules';
import type { GameEvent, GameSnapshot, SeatIndex } from '../../../assets/scripts/game';
import { cardKey } from '../../../assets/scripts/rules/guards';
import { compareMoves } from './levels/_shared';
import { Decomposer } from './decompose';
import { moveOutcomeScore } from './handWeight';
import { hardStrategyWithProfile } from './levels/hard';
import { HINT_PIMC, pimcRank } from './pimc';

export interface HintResult {
  moves: Move[];
}

function compareHintMoves(a: Move, b: Move): number {
  const aBombLike = isBombLike(a.pattern.category);
  const bBombLike = isBombLike(b.pattern.category);
  if (aBombLike !== bBombLike) return aBombLike ? 1 : -1;
  return compareMoves(a, b);
}

function cardsKey(cards: Card[]): string {
  return cards.map(cardKey).sort().join('|');
}

export function hintSuggestions(hand: Card[], current: HandPattern | null): Move[] {
  const moves = current === null ? enumerateMoves(hand) : legalFollows(hand, current);
  return moves.slice().sort(compareHintMoves);
}

/**
 * V8 用户签收意见④（2026-07-11）：提示升级为 AI 最优推荐。
 * 复用 hard 档决策为 hero 计算最优着法——与 AI 座位完全同一信息面
 * （GameSnapshot + 公开事件历史，G14 不作弊约束不变）。
 * 返回 null 的情形：对局已结束 / 非 viewer 回合 / 无手牌 / 要不起或策略选择过牌。
 */
export function adviseBestMove(args: {
  snapshot: GameSnapshot;
  history?: GameEvent[];
  viewerSeat?: SeatIndex;
}): Move | null {
  const { snapshot } = args;
  const viewerSeat = args.viewerSeat ?? 0;
  if (snapshot.winner !== null) return null;
  if (snapshot.turn !== viewerSeat) return null;
  const hand = snapshot.viewerHand;
  if (!hand || hand.length === 0) return null;
  const action = hardStrategyWithProfile(HINT_PIMC)(snapshot, { next: () => 0 }, args.history ?? []);
  if (action.type !== 'play') return null;
  const pattern = recognize(action.cards);
  if (!pattern) return null;
  return { pattern, cards: action.cards };
}

export interface RankedHint {
  move: Move;
  score: number;
}

export type RankHintCandidatesResult =
  | { kind: 'ranked'; hints: RankedHint[] }
  | { kind: 'passAdvice' }
  | { kind: 'none' };

function airplaneKey(move: Move): string | null {
  const category = move.pattern.category;
  if (category !== Category.Airplane
    && category !== Category.AirplaneSingles
    && category !== Category.AirplanePairs) return null;
  return `${category}:${move.pattern.mainRank}:${move.pattern.length}`;
}

function rankableCandidates(hand: Card[], current: HandPattern | null): Move[] {
  const decomposer = new Decomposer();
  const ordered = hintSuggestions(hand, current).filter((move) => (
    move.pattern.category !== Category.AirplaneSingles
    || move.cards.every((card) => card.rank !== Rank.R2)
  )).sort((left, right) => {
    const delta = moveOutcomeScore(decomposer, hand, left) - moveOutcomeScore(decomposer, hand, right);
    return delta !== 0 ? delta : compareHintMoves(left, right);
  });
  const seenCards = new Set<string>();
  const seenAirplanes = new Set<string>();
  const result: Move[] = [];
  for (const move of ordered) {
    const key = cardsKey(move.cards);
    if (seenCards.has(key)) continue;
    const plane = airplaneKey(move);
    if (plane !== null && seenAirplanes.has(plane)) continue;
    seenCards.add(key);
    if (plane !== null) seenAirplanes.add(plane);
    result.push(move);
  }
  return result;
}

function canSampleHintWorld(snapshot: GameSnapshot, history: readonly GameEvent[]): boolean {
  const hand = snapshot.viewerHand;
  if (!hand) return false;
  let played = 0;
  for (const event of history) if (event.type === 'play') played += event.pattern.cards.length;
  let hidden = 0;
  for (let seat = 0; seat < 3; seat += 1) if (seat !== snapshot.turn) hidden += snapshot.handCounts[seat] ?? 0;
  return 54 - hand.length - played === hidden;
}

export function rankHintCandidates(args: {
  snapshot: GameSnapshot;
  history?: GameEvent[];
  viewerSeat?: SeatIndex;
}): RankHintCandidatesResult {
  const history = args.history ?? [];
  const viewerSeat = args.viewerSeat ?? 0;
  const { snapshot } = args;
  const hand = snapshot.viewerHand;
  if (snapshot.winner !== null || snapshot.turn !== viewerSeat || !hand || hand.length === 0) {
    return { kind: 'none' };
  }
  const candidates = rankableCandidates(hand, snapshot.top?.pattern ?? null);
  if (candidates.length === 0) return { kind: 'passAdvice' };
  const advised = adviseBestMove({ snapshot, history, viewerSeat });
  if (!advised) return { kind: 'passAdvice' };

  const advisedKey = cardsKey(advised.cards);
  const pool = candidates.filter((move) => cardsKey(move.cards) !== advisedKey).slice(0, 5);
  pool.unshift(advised);
  let ranked: RankedHint[];
  if (canSampleHintWorld(snapshot, history)) {
    ranked = pimcRank({
      snapshot,
      history,
      candidates: pool,
      includePass: snapshot.top !== null,
      profile: HINT_PIMC,
      mustInclude: advised,
    }).filter((option): option is { move: Move; score: number } => option.move !== null);
  } else {
    const decomposer = new Decomposer();
    ranked = pool.map((move) => ({ move, score: -moveOutcomeScore(decomposer, hand, move) }));
  }

  const byKey = new Map(ranked.map((hint) => [cardsKey(hint.move.cards), hint]));
  const first = byKey.get(advisedKey) ?? { move: advised, score: 0 };
  const hints = [first, ...ranked.filter((hint) => cardsKey(hint.move.cards) !== advisedKey)].slice(0, 6);
  return { kind: 'ranked', hints };
}
