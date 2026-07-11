import {
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
import { hardStrategy } from './levels/hard';

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
  // hardStrategy 不消费 rng（确定性）；传常量桩满足签名。
  const action = hardStrategy(snapshot, { next: () => 0 }, args.history ?? []);
  if (action.type !== 'play') return null;
  const pattern = recognize(action.cards);
  if (!pattern) return null;
  return { pattern, cards: action.cards };
}

export function nextHint(hand: Card[], current: HandPattern | null, prev?: Card[]): Move | null {
  const moves = hintSuggestions(hand, current);
  if (moves.length === 0) return null;
  if (!prev) return moves[0];

  const prevKey = cardsKey(prev);
  const currentIndex = moves.findIndex((move) => cardsKey(move.cards) === prevKey);
  if (currentIndex < 0) return moves[0];
  return moves[(currentIndex + 1) % moves.length];
}
