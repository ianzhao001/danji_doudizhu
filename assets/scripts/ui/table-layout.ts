/**
 * M3-00 桌面布局坐标模型（390×844）。架构落桩——实现方实现函数体，使 test/ui/table-layout.test.ts 转绿。
 * 规则见 coordination/tasks/M3-00-table-layout.md。纯函数、确定性，禁止 import `cc`。
 */

export const PORTRAIT = { width: 390, height: 844 };

export const LAYOUT_METRICS = {
  topBar: { x: 0, y: 0, width: PORTRAIT.width, height: 64 },
  opponent: { y: 80, width: 150, height: 80, leftX: 0, rightX: 240 },
  playArea: { x: 45, y: 220, width: 300, height: 180 },
  actionButtons: { x: 55, y: 604, width: 280, height: 64 },
  playerHand: { x: 0, y: 684, width: PORTRAIT.width, height: 160 },
} as const;

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
  return {
    topBar: { ...LAYOUT_METRICS.topBar },
    opponentLeft: {
      x: LAYOUT_METRICS.opponent.leftX,
      y: LAYOUT_METRICS.opponent.y,
      width: LAYOUT_METRICS.opponent.width,
      height: LAYOUT_METRICS.opponent.height,
    },
    opponentRight: {
      x: LAYOUT_METRICS.opponent.rightX,
      y: LAYOUT_METRICS.opponent.y,
      width: LAYOUT_METRICS.opponent.width,
      height: LAYOUT_METRICS.opponent.height,
    },
    playArea: { ...LAYOUT_METRICS.playArea },
    actionButtons: { ...LAYOUT_METRICS.actionButtons },
    playerHand: { ...LAYOUT_METRICS.playerHand },
  };
}
