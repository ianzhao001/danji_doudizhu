/**
 * M3-00 叫抢视图模型。架构落桩——实现方实现函数体，使 test/ui/bidding-view.test.ts 转绿。
 * 规则见 coordination/tasks/M3-00-bidding-view-model.md。纯函数、确定性，禁止 import `cc`。
 */

import { type BiddingState, type SeatIndex } from '../game';

export interface BiddingButton {
  id: 'call' | 'grab' | 'pass';
  label: string;
  enabled: boolean;
}

export interface BiddingView {
  prompt: string;
  buttons: BiddingButton[];
}

export function deriveBiddingView(state: BiddingState, viewerSeat: SeatIndex): BiddingView {
  throw new Error('M3-00 bidding-view not implemented');
}
