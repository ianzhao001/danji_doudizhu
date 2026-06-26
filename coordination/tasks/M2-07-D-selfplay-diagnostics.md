# M2-07-D selfplay 诊断消费（runner 消费 HeadlessRoundError）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `test/selfplay/runner.ts`
  - 可读不可改：`assets/scripts/flow/**`、`test/selfplay/selfplay.test.ts`
- 依赖：M-FLOW（已并 main）
- 分支：`task/M2-07-D-selfplay-diagnostics`

## 背景
`runner.ts` 的 catch 把任意错误用**空 partial** `{}` 交给 `formatFailure`，导致失败消息里 `landlord/turns/lastEvents` 全是 `undefined`/空（[runner.ts:72](../../test/selfplay/runner.ts)）。M-FLOW 的 `HeadlessRoundError` 已携带 `seed/turns/landlord/lastEvents`，应被消费成**富 partial**。架构已在分支种子把 `runSeeds` 扩展为可注入触发失败的 `opts`（转发 `maxTurns`/`playPolicy`），并保持 `runSeeds(seeds)` 向后兼容。

## 行为要求
1. catch 块识别 `error instanceof HeadlessRoundError` 时，用其 `seed/turns/landlord/lastEvents` 组 `Partial<FlowResult>`（`events = lastEvents`），交 `formatFailure`，使失败消息含**真实** `turns`/`landlord`/**非空** `lastEvents`；非 `HeadlessRoundError` 维持现状（沿用已有 `selfplay invariant failed:` 透传 / 空 partial 兜底）。
2. `runSeeds(seeds)` 行为不变（向后兼容）；`runSeeds(seeds, { maxTurns })` 能触发并消费诊断。
3. 纯测试代码；禁止 import `cc`；**不改** `selfplay.test.ts`。

## 验收（test/selfplay/diagnostics.test.ts，不可改）
- `runSeeds([42], { maxTurns: 1 })` rejects，message 含 `seed=42`、`turns≥1`、`landlord` 非 `undefined`、`lastEvents` 非空（非 `[]`）。
- 现有 `selfplay.test.ts` 保持绿（`runSeeds(seeds)` 行为不变）。
- `npm --prefix test test` 全绿、`npm --prefix test run typecheck` 无错。

## 测试命令
`npm --prefix test test`
