/**
 * T-LAYOUT2 全元素命名 zone 布局（相位可见集契约）。架构落桩——实现方实现函数体，
 * 使 test/ui/table-zones.test.ts 转绿。规则见 coordination/tasks/T-LAYOUT2.md。
 * 纯函数、确定性，禁止 import `cc`。
 *
 * 契约要点：
 * - TableZones 的 6 个 legacy 字段必须与 tableLayout(width, height) 深相等（单一事实源；
 *   如需为新 zone 腾空间，允许微调 table-layout.ts 的 landscapeLayout 数值——旧横屏测试只锁
 *   「纵向有序+不重叠」）。
 * - bidding / playing 两个相位可见集内 zone 两两间距 ≥8px（x 或 y 方向分离皆可）且全部落屏内。
 * - actionBar 由叫抢按钮组与出牌按钮组共享（相位互斥，同一帧只渲染一组）。
 */

import { tableLayout, type Rect, type TableRegions } from './table-layout';

export interface TableZones extends TableRegions {
  /** 地主/倍数/手牌数徽标带：topBar 之下、两座位之上（修 地主∩左家 / 手牌数∩右家）。 */
  infoStrip: Rect;
  /** 3 张底牌展示托架：横向居中，座位带内侧。 */
  bottomCardsDock: Rect;
  /** 左家出牌落点：贴邻左座内侧。 */
  dropZoneLeft: Rect;
  /** 右家出牌落点：贴邻右座内侧。 */
  dropZoneRight: Rect;
  /** 玩家出牌落点：中央。 */
  dropZoneHero: Rect;
  /** 状态/叫抢提示行：dropZoneHero 之下、actionBar 之上。 */
  statusLine: Rect;
  /** 叫抢按钮组与出牌按钮组共享（相位互斥）。 */
  actionBar: Rect;
  /** 手牌强度条：actionBar 左侧翼（x 不相交）。 */
  strengthMeter: Rect;
  /** 计时：actionBar 右侧翼（x 不相交）。 */
  turnTimer: Rect;
  /** 记牌器收起态停靠：左半屏。 */
  memoryDock: Rect;
  /** 建议开关/面板停靠：右半屏。 */
  advisorDock: Rect;
}

export function tableZones(width: number, height: number): TableZones {
  const legacy = tableLayout(width, height);
  const gap = 8;
  const infoStripHeight = Math.min(14, Math.max(12, Math.round(height * 0.034)));
  const infoStripWidth = Math.min(260, Math.max(176, Math.round(width * 0.28)));
  const opponentBottom = Math.max(
    legacy.opponentLeft.y + legacy.opponentLeft.height,
    legacy.opponentRight.y + legacy.opponentRight.height,
  );
  const dropHeight = legacy.playArea.height;
  const dropWidth = Math.min(128, Math.max(108, Math.round(width * 0.15)));
  const dockWidth = Math.min(220, Math.max(176, Math.round(width * 0.24)));
  const bottomDockHeight = Math.min(30, Math.max(24, Math.round(height * 0.07)));
  const statusHeight = Math.min(24, Math.max(20, Math.round(height * 0.055)));
  const sideWidth = Math.min(118, Math.max(96, Math.round(width * 0.13)));
  const dockHeight = Math.min(32, Math.max(28, Math.round(height * 0.08)));
  const sideY = legacy.actionButtons.y + legacy.actionButtons.height + gap;

  return {
    ...legacy,
    infoStrip: centered(width, infoStripWidth, legacy.topBar.y + legacy.topBar.height + gap, infoStripHeight),
    bottomCardsDock: centered(width, dockWidth, legacy.opponentLeft.y, bottomDockHeight),
    dropZoneLeft: {
      x: legacy.opponentLeft.x + legacy.opponentLeft.width + gap,
      y: opponentBottom + gap,
      width: dropWidth,
      height: dropHeight,
    },
    dropZoneRight: {
      x: legacy.opponentRight.x - gap - dropWidth,
      y: opponentBottom + gap,
      width: dropWidth,
      height: dropHeight,
    },
    dropZoneHero: { ...legacy.playArea },
    statusLine: centered(
      width,
      Math.min(240, Math.max(168, Math.round(width * 0.26))),
      legacy.playArea.y + legacy.playArea.height + gap,
      statusHeight,
    ),
    actionBar: { ...legacy.actionButtons },
    strengthMeter: {
      x: Math.max(gap, legacy.actionButtons.x - gap - sideWidth),
      y: legacy.actionButtons.y,
      width: sideWidth,
      height: legacy.actionButtons.height,
    },
    turnTimer: {
      x: Math.min(width - gap - sideWidth, legacy.actionButtons.x + legacy.actionButtons.width + gap),
      y: legacy.actionButtons.y,
      width: sideWidth,
      height: legacy.actionButtons.height,
    },
    memoryDock: {
      x: Math.max(gap, legacy.actionButtons.x - gap - sideWidth),
      y: sideY,
      width: sideWidth,
      height: dockHeight,
    },
    advisorDock: {
      x: Math.min(width - gap - sideWidth, legacy.actionButtons.x + legacy.actionButtons.width + gap),
      y: sideY,
      width: sideWidth,
      height: dockHeight,
    },
  };
}

function centered(width: number, rectWidth: number, y: number, height: number): Rect {
  return {
    x: Math.round((width - rectWidth) / 2),
    y,
    width: rectWidth,
    height,
  };
}
