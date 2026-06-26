# M3-00 桌面布局坐标模型（390×844）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/table-layout.ts`（新；`ui/` 纯逻辑岛，本文件**禁止 import `cc`**）
  - 可读不可改：`test/ui/**`
- 依赖：无（独立；可读 `hand-layout.ts` 同坐标系约定）
- 分支：`task/M3-00-table-layout`

## 背景
竖屏 390×844 需要确定各区坐标：玩家手牌区（底部）、操作按钮区（手牌上方）、两个对手区（上半屏左右）、
当前出牌区（居中）、底牌+倍数区（顶部）。先做无 cc 纯函数，后续 Cocos 节点按此定位。

## 行为要求（纯函数、确定性、禁 cc）
1. 导出常量 `PORTRAIT = { width: 390, height: 844 }`。
2. `tableLayout(): TableRegions`，`TableRegions` 含各区的 `{ x, y, width, height }`（左上原点，y 向下）：
   - `playerHand`（底部手牌区）、`actionButtons`（手牌正上方）、
   - `opponentLeft`、`opponentRight`（上半屏左右）、`playArea`（居中当前出牌）、`topBar`（底牌+倍数）。
3. 约束（实现方满足，测试锁定）：
   - 各区均在 `[0,390]×[0,844]` 内、互不重叠（除允许的邻接）。
   - `playerHand` 在底部（`y + height` 接近 844）、`topBar` 在顶部（`y` 接近 0）。
   - `actionButtons` 紧贴 `playerHand` 上方（`actionButtons.y + height ≤ playerHand.y`）。
   - `playArea` 居中（横向中心 ≈ 195）。
4. 纯函数、确定性、禁 cc。坐标用整数（实现方取整，避免浮点抖动）。

## 验收（test/ui/table-layout.test.ts，架构种入·不可改）
- `PORTRAIT.width===390 && height===844`。
- 各区在屏内、不重叠（用区间不相交判定）。
- `playerHand` 底部、`topBar` 顶部、`actionButtons` 在 `playerHand` 上方、`playArea` 横向居中（中心 195±1）。
- 同一调用两次结果深相等（确定性）。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
