# M4-04 难度差异 selfplay 回归（routing playPolicy 跑混合难度）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `test/selfplay/difficulty.ts`（新 helper）
  - `test/selfplay/difficulty.test.ts`（架构种入不变量断言；实现方**可新增**自有用例，**不可改**既有断言）
  - 可读不可改：`assets/scripts/flow/**`、`assets/scripts/ai/**`、`assets/scripts/game/**`
- 依赖：M-FLOW（playPolicy）+ M4-05（三档定稿），均已并 main
- 分支：`task/M4-04-difficulty-selfplay`

## 背景
M-FLOW 的 `playPolicy` 可让不同座位用不同难度。需证明三档混合自对弈**无死循环、零和、可复现**，并观察**难度信号**，作为难度系统回归护栏。**不依赖** `runner.ts`（直接调 `runHeadlessRound`）。

## 行为要求
1. 实现 `test/selfplay/difficulty.ts` 的
   `runDifficultyMatchup(levels: [AiLevel, AiLevel, AiLevel], seeds: number[]): Promise<MatchSummary[]>`：
   - 构造**单个** `playPolicy`，按 `snapshot.turn` 路由到 `strategyFor(levels[seat])`；
   - 对每个 seed 调 `runHeadlessRound({ seed, playPolicy })`，收敛为 `{ seed, landlord, winner, turns, scores }`，顺序与入参一致。
2. 确定性、纯测试代码；禁止 import `cc`。

## 验收（test/selfplay/difficulty.test.ts）
- **架构种入（不可改）**：固定 seed 集（1..20）下每局到达 settled（`winner` 有值）、零和、`0 < turns < 300`（无死循环）；可复现（同 levels+seeds 跑两次深相等）。
- **实现方新增（难度信号，可调以防 flaky）**：用受控场景或宽容聚合断言难度差异（如 landlord=hard 的控权/胜数 `≥` landlord=simple，`>=` 非严格阈值）。避免脆弱的精确统计阈值。
- `npm --prefix test test` 全绿、`npm --prefix test run typecheck` 无错。

## 测试命令
`npm --prefix test test`
