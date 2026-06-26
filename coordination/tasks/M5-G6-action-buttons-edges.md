# M5-G6 action-buttons 边界 green-guard

- 状态：ready
- 文件域（**只允许改这些**）：
  - `test/ui/action-buttons-edges.test.ts`（新，纯测试）
  - 可读不可改：`assets/scripts/ui/action-buttons.ts`、`assets/scripts/game/**`、`assets/scripts/rules/**`、`test/ui/**`（既有不可改）
- 依赖：M3-00-action-buttons 已并 main
- 分支：`task/M5-G6-action-buttons-edges`
- **green-guard**：现码即对，新建测试应直接绿。

## 背景
`action-buttons.ts` 三条边界未测：`viewerHand: undefined`（应 play:false、pass/hint 随 top）、省略 `viewerSeat`→默认 `snapshot.turn`、有 top 但无合法跟牌时 `hint:false`。锁之。

## 行为要求（纯测试、禁 cc）
1. 从 `../../assets/scripts/ui/action-buttons` 取 `deriveActionButtons`，构造 `GameSnapshot`（可不带 `viewerHand`）。
2. 断言：
   - `viewerHand` 缺省 + 玩家轮 + `top!==null` + 空 `selectedCards` → `play===false`（无牌可出）、`pass===true`、`hint===false`（无手牌无合法跟牌）。
   - 省略 `viewerSeat`（只给 `snapshot`+`selectedCards`）且 `snapshot.turn===0` → 与显式 `viewerSeat:0` 深相等（锁默认行为）。
   - 有 `viewerHand` + 有 top + 选中压不住的牌 → `play===false`、`hint===true`（有合法跟牌）。
3. 纯测试、禁 cc。

## 验收
- 新测试全绿、`npm --prefix test test` 全绿、`typecheck` 无错。

## 测试命令
`npm --prefix test test`
