# M-FLOW-02 出牌循环异常诊断（policy/apply 抛错包成 HeadlessRoundError）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/flow/driver.ts`
  - 可读不可改：`assets/scripts/flow/types.ts`（架构已加可选 `cause`）、`assets/scripts/game/**`、`assets/scripts/ai/**`、`test/flow/**`
- 依赖：M-FLOW（已并 main）
- 分支：`task/M-FLOW-02-illegal-action`

## 背景
M-FLOW 只把超 `maxTurns` / 结算缺 `win` 包成 `HeadlessRoundError`。当注入的 `playPolicy` 返回**非法动作**或 `apply` 抛错（如 `IllegalActionError`）时，driver 直接抛原始错误，丢失局部诊断（seed/turns/landlord/lastEvents）。M4-04 混合难度跑 seeds 时尤其需要这些诊断定位。`HeadlessRoundError` 契约文档本就提及「非法动作」。架构已在 `types.ts` 给 `HeadlessRoundError` 加可选 `cause`。

## 行为要求
1. 出牌循环内对 `playPolicy(...)` 与 `apply(...)`（[driver.ts](../../assets/scripts/flow/driver.ts) 的出牌 while）包 try/catch：捕获错误 → 抛 `HeadlessRoundError`，填 `seed/turns/landlord/lastEvents`（同既有诊断口径，`lastEvents` 取末尾 N≥10），`message` 含 seed，并把原始错误置于 `cause`。
2. 已是 `HeadlessRoundError` 的不要二次包装（直接 rethrow）。
3. 超 `maxTurns` / 缺 `win` 路径维持现状不变；叫抢阶段错误维持现状。
4. 纯逻辑、只编排、不重判规则；禁止 import `cc`；除 `types.ts` 已加的可选 `cause` 外不改公共签名。

## 验收（test/flow/illegal-action.test.ts，不可改）
- 注入返回非法 `play`（牌不在手）的 `playPolicy` → `runHeadlessRound` rejects：`instanceof HeadlessRoundError`、`seed===<seed>`、`turns≥0`、`lastEvents` 非空、`message` 含 seed、`cause` 为原始错误。
- 现有 `driver.test.ts` + `diagnostics.test.ts` + `selfplay` 保持绿（默认 `playPolicy` 路径不变）。
- `npm --prefix test test` 全绿、`npm --prefix test run typecheck` 无错、未 import `cc`。

## 测试命令
`npm --prefix test test`
