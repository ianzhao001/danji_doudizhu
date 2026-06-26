# M3-00 操作按钮状态模型（出牌/过牌/提示）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/action-buttons.ts`（新；`ui/` 纯逻辑岛，本文件**禁止 import `cc`**）
  - 可读不可改：`assets/scripts/rules/**`、`assets/scripts/game/**`、`test/ui/**`
- 依赖：M3-00-selection（已并 main，`isSelected` 等可读）+ rules（`legalFollows`/`enumerateMoves`/`validatePlay`）
- 分支：`task/M3-00-action-buttons`

## 背景
手牌区上方的操作按钮（出牌/不要/提示）的 enabled 状态，要由 `GameSnapshot + selectedCards` 推导。
先做无 cc 纯函数，复用 rules 着法枚举，不重新判断规则。

## 行为要求（纯函数、确定性、禁 cc）
1. `ActionButtonsState { play: boolean; pass: boolean; hint: boolean }`。
2. `deriveActionButtons(args: { snapshot: GameSnapshot; selectedCards: Card[] }): ActionButtonsState`：
   - 只在玩家轮（`snapshot.turn === viewerSeat`，viewer 由 `snapshot.viewerHand` 存在判定或入参带 `viewerSeat`——实现方择一，建议入参增可选 `viewerSeat?: SeatIndex`，缺省用 `snapshot.turn`）时按钮可操作；非玩家轮全 false。
   - `play`：`selectedCards` 非空且 `validatePlay(selectedCards, snapshot.top?.pattern ?? null).valid`（复用 rules）。
   - `pass`：`snapshot.top !== null`（有牌可过才允许过；自由领出时不能过）。
   - `hint`：`legalFollows(viewerHand, snapshot.top?.pattern)` 或 `enumerateMoves(viewerHand)` 非空（有合法着法可提示）。
3. 纯函数、禁 cc、不改入参。从 `../rules` 取 `validatePlay`/`legalFollows`/`enumerateMoves`，从 `../game` 取 `GameSnapshot`。

## 验收（test/ui/action-buttons.test.ts，架构种入·不可改）
- 非玩家轮 → `{play:false,pass:false,hint:false}`。
- 玩家轮、空选中 → `play:false`；`pass` 随 `top` 是否为 null；`hint` 为 true（有牌必有合法着法）。
- 玩家轮、选中合法可压牌 → `play:true`；选中非法（压不住）→ `play:false`。
- `top===null`（自由领出）→ `pass:false`；`top!==null` → `pass:true`。
- 入参不被改动。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
