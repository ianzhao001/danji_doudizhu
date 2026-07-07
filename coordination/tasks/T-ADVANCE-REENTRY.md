# T-ADVANCE-REENTRY — advance 循环防重入（resume 双循环并发窗口收口）

- 状态：blocked（依赖 T-LIVE-MULT done；届时规划者种种子 + 建分支后翻 ready）
- 任务模式：seeded-red（纯逻辑·禁 import `cc`）
- 风险等级：高风险（**规划者裁量升级**：不触「高风险唯一定义」四类，但改动 flow 异步推进核心——advance 循环驱动全部 AI 回合，丢唤醒类缺陷=整局冻结，故加三闸）→ **三闸**
- 文件域（**只允许改这些**）：
  - `assets/scripts/flow/runtime/bidding-driver.ts`（`RuntimeDriverContext` 加 `advanceLoopRunning: boolean`；`advanceRuntimeUntilPause` 入口防重入 + finally 全路径清位）
  - `assets/scripts/flow/round-runtime.ts`（`RoundRuntimeImpl` 加对应私有字段初始化 `false`；不加公共方法）
  - `coordination/reports/T-ADVANCE-REENTRY.report.md`
  - **测试规划者种入不可改**：`test/flow/runtime-advance-reentry.test.ts`（届时种）
- 依赖：T-LIVE-MULT（共域 `bidding-driver.ts` 串行）；**必须先于 T-TERM-FEEDBACK 的暂停接线骑士入 main**（接线打开生产窗口前防重入须就位）
- 分支：`task/T-ADVANCE-REENTRY`（届时自含 LIVE-MULT 的 main 建）

## 背景（T-PAUSE-GATE 三闸把关的拿不准项裁定·2026-07-07）

审查者回扫发现：`scheduleRuntimeAdvance` 是 fire-and-forget async。规划者核实后**修正定性**——机制确属 pre-existing，但**可达性系 T-PAUSE-GATE 新增**：

- 旧世界唯二调度点=构造器（仅一次）+ `submitRuntimePlayerAction`（首行 `NOT_PLAYER_TURN` 守卫，只在 player-gate 可达，而 player-gate 处 advance 循环必已退出）→ 双循环不可达。
- `resume()` 是**首个**能在旧循环 `clock.sleep` 未醒时启动第二循环的公共入口：pause → sleep 醒前 resume → `runtimeResume` 清 flag 并 `scheduleRuntimeAdvance` 起新循环；旧 sleep 醒来见 flag 已清 → 也继续推进 → **双循环并发**。
- 危害路径：旧循环推进一手后 turn 可能已至 hero；新循环 sleep 醒来后的 gate 只查 disposed/paused、**不复查是否 player-gate**，`decidePlayAction` 会替 hero 决策（违反「绝不自动出牌/过牌」硬契约）或异常 → `terminateRuntimeWithError`。
- 生产窗口真实：`thinkDelayMs` 三档均值 375–1000ms（`data/difficultyConfig.ts`），暂停后 1 秒内点「继续」即命中。当前 UI 零调用方（暂停接线在 T-TERM-FEEDBACK 骑士）→ 本任务须先行。

## 行为要求（实现到种子绿）

1. **单一咽喉防重入**：`RuntimeDriverContext` 加 `advanceLoopRunning: boolean`（初 `false`）。`advanceRuntimeUntilPause` 入口：`if (runtime.advanceLoopRunning) return;` → 置 `true` → 既有循环体包进 try/finally，**finally 清 `false`**（player-gate return、paused return、disposed return、maxTurns/异常 terminate、throw——所有退出路径都清）。防重入检查**只**放 `advanceRuntimeUntilPause` 入口（`scheduleRuntimeAdvance` 与 submit 的直调共用此咽喉，不做第二处检查）。
2. **语义锚（不变量）**：
   - resume 在旧 sleep 未醒时调用 → 新调度被防重入吞掉 → 旧循环醒来见未暂停**续跑**（pause-resume 对其透明，恰一循环，不多不少一次 sleep）。
   - 旧循环已因 paused 退出（flag 已清）后 resume → 正常重启新循环。**无丢唤醒**：因 paused 退出时 finally 必已清 flag，后续 resume 必能重启。
   - pause→resume→再 pause（旧 sleep 全程未醒）→ 旧循环醒来见 paused → return（清 flag）；再 resume → 重启。
3. **submit 路径行为不变**：submit 可达时（player-gate）无活循环（flag 必为 `false`），其 `await advanceRuntimeUntilPause(runtime, events)` 照常执行、事件桶语义不变。（论证：循环只在 AI turn 才 sleep；turn 只被循环自身或 submit 改变；AI turn 时 submit 被 `NOT_PLAYER_TURN` 拒——故「flag 为 true 时 submit 通过守卫」不可达。报告须复述此论证。）
4. **既有 gate 零改动**：paused / disposed 检查的位置与语义原样；`runtimePause`/`runtimeResume`/`runtimeIsPaused` 本体不改。
5. **确定性**：同输入同输出；防重入不引入 rng、不增删事件、不改事件顺序。

## 红线

- 不改 `RoundRuntime` 公共接口（零新增方法）；不改 `game/`、`rules/`；不改 `flow/types.ts`/`driver.ts`/`policies.ts`/`clock.ts`/`runtime/event-replay.ts`/`runtime/persistence.ts`。
- 不 import `cc`。

## 验收

- 种子 `test/flow/runtime-advance-reentry.test.ts` 全绿（届时种·PendingClock 受控时序·预计钉：① pause→sleep 醒前 resume→不产生第二个 sleep、resolveAll 后恰推进一手到 player-gate ② 旧循环退出后 resume 正常重启（无丢唤醒）③ submit 链路照常推进 AI）。
- 既有 `runtime-pause`/`runtime-resume-phases`/`round-runtime-hardening`/`-exceptions`/`-diagnostics`/`bidding-visibility`/`round-runtime`/`policy-history`/`driver*` 全家零改动全绿；全量 vitest/typecheck 零回归。
- 报告附防重入 file:line + 全退出路径清位自证。
- 审查按 `tasks/R-WAVE9.md` R:T-ADVANCE-REENTRY（**三闸**）。
