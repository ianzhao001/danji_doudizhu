/**
 * M2-09 基线叫抢决策。实现方：实现 chooseBid 函数体，使 test/ai/bidding.test.ts 转绿。
 * 规则见 coordination/tasks/M2-09-ai-bid-policy.md。纯函数、确定性，禁止 import `cc`、禁止改签名。
 */

import { Rank, type Card } from '../rules';
import { type BiddingState, type BidAction } from '../game';

/**
 * 依手牌强弱给出叫/抢/不叫：
 * - calling：isStrong(hand) → call，否则 pass。
 * - grabbing：isStrong(hand) → grab，否则 pass。
 * - 返回动作 seat 必须等于 state.turn。
 * isStrong：含火箭(双王) 或 炸弹(四同点) 或 ≥2 张点数 ≥ Rank.R2。
 */
export function chooseBid(hand: Card[], state: BiddingState): BidAction {
  return actionForStrength(state, isStrongHand(hand, 2));
}

export function actionForStrength(state: BiddingState, isStrong: boolean): BidAction {
  if (state.phase === 'calling') {
    return { type: isStrong ? 'call' : 'pass', seat: state.turn };
  }

  if (state.phase === 'grabbing') {
    return { type: isStrong ? 'grab' : 'pass', seat: state.turn };
  }

  throw new Error('chooseBid cannot act during closed bidding phase');
}

/**
 * M4-09 单一真相源判强（架构落桩——实现方实现函数体，并让 chooseBid 与 chooseBidByLevel 复用本函数）。
 * 语义：火箭(双王) 或 炸弹(四同点) 或 highCardCount(点数 ≥ Rank.R2，含 2 与双王) ≥ highCardThreshold。
 */
export function isStrongHand(hand: Card[], highCardThreshold: number): boolean {
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
