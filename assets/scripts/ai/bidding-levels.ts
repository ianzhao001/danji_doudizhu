/**
 * M4-07 叫抢难度分层策略。架构落桩——实现方实现函数体，使 test/ai/bidding-levels.test.ts 转绿。
 * 规则见 coordination/tasks/M4-07-bid-levels.md。纯函数、确定性，禁止 import `cc`、禁止改签名。
 * 三档以高牌数（≥Rank.R2，含 2 与双王）为主轴；火箭/炸弹一律强；Normal 委派基线 chooseBid。
 * 可从 game / ai 取 API：
 *   import { type BiddingState, type BidAction } from '../game';
 *   import { type Card } from '../rules';
 *   import { AiLevel, chooseBid } from '.';
 */

import { Rank, type Card } from '../rules';
import type { BiddingState, BidAction } from '../game';
import { chooseBid } from './bidding';
import { AiLevel } from './strategy';

function isStrongAtThreshold(hand: Card[], highCardThreshold: number): boolean {
  let hasSmallJoker = false;
  let hasBigJoker = false;
  let highCardCount = 0;
  let hasBomb = false;
  const rankCounts = new Map<Rank, number>();

  for (const card of hand) {
    hasSmallJoker = hasSmallJoker || card.rank === Rank.SmallJoker;
    hasBigJoker = hasBigJoker || card.rank === Rank.BigJoker;
    if (card.rank >= Rank.R2) highCardCount += 1;

    const count = (rankCounts.get(card.rank) ?? 0) + 1;
    rankCounts.set(card.rank, count);
    hasBomb = hasBomb || count >= 4;
  }

  return (hasSmallJoker && hasBigJoker) || hasBomb || highCardCount >= highCardThreshold;
}

function actionForStrength(state: BiddingState, isStrong: boolean): BidAction {
  if (state.phase === 'calling') return { type: isStrong ? 'call' : 'pass', seat: state.turn };
  if (state.phase === 'grabbing') return { type: isStrong ? 'grab' : 'pass', seat: state.turn };
  throw new Error('chooseBid cannot act during closed bidding phase');
}

export function chooseBidByLevel(hand: Card[], state: BiddingState, level: AiLevel): BidAction {
  if (level === AiLevel.Normal) return chooseBid(hand, state);
  const threshold = level === AiLevel.Hard ? 1 : 3;
  return actionForStrength(state, isStrongAtThreshold(hand, threshold));
}
