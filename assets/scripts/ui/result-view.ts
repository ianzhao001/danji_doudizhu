/**
 * M3-00 结算弹窗视图模型（Settlement → VM）。架构落桩——实现方实现函数体，使 test/ui/result-view.test.ts 转绿。
 * 规则见 coordination/tasks/M3-00-result-view-model.md。纯函数、确定性，禁止 import `cc`。
 */

import { type Settlement, type SeatIndex } from '../game';

export interface ScoreRow {
  seat: SeatIndex;
  score: number;
  isLandlord: boolean;
}

export interface ResultView {
  resultText: string;
  multiplier: number;
  bombs: number;
  springText: string;
  scores: ScoreRow[];
}

export function deriveResultView(args: {
  settlement: Settlement;
  landlord: SeatIndex;
  heroSeat: SeatIndex;
}): ResultView {
  throw new Error('M3-00 result-view not implemented');
}
