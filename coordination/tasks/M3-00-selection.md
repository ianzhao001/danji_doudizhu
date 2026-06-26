# M3-00 手牌选中模型（纯函数）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/selection.ts`（新；`ui/` 纯逻辑岛，本文件**禁止 import `cc`**）
  - 可读不可改：`assets/scripts/rules/**`、`test/ui/**`
- 依赖：无（独立）
- 分支：`task/M3-00-selection`

## 背景
手牌点击选中/取消是 UI 高频交互，先做成**无 cc 的纯不可变模型**便于单测，
后续 Cocos 手牌组件消费。选中身份按「点数+花色」区分（同点不同花是不同牌）。

## 行为要求（全部纯函数、不可变、返回新数组、不改入参）
1. `isSelected(selected: Card[], card: Card): boolean`：按 `rank`+`suit` 判定是否已选。
2. `toggle(selected: Card[], card: Card): Card[]`：不在则追加，在则移除（按 `rank`+`suit`）。
3. `sortByRank(cards: Card[]): Card[]`：按 `rank` 升序、**稳定**（同点保持原相对序）、返回新数组。
4. `clearSelection(): Card[]`：返回 `[]`。
5. 禁止 import `cc`、禁止可变副作用。

## 验收（test/ui/selection.test.ts，架构种入·不可改）
- `toggle` 不在则追加（长度+1、`isSelected` 真）、在则移除（长度−1、`isSelected` 假）；入参数组不被改动。
- 同点不同花视为不同牌（一张被选不影响另一张）。
- `sortByRank` 升序、稳定、双王在末、返回新数组（入参不变）。
- `clearSelection() === []`。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
