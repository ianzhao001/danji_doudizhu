# M3-00 table-layout 魔法坐标提取为命名常量

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/table-layout.ts`
  - 可读不可改：`test/ui/**`（**既有 `table-layout.test.ts` 不可改**）
- 依赖：M3-00-table-layout（已并 main）
- 分支：`task/M3-00-table-layout-metrics`

## 背景
`table-layout.ts` 的 `tableLayout()` 内所有坐标是行内魔法数（`45/55/64/80/150/180/220/240/280/300/390/604/684`——含 `playArea.x=45`、`actionButtons.x=55`，初版漏列），仅 `PORTRAIT` 命名。布局调参时这些数字不透明、易改错。提取为命名常量，便于审阅与后续微调。

## 行为要求
1. 导出常量 `LAYOUT_METRICS`（结构由实现方定形，须含各区 `{x,y,width,height}` 派生所需的全部数值），如：
   ```ts
   export const LAYOUT_METRICS = {
     topBar: { height: 64 },
     opponent: { y: 80, width: 150, rightX: 240 },
     playArea: { x: 45, y: 220, width: 300, height: 180 },
     actionButtons: { x: 55, y: 604, width: 280, height: 64 },
     playerHand: { y: 684, height: 160 },
   } as const;
   ```
2. `tableLayout()` 改为从 `LAYOUT_METRICS` 派生各 `Rect`（与现状**逐值相等**，行为不变）。
3. `PORTRAIT`、`Rect`、`TableRegions`、`tableLayout()` 导出签名**不变**。
4. 纯函数、确定性、禁 cc。

## 验收（test/ui/table-layout-metrics.test.ts，架构种入·**新建**·不可改）
- `LAYOUT_METRICS` 导出存在且为对象。
- `tableLayout()` 各区坐标与既有 `table-layout.test.ts` 锁定的约束一致（屏内、不重叠、playerHand 底部、topBar 顶部、actionButtons 在 playerHand 上方、playArea 横向居中中心 195±1）。
- `tableLayout()` 两次调用深相等（确定性绿护栏）。
- 加固不变量（绿护栏）：各区坐标均为**整数**像素；全部在 390×844 内不出界；两对手区上下对齐且关于中心 195 左右对称；纵向五段不重叠；`LAYOUT_METRICS` 所有叶子数值为整数。
- 既有 `table-layout.test.ts` 全绿不改。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
