/**
 * M2-02 叫抢地主（抢翻倍）。实现方：实现 createBidding / applyBid 函数体，
 * 使 test/game/bidding.test.ts 转绿。协议见 coordination/tasks/M2-02-bidding.md。
 * 禁止 import `cc`，禁止改本文件已有的类型与签名。
 */

import { SeatIndex, IllegalActionError } from './types';

export type BidActionType = 'call' | 'grab' | 'pass';
export interface BidAction {
  type: BidActionType;
  seat: SeatIndex;
}

export type BiddingPhase = 'calling' | 'grabbing' | 'done' | 'redeal';
export interface BiddingState {
  phase: BiddingPhase;
  turn: SeatIndex;
  provisional: SeatIndex | null; // 当前临时地主
  multiplier: number; // 叫=1，每抢/反抢 ×2
  landlord: SeatIndex | null; // done 时确定
}

const notImplemented = (): never => {
  throw new Error('not implemented');
};

// 实现时按需使用 IllegalActionError 拒绝非法动作。
void IllegalActionError;

/** 创建叫地主初始状态：从 startSeat 开始 calling。 */
export function createBidding(startSeat: SeatIndex): BiddingState {
  void startSeat;
  return notImplemented();
}

/** 应用一个叫/抢/不动作；非法抛 IllegalActionError；不可变更新。 */
export function applyBid(state: BiddingState, action: BidAction): BiddingState {
  void state;
  void action;
  return notImplemented();
}
