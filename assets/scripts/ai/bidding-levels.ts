/**
 * M4-07 叫抢难度分层策略。架构落桩——实现方实现函数体，使 test/ai/bidding-levels.test.ts 转绿。
 * 规则见 coordination/tasks/M4-07-bid-levels.md。纯函数、确定性，禁止 import `cc`、禁止改签名。
 * 三档以高牌数（≥Rank.R2，含 2 与双王）为主轴；火箭/炸弹一律强；
 * Normal 走 isStrongHand(hand, 2)，与基线 chooseBid 等价但不委派。
 * 可从 game / ai 取 API：
 *   import { type BiddingState, type BidAction } from '../game';
 *   import { type Card } from '../rules';
 *   import { AiLevel, isStrongHand } from '.';
 */

import { type Card } from '../rules';
import type { BiddingState, BidAction } from '../game';
import { actionForStrength, isStrongHand } from './bidding';
import { isHardStrongHand } from './bidding-hard';
import { AiLevel } from './strategy';

export function thresholdFor(level: AiLevel): number {
  switch (level) {
    case AiLevel.Simple:
      return 3;
    case AiLevel.Normal:
      return 2;
    case AiLevel.Hard:
      return 1; // 历史口径保留(W-AUDIT-AI 起 Hard 不再走高牌阈值,见 chooseBidByLevel)
    default: {
      const exhaustive: never = level;
      throw new Error(`unknown AiLevel: ${String(exhaustive)}`);
    }
  }
}

export function chooseBidByLevel(hand: Card[], state: BiddingState, level: AiLevel): BidAction {
  // W-AUDIT-AI B2:Hard 换结构化判强(火箭/炸/≥3 控牌/2 控牌+短手型),
  // 修「一张高牌就抢地主」的过度激进;Simple/Normal 维持高牌阈值口径不动。
  if (level === AiLevel.Hard) return actionForStrength(state, isHardStrongHand(hand));
  return actionForStrength(state, isStrongHand(hand, thresholdFor(level)));
}
