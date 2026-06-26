# M3-00 手牌布局算法（竖屏纯函数）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/hand-layout.ts`（新；`ui/` 纯逻辑岛，本文件**禁止 import `cc`**）
  - 可读不可改：`assets/scripts/rules/**`、`test/ui/**`
- 依赖：无（独立）
- 分支：`task/M3-00-hand-layout`

## 背景
M3 竖屏（390×844）手牌需要确定的位置/重叠算法，先做成**无 cc 纯函数**便于单测，
后续 Cocos 组件直接消费坐标。`ui/` 层虽可 import `cc`，但本文件是纯算法岛，禁止引擎依赖。

## 行为要求
`layoutHand(count: number, opts: { containerWidth: number; cardWidth: number }): { x: number }[]`
（`x` = 每张牌**左边缘**坐标，容器左边缘为 0）：
1. `count === 0` → `[]`；返回数组长度恒为 `count`。
2. 整组**水平居中**于容器：首尾对称，`x[0] + x[last] === containerWidth - cardWidth`。
3. 放得下（`count*cardWidth ≤ containerWidth`）：相邻不重叠（步距 ≥ `cardWidth`）。
4. 放不下：相邻重叠（步距 < `cardWidth`）压缩到容器内，所有牌 `0 ≤ x ≤ containerWidth - cardWidth`。
5. `x` 随序号单调不减。纯函数、确定性、禁止 import `cc`。

## 验收（test/ui/hand-layout.test.ts，架构种入·不可改）
- `layoutHand(0, …) === []`；长度恒等于 `count`。
- `count===1`：单张居中（`x + cardWidth/2 ≈ containerWidth/2`）。
- 放得下（如 3 张 / W=390 / cardWidth=60）：步距 ≥ cardWidth、对称、单调、全在容器内。
- 放不下（如 20 张 / W=390 / cardWidth=60）：步距 < cardWidth、对称、单调、`0 ≤ x ≤ W-cardWidth`。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
