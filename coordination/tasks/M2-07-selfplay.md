# M2-07 selfplay-harness（AI vs AI 稳定性自对弈）

- 状态：todo（**待 M2-06 flow 在 main 后置 ready 并认领**）
- 文件域（**只允许改这些**）：
  - `test/selfplay/runner.ts`（实现 `runSeeds` 等 harness 逻辑）
  - 可读不可改：`test/selfplay/selfplay.test.ts`（架构已写好断言）、`assets/scripts/flow/*` 及其下游
- 依赖：M2-06（`runHeadlessRound`/`FlowResult`/`FlowEvent`）
- 分支：`task/M2-07-selfplay`

## 目标
**纯测试 harness，不新增生产代码**：复用 flow 跑一批固定 seed 的整局自对弈，断言引擎稳定（必终止、无非法、守恒、可复现）。这是回归护栏，不评价 AI 强弱。

## 公共 API 契约（见 runner.ts 桩；selfplay.test.ts 只读）
```ts
export interface SeedSummary {
  seed: number; landlord: number; winner: string;
  turns: number; scores: [number, number, number];
}
export function runSeeds(seeds: number[]): Promise<SeedSummary[]>;
```
- `runSeeds` 对每个 seed 调 `runHeadlessRound({ seed, maxTurns, maxRedeals })`，把 `FlowResult` 收敛成 `SeedSummary`。
- 失败诊断：当某局不满足不变量时，抛出的错误消息需含 `seed / landlord / winner / turns / 最后 10 个 FlowEvent`。

## 验收（test/selfplay/selfplay.test.ts，架构已写好）
- 跑固定 seeds（如 `1..30`），逐局断言：
  - 到达 `settled` 且有 `settlement`（`runHeadlessRound` 不抛 `IllegalActionError`/未超 maxTurns）。
  - `scores[0]+scores[1]+scores[2] === 0`（守恒）。
  - `turns < 上限`（必终止、无死循环）。
- **可复现**：同一组 seeds 跑两次，`SeedSummary[]` 深相等。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。

## 注意
- 只在 `test/selfplay/` 内写；不碰生产代码（`assets/scripts/**`）。
- 这是「新增测试」，符合 PROTOCOL；但仍**不可改其它既有测试**。
