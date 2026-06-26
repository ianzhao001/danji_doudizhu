# M4-04B 难度 routing 按座位分发证明

- 状态：ready
- 文件域（**只允许改这些**）：
  - `test/selfplay/difficulty.ts`（M4-04 已建，纯测试 helper）
  - 可读不可改：`assets/scripts/ai/**`、`assets/scripts/flow/**`、`test/selfplay/difficulty.test.ts`
- 依赖：M4-04（已并 main）
- 分支：`task/M4-04B-difficulty-routing`

## 背景
M4-04 的「难度信号」测试直接调 `strategyFor(Hard/Normal)`，能证明各档策略不同，
但**没证明** `runDifficultyMatchup` 内的 routing playPolicy 真按 `snapshot.turn` 把座位分发到各自难度。
本任务把 routing 抽成可单测的 `buildRoutingPolicy(levels)` 并逐座位证明分发（评审意见 #1）。

## 行为要求
1. 在 `test/selfplay/difficulty.ts` 导出：
   `export function buildRoutingPolicy(levels: [AiLevel, AiLevel, AiLevel]): PlayPolicy`
   返回的 policy 对入参 `{ seat, snapshot, rng }` 调 `strategyFor(levels[snapshot.turn])(snapshot, rng)`。
2. `runDifficultyMatchup` 改为复用 `buildRoutingPolicy`（对外行为不变，`difficulty.test.ts` 保持绿）。
3. 纯测试代码、确定性、不 import `cc`、不依赖 `runner.ts`。

## 验收（test/selfplay/routing.test.ts，架构种入·不可改）
给定 `levels = [Hard, Simple, Normal]` 与一个「可压制」判别快照（viewer 能压住单张）：
- 对 seat 0/1/2，`buildRoutingPolicy(levels)({ seat, snapshot(turn=seat), rng:createRng(1) })`
  与 `strategyFor(levels[seat])(同快照, createRng(1))` **深相等**（逐座位证明分发到正确难度）。
- 三档在该快照上的输出**并非全等**（证明快照具判别力、分发非平凡）。
- `npm --prefix test test` 全绿、`typecheck` 无错。

## 测试命令
`npm --prefix test test`
