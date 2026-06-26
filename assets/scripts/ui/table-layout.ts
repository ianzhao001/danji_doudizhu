/**
 * M3-00 桌面布局坐标模型（390×844）。架构落桩——实现方实现函数体，使 test/ui/table-layout.test.ts 转绿。
 * 规则见 coordination/tasks/M3-00-table-layout.md。纯函数、确定性，禁止 import `cc`。
 */

export const PORTRAIT = { width: 390, height: 844 };

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TableRegions {
  playerHand: Rect;
  actionButtons: Rect;
  opponentLeft: Rect;
  opponentRight: Rect;
  playArea: Rect;
  topBar: Rect;
}

export function tableLayout(): TableRegions {
  throw new Error('M3-00 table-layout not implemented');
}
