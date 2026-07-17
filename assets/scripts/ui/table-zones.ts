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
  /** 状态/叫抢提示行：横屏在 dropZoneHero 之上；竖屏保留 legacy 下方位置。 */
  statusLine: Rect;
  /** 叫抢按钮组与出牌按钮组共享（相位互斥）。 */
  actionBar: Rect;
  /** 手牌强度条：横屏左缘独立停靠（当前隐藏）。 */
  strengthMeter: Rect;
  /** 计时：横屏停靠 actionBar 左翼；竖屏保留 legacy 左下位置。 */
  turnTimer: Rect;
  /** 记牌器收起态停靠：左半屏。 */
  memoryDock: Rect;
  /** 建议开关/面板停靠：右半屏。 */
  advisorDock: Rect;
  /** v13 玩家大立绘区：左下围桌，底边贴近但不压住底部大手牌。 */
  heroBody: Rect;
  /** v13 左侧 AI 大立绘区：左上围桌。 */
  opponentLeftBody: Rect;
  /** v13 右侧 AI 大立绘区：右上围桌。 */
  opponentRightBody: Rect;
  /** v13 玩家名字牌区：贴近玩家立绘下方。 */
  heroNameplate: Rect;
  /** v13 左侧 AI 名字牌区。 */
  opponentLeftNameplate: Rect;
  /** v13 右侧 AI 名字牌区。 */
  opponentRightNameplate: Rect;
  /** v13 底部横向大手牌区。 */
  heroHandLarge: Rect;
  /** v13 牌桌右下行动按钮区（与 actionBar 同一事实源）。 */
  tableActionBar: Rect;
  /** v13 结算展示覆盖区：暗幕牌桌上的胜负大字与三家分数面板。 */
  settlementShowcase: Rect;
}

