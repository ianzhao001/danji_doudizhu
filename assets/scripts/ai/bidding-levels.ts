/**
 * M4-07 叫抢难度分层策略。架构落桩——实现方实现函数体，使 test/ai/bidding-levels.test.ts 转绿。
 * 规则见 coordination/tasks/M4-07-bid-levels.md。纯函数、确定性，禁止 import `cc`、禁止改签名。
 * 三档以高牌数（≥Rank.R2，含 2 与双王）为主轴；火箭/炸弹一律强；Normal 委派基线 chooseBid。
 * 可从 game / ai 取 API：
 *   import { type BiddingState, type BidAction } from '../game';
 *   import { type Card } from '../rules';
 *   import { AiLevel, chooseBid } from '.';
 */

import type { Card } from '../rules';
import type { BiddingState, BidAction } from '../game';
import { AiLevel, chooseBid } from '.';

export function chooseBidByLevel(hand: Card[], state: BiddingState, level: AiLevel): BidAction {
  throw new Error('M4-07 not implemented');
}

// 复用引用，避免未使用告警（实现方删除本行即可）
void chooseBid;
