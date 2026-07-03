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
  void tableLayout(width, height);
  throw new Error('T-LAYOUT2: implement tableZones (see coordination/tasks/T-LAYOUT2.md)');
}