export function tableZones(width: number, height: number): TableZones {
  const legacy = tableLayout(width, height);
  const landscape = width >= height;
  const gap = 8;
  const infoStripHeight = Math.min(14, Math.max(12, Math.round(height * 0.034)));
  const infoStripWidth = Math.min(260, Math.max(176, Math.round(width * 0.28)));
  const opponentBottom = Math.max(
    legacy.opponentLeft.y + legacy.opponentLeft.height,
    legacy.opponentRight.y + legacy.opponentRight.height,
  );
  const dropHeight = clamp(Math.round(height * 0.13), 44, 52);
  const dropWidth = Math.min(128, Math.max(108, Math.round(width * 0.15)));
  const dropY = opponentBottom + gap;
  const dockWidth = clamp(Math.round(width * 0.175), 136, 154);
  const bottomDockHeight = clamp(Math.round(height * 0.115), 40, 46);
  const statusHeight = clamp(Math.round(height * 0.05), 18, 22);
  const sideWidth = clamp(Math.round(width * 0.105), 84, 96);
  const dockHeight = Math.min(32, Math.max(28, Math.round(height * 0.08)));
  const sideY = legacy.actionButtons.y;
  const v13 = gameRemakeZones(width, height, gap, legacy);

  return {
    ...legacy,
    infoStrip: centered(width, infoStripWidth, legacy.topBar.y + legacy.topBar.height + gap, infoStripHeight),
    bottomCardsDock: centered(width, dockWidth, legacy.topBar.y + legacy.topBar.height + gap, bottomDockHeight),
    dropZoneLeft: {
      x: legacy.opponentLeft.x + legacy.opponentLeft.width + gap,
      y: dropY,
      width: dropWidth,
      height: dropHeight,
    },
    dropZoneRight: {
      x: legacy.opponentRight.x - gap - dropWidth,
      y: dropY,
      width: dropWidth,
      height: dropHeight,
    },
    dropZoneHero: { ...legacy.playArea },
    statusLine: centered(
      width,
      Math.min(240, Math.max(168, Math.round(width * 0.26))),
      landscape
        ? legacy.playArea.y - gap - statusHeight
        : legacy.playArea.y + legacy.playArea.height + gap,
      statusHeight,
    ),
    actionBar: { ...legacy.actionButtons },
    strengthMeter: {
      x: landscape ? gap : gap + sideWidth + gap,
      y: sideY,
      width: sideWidth,
      height: legacy.actionButtons.height,
    },
    turnTimer: {
      x: landscape ? legacy.actionButtons.x - gap - sideWidth : gap,
      y: landscape ? legacy.actionButtons.y : sideY,
      width: sideWidth,
      height: legacy.actionButtons.height,
    },
    memoryDock: {
      x: gap,
      y: sideY,
      width: sideWidth,
      height: dockHeight,
    },
    advisorDock: {
      x: width - gap - sideWidth,
      y: sideY,
      width: sideWidth,
      height: dockHeight,
    },
    ...v13,
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

function gameRemakeZones(width: number, height: number, gap: number, legacy: TableRegions): Pick<
  TableZones,
  | 'heroBody'
  | 'opponentLeftBody'
  | 'opponentRightBody'
  | 'heroNameplate'
  | 'opponentLeftNameplate'
  | 'opponentRightNameplate'
  | 'heroHandLarge'
  | 'tableActionBar'
  | 'settlementShowcase'
> {
  const heroHandReservedLeft = clamp(Math.round(width * 0.132), 102, 120);
  const heroHandLarge = {
    x: heroHandReservedLeft,
    y: legacy.playerHand.y,
    width: width >= height
      ? width - 2 * heroHandReservedLeft
      : width - heroHandReservedLeft - gap,
    height: legacy.playerHand.height,
  };

  const tableActionBar = { ...legacy.actionButtons };

  const settlementHeight = Math.round(height * 0.5);
  const settlementShowcase = centered(
    width,
    clamp(Math.round(width * 0.56), 360, 520),
    tableActionBar.y - settlementHeight,
    settlementHeight,
  );

  const bodyWidth = clamp(Math.round(width * 0.105), 84, 96);
  const bodyHeight = clamp(Math.round(height * 0.26), 94, 106);
  const dropHeight = clamp(Math.round(height * 0.13), 44, 52);
  const dropWidth = Math.min(128, Math.max(108, Math.round(width * 0.15)));
  const opponentBottom = Math.max(
    legacy.opponentLeft.y + legacy.opponentLeft.height,
    legacy.opponentRight.y + legacy.opponentRight.height,
  );
  const dropY = opponentBottom + gap;
  const dropZoneLeftX = legacy.opponentLeft.x + legacy.opponentLeft.width + gap;
  const dropZoneRightX = legacy.opponentRight.x - gap - dropWidth;
  const heroBodyX = gap;
  const heroBodyY = Math.max(0, height - bodyHeight);
  const heroBody = {
    x: heroBodyX,
    y: heroBodyY,
    width: bodyWidth,
    height: bodyHeight,
  };
  const opponentLeftBody = {
    x: width >= height ? dropZoneLeftX - gap - bodyWidth : gap,
    y: width >= height ? dropY + dropHeight - bodyHeight : legacy.topBar.y + legacy.topBar.height + gap,
    width: bodyWidth,
    height: bodyHeight,
  };
  const opponentRightBody = {
    x: width >= height ? dropZoneRightX + dropWidth + gap : width - gap - bodyWidth,
    y: width >= height ? dropY + dropHeight - bodyHeight : legacy.topBar.y + legacy.topBar.height + gap,
    width: bodyWidth,
    height: bodyHeight,
  };

  const nameplateWidth = width >= height
    ? clamp(Math.round(width * 0.123), 96, 106)
    : clamp(Math.round(width * 0.135), 104, 116);
  const nameplateHeight = clamp(Math.round(height * 0.09), 32, 36);
  const heroNameplate = {
    x: heroBody.x,
    y: heroBody.y - gap - nameplateHeight,
    width: nameplateWidth,
    height: nameplateHeight,
  };
  const opponentLeftNameplate = {
    x: width >= height ? gap : opponentLeftBody.x,
    y: width >= height
      ? opponentLeftBody.y - gap - nameplateHeight
      : opponentLeftBody.y + opponentLeftBody.height + gap,
    width: nameplateWidth,
    height: nameplateHeight,
  };
  const opponentRightNameplate = {
    x: width - gap - nameplateWidth,
    y: width >= height
      ? opponentRightBody.y - gap - nameplateHeight
      : opponentRightBody.y + opponentRightBody.height + gap,
    width: nameplateWidth,
    height: nameplateHeight,
  };

  return {
    heroBody,
    opponentLeftBody,
    opponentRightBody,
    heroNameplate,
    opponentLeftNameplate,
    opponentRightNameplate,
    heroHandLarge,
    tableActionBar,
    settlementShowcase,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
