# M5-G8 flow driver 诊断 green-guard

- 状态：ready
- 文件域（**只允许改这些**）：
  - `test/flow/driver-diagnostics.test.ts`（新，纯测试）
  - 可读不可改：`assets/scripts/flow/**`、`test/flow/**`（既有不可改）
- 依赖：M-FLOW/M-FLOW-02 已并 main
- 分支：`task/M5-G8-driver-diagnostics`
- **green-guard**：现码即对，新建测试应直接绿。
- **不重复**：`maxTurns:1` 已由 `test/flow/diagnostics.test.ts` 覆盖，本任务只测**未覆盖**的 `maxTurns:0` 与 `maxRedeals` 超限。

## 背景
`flow/driver.ts` 两条诊断未测：`maxRedeals` 超限抛**普通 Error**（非 `HeadlessRoundError`）含 seed；`maxTurns:0` 立即抛 `HeadlessRoundError`（边界 0，区别于已测的 1）。

## 行为要求（纯测试、禁 cc）
1. 从 `../../assets/scripts/flow` 取 `runHeadlessRound`/`HeadlessRoundError`。
2. 断言：
   - `maxRedeals` 超限（用全 pass 的 bidPolicy 触发连续 redeal）→ 抛**普通 `Error`**（`!(e instanceof HeadlessRoundError)`）且 `message` 含 seed。
   - `maxTurns: 0` → 抛 `HeadlessRoundError`（边界 0，立即抛，turns===0）。
3. 纯测试、禁 cc、不重复 `maxTurns:1`。

## 验收
- 新测试全绿、`npm --prefix test test` 全绿、`typecheck` 无错。

## 测试命令
`npm --prefix test test`
