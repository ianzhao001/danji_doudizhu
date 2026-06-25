/**
 * M2-09 基线叫抢决策。实现方：实现 chooseBid 函数体，使 test/ai/bidding.test.ts 转绿。
 * 规则见 coordination/tasks/M2-09-ai-bid-policy.md。纯函数、确定性，禁止 import `cc`、禁止改签名。
 */

import { Card } from '../rules';
import { BiddingState, BidAction } from '../game';

/**
 * 依手牌强弱给出叫/抢/不叫：
 * - calling：isStrong(hand) → call，否则 pass。
 * - grabbing：isStrong(hand) → grab，否则 pass。
 * - 返回动作 seat 必须等于 state.turn。
 * isStrong：含火箭(双王) 或 炸弹(四同点) 或 ≥2 张点数 ≥ Rank.R2。
 */
export function chooseBid(hand: Card[], state: BiddingState): BidAction {
  throw new Error('not implemented');
}
