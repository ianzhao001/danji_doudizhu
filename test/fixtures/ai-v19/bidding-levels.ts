/**
 * M4-07 叫抢难度分层策略。架构落桩——实现方实现函数体，使 test/ai/bidding-levels.test.ts 转绿。
 * 规则见 coordination/tasks/M4-07-bid-levels.md。纯函数、确定性，禁止 import `cc`、禁止改签名。
 * 三档以高牌数（≥Rank.R2，含 2 与双王）为主轴；火箭/炸弹一律强；
 * Normal 走 isStrongHand(hand, 2)，与基线 chooseBid 等价但不委派。
 * 可从 game / ai 取 API：
 *   import { type BiddingState, type BidAction } from '../../../assets/scripts/game';
 *   import { type Card } from '../../../assets/scripts/rules';
 *   import { AiLevel, isStrongHand } from '.';
 */

import { type Card } from '../../../assets/scripts/rules';
import type { BiddingState, BidAction } from '../../../assets/scripts/game';
import { actionForStrength } from './bidding';
import { isStrongByScore } from './bidding-eval';
import { AiLevel } from './strategy';

export function chooseBidByLevel(hand: Card[], state: BiddingState, level: AiLevel): BidAction {
  return actionForStrength(state, isStrongByScore(hand, level));
}
