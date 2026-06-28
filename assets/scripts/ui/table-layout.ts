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

export function tableLayout(): TableRegions;
export function tableLayout(containerWidth: number, containerHeight: number): TableRegions;
export function tableLayout(containerWidth?: number, containerHeight?: number): TableRegions {
  if (containerWidth === undefined || containerHeight === undefined) {
    return fixedPortraitLayout();
  }

  if (containerWidth === PORTRAIT.width && containerHeight === PORTRAIT.height) {
    return fixedPortraitLayout();
  }

  const width = Math.max(1, Math.round(containerWidth));
  const height = Math.max(1, Math.round(containerHeight));
  const topBarHeight = Math.min(64, Math.max(48, Math.round(height * 0.08)));
  const opponentWidth = Math.min(150, Math.max(96, Math.round(width * 0.34)));
  const opponentHeight = Math.min(80, Math.max(64, Math.round(height * 0.09)));
  const opponentY = topBarHeight + 16;
  const playAreaWidth = Math.min(300, Math.max(220, width - 90));
  const playAreaHeight = Math.min(180, Math.max(140, Math.round(height * 0.2)));
  const playAreaY = opponentY + opponentHeight + 48;
  const playerHandHeight = Math.min(160, Math.max(140, Math.round(height * 0.19)));
  const actionHeight = 64;
  const actionWidth = Math.min(280, Math.max(220, width - 80));
  const playerHandY = height - playerHandHeight;
  const actionY = playerHandY - 16 - actionHeight;

  return {
    topBar: { x: 0, y: 0, width, height: topBarHeight },
    opponentLeft: { x: 0, y: opponentY, width: opponentWidth, height: opponentHeight },
    opponentRight: { x: width - opponentWidth, y: opponentY, width: opponentWidth, height: opponentHeight },
    playArea: { x: Math.round((width - playAreaWidth) / 2), y: playAreaY, width: playAreaWidth, height: playAreaHeight },
    actionButtons: { x: Math.round((width - actionWidth) / 2), y: actionY, width: actionWidth, height: actionHeight },
    playerHand: { x: 0, y: playerHandY, width, height: playerHandHeight },
  };
}

function fixedPortraitLayout(): TableRegions {
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
