# T-LIVE-MULT — 顶栏实时倍数/炸弹数（纯层数据口）

- 状态：ready（2026-07-07 派发·C 波·纯逻辑）
- 任务模式：seeded-red（纯逻辑·禁 import `cc`）
- 风险等级：高风险（改共享契约 `assets/scripts/game/types.ts` 的 `GameSnapshot` + 跨 game/flow）→ **三闸**
- 文件域（**只允许改这些**）：
  - `assets/scripts/game/types.ts`（`GameSnapshot` 加可选 `bidMultiplier?: number` + `bombsPlayed?: number`——加法·既有消费方不解构即默认 undefined）
  - `assets/scripts/game/core.ts`（`snapshot()` 填充两字段：`bidMultiplier` 从 `RoundState` 既有字段或入参传·`bombsPlayed` 从 `state.bombsPlayed` 复制）
  - `assets/scripts/flow/runtime/bidding-driver.ts`（`runtimeSnapshot`/`snapshot(runtime.state, heroSeat)` 调用点确保 `bidMultiplier` 透传——`runtime.bidMultiplier` 已存在 `:66`）
  - `coordination/reports/T-LIVE-MULT.report.md`
  - **测试规划者种入不可改**：`test/game/snapshot-live-multiplier.test.ts`
- 依赖：—（与 T-PAUSE-GATE 文件域不相交：本任务触 game/types+core+bidding-driver 的 snapshot 调用·T-PAUSE-GATE 触 round-runtime 接口+bidding-driver 的循环；**bidding-driver.ts 两任务共域 → 串行**：T-LIVE-MULT 在 T-PAUSE-GATE 之后）
- 分支：`task/T-LIVE-MULT`（届时自含 T-PAUSE-GATE 的 main 建）

## 行为要求（实现到种子绿）

1. **GameSnapshot 加法**：`GameSnapshot`（`game/types.ts:64-72`）新增两可选字段 `bidMultiplier?: number`、`bombsPlayed?: number`。**既有两参/旧解构消费方零回退**：`test/` 中 `save-resume-e2e`/`runtime-resume-phases`/`quality`/`difficulty`/`policies` 等不解构此二字段 → typecheck 绿、行为不变。
2. **snapshot 填充**：`game/core.ts` 的 `snapshot(state, viewerSeat)`（`:164-184`）在返回对象加 `bombsPlayed: state.bombsPlayed`。**`bidMultiplier` 不在 `RoundState`**（`game/types.ts:36-45` 无此字段·倍数在 flow 层 `runtime.bidMultiplier`）——故 `bidMultiplier` 的填充策略：
   - **方案（实现方采用）**：`snapshot()` 签名**保持两参**（`state, viewerSeat`），不填 `bidMultiplier`（留 undefined）；改由 **flow 层** `runtimeSnapshot`（`bidding-driver.ts:79-81`）在调用 `snapshot(state, heroSeat)` 后**追加** `bidMultiplier: runtime.bidMultiplier`（bidding 层有此值 `:66`）——即 flow 层 enrich，game 层只 enrich `bombsPlayed`（game 层自有数据）。
   - 这样 `game/types` 是纯加法可选字段、`game/core` 只加一行 `bombsPlayed`、`flow/runtime/bidding-driver.ts` 的 `runtimeSnapshot` enrich `bidMultiplier`——**game 层不依赖 flow，依赖方向不破**。
3. **bidding 相 bidMultiplier**：bidding 相 `runtime.bidMultiplier=1`（初始），playing 相 `enterRuntimePlaying` 赋值 `:259`——snapshot 在两相都能取到合理值。bidding 相若 UI 想显示**过程倍数**（叫=1,每抢×2），用 `currentBidding().multiplier`（既有 `BiddingState.multiplier`·`game/bidding.ts:21`）——**本任务不扩 bidding 相 snapshot 的 multiplier**，UI 侧 T-HUD-LIVE 决定取数源。
4. **确定性**：纯加法，无 rng；同输入同输出。

## 红线
- 不改 `RoundState` 字段（`game/types.ts:36-45`）；不改 `settle()`（`game/settlement.ts`·结算公式不动）；不改 `FlowEvent`/`PlayPolicy`/`BidPolicy`；不改 `flow/round-runtime.ts` 接口；不改 `flow/runtime/event-replay.ts`/`persistence.ts`；不改 `flow/driver.ts`/`policies.ts`/`clock.ts`。
- 依赖方向：`game` 不 import `flow`/`ai`（`bidMultiplier` 的 flow-enrich 不反过来让 game 依赖 flow）。
- 不 import `cc`。

## 验收
- 种子 `test/game/snapshot-live-multiplier.test.ts` 全绿（含 2 红转绿）：① playing 相 snapshot 含 `bombsPlayed` 正确递增（出炸弹后 +1）② flow 层 `runtimeSnapshot` 返回的 snapshot 含 `bidMultiplier`（叫抢结束后 = bidding.multiplier）③ 既有不解构此字段的测试零回退。
- 既有 `game/multiplier-stacking`/`settlement`/`snapshot*`/`resume*`/`save*` 全家零改动全绿。
- 全量 vitest/typecheck 零回归；报告附 `game/types`+`core`+`bidding-driver` 三处 diff 与依赖方向自证。
- 审查按 `tasks/R-WAVE9.md` R:T-LIVE-MULT（**三闸**）。
