# M3-00 手牌交互桥（layout + selection 组合）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/hand-interaction.ts`（新；`ui/` 纯逻辑岛，本文件**禁止 import `cc`**）
  - 可读不可改：`assets/scripts/ui/hand-layout.ts`、`assets/scripts/ui/selection.ts`、`assets/scripts/rules/**`、`test/ui/**`
- 依赖：M3-00-hand-layout + M3-00-selection（均已并 main）
- 分支：`task/M3-00-selection-layout-bridge`

## 背景
手牌组件需要「选中牌上浮」的最终坐标：把 `layoutHand` 的基础坐标与 `selection` 选中态组合，
给选中的牌一个负 y 偏移（上浮），未选的留在基线。先做无 cc 纯函数。

## 行为要求（纯函数、确定性、禁 cc、不改入参）
1. `layoutHandInteractive(args: { hand: Card[]; selected: Card[]; containerWidth: number; cardWidth: number; liftOffset: number }): { card: Card; x: number; y: number; selected: boolean }[]`：
   - 先 `sortByRank(hand)`（复用 selection）得有序手牌，再 `layoutHand(hand.length, {containerWidth, cardWidth})` 得基础 `x`。
   - 每张牌：`selected = isSelected(selected, card)`；`y = selected ? -liftOffset : 0`（上浮为负 y）。
   - 输出按有序手牌顺序，每项含 `card`/`x`/`y`/`selected`。
2. 纯函数、禁 cc、不改入参。从 `./hand-layout` 取 `layoutHand`，从 `./selection` 取 `sortByRank`/`isSelected`，从 `../rules` 取 `Card`。

## 验收（test/ui/hand-interaction.test.ts，架构种入·不可改）
- 输出长度 === `hand.length`；`x` 来自 `layoutHand`（与 `layoutHand(hand.length,…)` 的 x 一一对应于排序后顺序）。
- 选中的牌 `y === -liftOffset`、`selected===true`；未选 `y===0`、`selected===false`。
- 同点不同花：选中一张不影响另一张的 `selected`。
- 入参 `hand`/`selected` 不被改动。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
