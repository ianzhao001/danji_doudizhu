# M-FLOW-04 叫抢策略切到难度分层（M4-07 集成）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/flow/policies.ts`
  - 可读不可改：`assets/scripts/flow/{types,driver,index}.ts`、`assets/scripts/ai/**`、`assets/scripts/game/**`、`test/flow/**`
- 依赖：M-FLOW-03（已并 main）+ M4-07（已并 main，`chooseBidByLevel` 可用）
- 分支：`task/M-FLOW-04-bid-level-policy`

## 背景
M-FLOW-03 的 `levelPolicies().bidPolicy` 仍委派基线 `chooseBid`（计划内「暂不接入」，见评审意见 #5）。
M4-07 落地后，叫抢也应按座位难度分层。本任务把 `bidPolicy` 切到 `chooseBidByLevel`，闭合「工具函数层停滞」风险。

## 行为要求
1. `levelPolicies(levels)` 的 `bidPolicy` 改为：
   `({ seat, state, hand }) => chooseBidByLevel(hand, state, levels[seat])`（按座位难度路由叫抢）。
2. `playPolicy` 不变（仍 `strategyFor(levels[snapshot.turn])`）。导出签名不变。
3. 纯逻辑、禁止 import `cc`、禁止改签名。从 `../ai` 取 `chooseBidByLevel`（已导出）。

## 验收（test/flow/policies-bid.test.ts，架构种入·不可改）
- `bidPolicy` 路由：给定 `levels=[Hard,Simple,Normal]`，
  `bidPolicy({ seat, state: createBidding(seat), hand })` 深相等 `chooseBidByLevel(hand, state, levels[seat])`（seat 0/1/2）。
- 难度可见性：同手牌 `2 3 4 5 6`（一高牌），seat=Hard → call、seat=Normal → pass、seat=Simple → pass（证明 bidPolicy 真按难度分层，不再统一 chooseBid）。
- `runHeadlessRound` 可注入性由 `policies.test.ts`（M-FLOW-03）覆盖：`runHeadlessRound({ seed, ...levelPolicies([Hard,Normal,Simple]) })` 解析为 settled（零和、0<turns<300），本任务不重复种入。
- 既有 `policies.test.ts` 保持绿（其 bidPolicy 断言用的是强手/弱手，Hard/Normal 下强手仍 call、弱手仍 pass，不冲突）。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
