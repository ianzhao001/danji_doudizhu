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
} from '../rules';
import type { GameEvent, GameSnapshot, SeatIndex } from '../game';
import { cardKey } from '../rules/guards';
import { compareMoves } from './levels/_shared';
import { Decomposer } from './decompose';
import { moveOutcomeScore } from './handWeight';
import { hardStrategyWithProfile } from './levels/hard';
import { capturePimcRanks, HINT_PIMC, type RankedOption } from './pimc';

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

function wingCards(move: Move): Card[] {
  const { category, mainRank, length } = move.pattern;
  if (category === Category.TripsSingle
    || category === Category.TripsPair
    || category === Category.FourPlusTwoSingles
    || category === Category.FourPlusTwoPairs) {
    return move.cards.filter((card) => card.rank !== mainRank);
  }
  const groups = category === Category.AirplaneSingles
    ? length / 4
    : category === Category.AirplanePairs
      ? length / 5
      : 0;
  if (!Number.isInteger(groups) || groups < 2) return [];
  const firstCoreRank = mainRank - groups + 1;
  return move.cards.filter((card) => card.rank < firstCoreRank || card.rank > mainRank);
}

function hasForbiddenHintWing(move: Move): boolean {
  return wingCards(move).some((card) => card.rank >= Rank.R2);
}

function isRankableHintMove(move: Move, advisedKey: string): boolean {
  return cardsKey(move.cards) === advisedKey || !hasForbiddenHintWing(move);
}

function rankableCandidates(hand: Card[], legal: Move[], advised: Move): Move[] {
  const decomposer = new Decomposer();
  const advisedKey = cardsKey(advised.cards);
  const ordered = legal.filter((move) => isRankableHintMove(move, advisedKey)).sort((left, right) => {
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

function mergeHardRanking(
  hand: Card[],
  advised: Move,
  captured: readonly RankedOption[],
  candidates: readonly Move[],
): RankedHint[] {
  const decomposer = new Decomposer();
  const advisedKey = cardsKey(advised.cards);
  const seenCards = new Set<string>();
  const seenAirplanes = new Set<string>();
  const hints: RankedHint[] = [];
  const add = (move: Move, score: number): void => {
    const key = cardsKey(move.cards);
    if (!isRankableHintMove(move, advisedKey)) return;
    if (seenCards.has(key)) return;
    const plane = airplaneKey(move);
    if (plane !== null && seenAirplanes.has(plane)) return;
    seenCards.add(key);
    if (plane !== null) seenAirplanes.add(plane);
    hints.push({ move, score });
  };

  // A sampled Hard decision already owns both the first move and its ranked
  // alternatives. Keep that one score scale intact instead of padding the list
  // with structurally scored moves that PIMC never evaluated.
  if (captured.length > 0) {
    for (const option of captured) if (option.move) add(option.move, option.score);
    return hints.slice(0, 6);
  }

  // Hard can decide before entering PIMC. In that case there is no sampled
  // ranking to reuse, so preserve its authoritative move and fill a local list.
  add(advised, -moveOutcomeScore(decomposer, hand, advised));
  for (const move of candidates) add(move, -moveOutcomeScore(decomposer, hand, move));
  return hints.slice(0, 6);
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
  const legal = hintSuggestions(hand, snapshot.top?.pattern ?? null);
  if (legal.length === 0) return { kind: 'passAdvice' };
  const analysis = capturePimcRanks(() => adviseBestMove({ snapshot, history, viewerSeat }));
  const advised = analysis.value;
  if (!advised) return { kind: 'passAdvice' };
  const captured = analysis.rankings[analysis.rankings.length - 1] ?? [];
  const candidates = captured.length === 0 ? rankableCandidates(hand, legal, advised) : [];
  const hints = mergeHardRanking(hand, advised, captured, candidates);
  return { kind: 'ranked', hints };
}
