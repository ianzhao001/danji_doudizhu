# T-PAUSE-GATE — runtime 暂停门（对局冻结·非仅 UI）

- 状态：ready（2026-07-07 派发·C 波首任务·纯逻辑）
- 任务模式：seeded-red（纯逻辑·禁 import `cc`）
- 风险等级：高风险（改共享契约 `RoundRuntime` 接口 + 跨 flow 内部多文件）→ **三闸**
- 文件域（**只允许改这些**）：
  - `assets/scripts/flow/round-runtime.ts`（`RoundRuntime` 接口加 `pause()/resume()/isPaused()` 公共方法；impl 转发）
  - `assets/scripts/flow/runtime/bidding-driver.ts`（`advanceRuntimeUntilPause` 循环加 `paused` gate；`RuntimeDriverContext` 扩 `paused` + `pauseRequested` 字段；新增 `runtimePause/runtimeResume/runtimeIsPaused` 内部函数）
  - `coordination/reports/T-PAUSE-GATE.report.md`
  - **测试规划者种入不可改**：`test/flow/runtime-pause.test.ts`
- 依赖：—（C 波首任务·与 B 波文件域不相交：B 波触 `ui/components`+`game-scene-skeleton`+`game-scene/*`，本任务纯 flow/）
- 分支：`task/T-PAUSE-GATE`（已建自 main `411c972`）

## 行为要求（实现到种子绿）

1. **接口加法（公共契约）**：`RoundRuntime` 接口新增三方法，语义：
   - `pause(): void` — 请求暂停；调用后 runtime **不再推进**任何 AI 决策/叫抢/出牌（已 in-flight 的 `clock.sleep` 醒来后须重新检查 gate，不再提交该步动作）。
   - `resume(): void` — 清除暂停；**重新调度** `scheduleRuntimeAdvance`（即恢复推进）。
   - `isPaused(): boolean` — 当前是否处于暂停态。
   - 三方法对 `disposed` 态幂等（pause/dispose 互不干扰；resume 已 disposed 时为 no-op）。
   - **既有调用方零回退**：`phase/currentSnapshot/currentBidding/biddingDeal/isPlayerTurn/legalInputs/submitPlayerAction/onEvent/settlement/terminationReason/terminationDetail/dispose` 语义与签名一字不动；`submitPlayerAction` 在暂停态被调用 → **照常处理并推进到下一个 player-gate**（暂停只冻 AI 自驱动，不拒玩家输入；这与"暂停=冻结对局"一致：玩家主动出牌是玩家选择，不是对局自走）。**种子会钉此语义**。
2. **gate 实现**：`advanceRuntimeUntilPause` 主循环（`bidding-driver.ts:181-244`）在每次 `sleepForRuntimeAi` **之后**、决策**之前**检查 `runtimeIsPaused(runtime)`——若暂停，`return`（不推进、不计数 step）。`scheduleRuntimeAdvance` 在 `resume()` 时被再次调用以重启循环。**关键不变量**：暂停期间 `phase()`/`currentSnapshot()` 保持暂停前一瞬的值不变（AI 不再改 state）；恢复后从该点继续。
3. **in-flight sleep 处理**：`clock.sleep(thinkingDelayMs)` 醒来后若 `runtimeIsPaused` → `return`（丢弃本次将做的决策；恢复时由 `scheduleRuntimeAdvance` 重启从头检查）。**不得**在 sleep 期间持锁阻塞；gate 是协作式（sleep 醒来检查），与既有 `isDisposed` 检查（`:210,:225`）同形同位。
4. **headless 零影响**：`flow/driver.ts runHeadlessRound` 不调用 pause/resume（无暂停需求）；既有 driver/policies/quality/selfplay 测试零改动全绿。`realClock` 语义不变。
5. **确定性**：同输入同输出；暂停-恢复不引入 rng 消费、不改变事件序列（暂停只是延后，不增删事件）。种子用 `fakeClock`（可控 sleep）断言：暂停后 N 步内 state 不变、resume 后继续推进至 player-gate。

## 红线
- 不改 `game/`、`rules/` 语义（零触碰）；不改 `flow/types.ts` 的 `FlowEvent`/`PlayPolicy`/`BidPolicy` 公共类型；不改 `flow/driver.ts`/`flow/policies.ts`/`flow/clock.ts`；不改 `flow/runtime/event-replay.ts`/`flow/runtime/persistence.ts` 的既有函数签名与体（只在 bidding-driver 加 gate）。
- `submitPlayerAction` 行为不变（暂停态仍接受玩家动作）——**这是契约，不是 bug**。
- 不 import `cc`。

## 验收
- 种子 `test/flow/runtime-pause.test.ts` 全绿（含 2 红转绿）：① 暂停后 AI 不再叫抢/出牌（state 不变）② resume 后继续推进 ③ 暂停态 submitPlayerAction 照常处理 ④ disposed 后 pause/resume 幂等。
- 既有 `runtime-resume-phases`/`round-runtime-hardening`/`-exceptions`/`-diagnostics`/`round-runtime`/`bidding-visibility`/`policy-history`/`driver*`/`policies*` 全家零改动全绿。
- 全量 vitest/typecheck 零回归；报告附接口 diff + gate 插入点 file:line 指认。
- 审查按 `tasks/R-WAVE9.md` R:T-PAUSE-GATE（**三闸**）。
