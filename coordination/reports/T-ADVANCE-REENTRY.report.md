# T-ADVANCE-REENTRY 实现报告

- 实现方标识：Codex / GPT-5
- 分支：`task/T-ADVANCE-REENTRY`
- 状态：in-review（三闸高风险·待审查者按 R-WAVE9 评审并置 `approved-pending-planner`）

## 改了哪些文件
- `assets/scripts/flow/runtime/bidding-driver.ts`
  - `RuntimeDriverContext` 新增 `advanceLoopRunning: boolean`。
  - `advanceRuntimeUntilPause()` 入口设置唯一防重入咽喉：运行中直接 return；否则置 `true` 后进入原循环。
  - 原循环体保持既有 paused/disposed gate 与 `runtimePause`/`runtimeResume`/`runtimeIsPaused` 本体不变。
  - 用 `finally` 在所有已进入循环的退出路径清 `advanceLoopRunning = false`。
- `assets/scripts/flow/round-runtime.ts`
  - `RoundRuntimeImpl` 私有字段新增 `advanceLoopRunning = false`。
  - 未改 `RoundRuntime` 公共接口，未新增公共方法。

## 防重入 file:line 与清位自证
- 状态字段：
  - `assets/scripts/flow/runtime/bidding-driver.ts:75`：`RuntimeDriverContext.advanceLoopRunning`。
  - `assets/scripts/flow/round-runtime.ts:110`：`RoundRuntimeImpl` 私有字段初始化 `false`。
- 单一咽喉：
  - `assets/scripts/flow/runtime/bidding-driver.ts:207-208`：入口 `if (runtime.advanceLoopRunning) return;`，随后置位。
  - `assets/scripts/flow/runtime/bidding-driver.ts:199-200`：`scheduleRuntimeAdvance` 未加第二处检查，仍统一调用 `advanceRuntimeUntilPause()`。
- 全退出路径清位：
  - `assets/scripts/flow/runtime/bidding-driver.ts:209-272`：原循环体被包在 `try/finally` 内。
  - `assets/scripts/flow/runtime/bidding-driver.ts:270-271`：`finally` 无条件清 `advanceLoopRunning = false`。
  - 已进入循环后的所有 return 都穿过 `finally`：paused gate `:212`、maxTurns `:213-215`、bidding missing `:220-222`、bidding player-gate `:232`、disposed/paused after bidding sleep `:235-236`、settled finish `:244-246`、playing player-gate `:248`、disposed/paused after play sleep `:251-252`、unknown phase `:266`。
  - 异常路径：`catch` 在 `:268-269` 记录 error termination 后仍进入 `finally` 清位。
  - disposed while 条件退出：`while (runtime.currentPhase !== 'disposed')` 在 `:211` 退出后同样落到 `finally` 清位。
  - 重入早退 `:207` 发生在置位前，不需要清位，也不改变现有活循环。

## submit flag=true 不可达论证
- `submitRuntimePlayerAction()` 首行 `runtimeIsPlayerTurn()` 守卫在 `assets/scripts/flow/runtime/bidding-driver.ts:158`；非玩家 gate 直接 `NOT_PLAYER_TURN`。
- 活跃 advance loop 只在 AI turn 上 `sleepForRuntimeAi()`，到 player-gate 会 return：bidding player-gate `:232`、playing player-gate `:248`。
- 因此能通过 submit 守卫时，旧 advance loop 已经在 player-gate 退出并通过 `finally` 清掉 flag；AI turn 上 submit 不会通过守卫。
- 结论：`advanceLoopRunning === true` 时 submit 通过守卫不可达。故 `submitRuntimePlayerAction()` 末尾 `await advanceRuntimeUntilPause(runtime, events)` 保持原事件桶语义；种子第 3 例锁定 submit 后 AI 照常推进。

## 测试与类型检查输出
基线红：
```
$ npm --prefix test test -- runtime-advance-reentry
flow/runtime-advance-reentry.test.ts: 1 failed, 2 passed
- resume 在旧 sleep 未醒时多起第二循环：clock.sleeps.length expected 1, received 2

$ npm --prefix test run typecheck
tsc --noEmit passed
```

实现后：
```
$ npm --prefix test test -- runtime-advance-reentry
Test Files  1 passed (1)
Tests       3 passed (3)

$ npm --prefix test test
Test Files  146 passed (146)
Tests       756 passed (756)

$ npm --prefix test run typecheck
tsc --noEmit passed

$ git diff --check
passed

$ rg -n "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/rules assets/scripts/game assets/scripts/ai assets/scripts/flow assets/scripts/data
no matches
```

## 工作树状态
```
$ git status --short --untracked-files=all
 M assets/scripts/flow/round-runtime.ts
 M assets/scripts/flow/runtime/bidding-driver.ts
?? coordination/reports/T-ADVANCE-REENTRY.report.md
```

## 非文字模态 / IDE 实操验收证据
- 不适用。本任务为纯逻辑 flow 推进改动，未涉及 Cocos Creator / IDE / 浏览器实操。

## 执行者视觉自审勾销表
- 不适用。本任务无 UI / 场景 / 视觉产物。

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `scheduleRuntimeAdvance()` 未新增第二处检查；防重入只在 `advanceRuntimeUntilPause()` 入口。
- `runtimePause()` / `runtimeResume()` / `runtimeIsPaused()` 本体未改；paused/disposed 既有 gate 位置与语义保持。
- 未改 `RoundRuntime` 公共接口；未改 `game/`、`rules/`、`flow/types.ts`、`driver.ts`、`policies.ts`、`clock.ts`、`event-replay.ts`、`persistence.ts`。
- 按把关记录②流程观察，BOARD 状态行不在分支更新；分支只承载实现与报告。

## 疑问 / 需规划者裁定
- 无。

## 阻塞升级
- 不适用。

## 合并证据（approved 后由审查者回填）
- 合并前回归：
  - `npm --prefix test test`：146/756 绿。
  - `npm --prefix test run typecheck`：passed。
- merge commit：待审查者回填。
- BOARD 状态：待审查者在 main 工作树更新。
- 规划者批量结构性把关（仅高风险任务）：待审查者置 `approved-pending-planner` 后由规划者回填。

## 全量回扫（审查者·写 approved 前一次）
- 待审查者填写。

## 回扫升级（转规划者，全量回扫的域外致命 / 拿不准，由审查者填写）
- 待审查者填写。

## 批次交接记录 / 下一步
- 所属批次 / 任务号：C 波 / `T-ADVANCE-REENTRY`
- 本回合结论 / 状态：实现已按文件域完成；种子 3/3、全量 146/756、typecheck 均绿；状态 `in-review`。
- 下一步找谁：审查者（R-WAVE9 R:T-ADVANCE-REENTRY；三闸任务，通过后置 `approved-pending-planner` 排队待规划者结构性把关，不得直接合并）。
- 用户终审配合：不适用。
- 给下一窗口的可粘贴提示词：
  > 你是本仓库 `斗地主` 的审查者。请读取 `coordination/PROTOCOL.md`、`coordination/tasks/T-ADVANCE-REENTRY.md`、`coordination/tasks/R-WAVE9.md` 的 R:T-ADVANCE-REENTRY、以及 `coordination/reports/T-ADVANCE-REENTRY.report.md`，评审 `task/T-ADVANCE-REENTRY`。执行者仅改 `assets/scripts/flow/runtime/bidding-driver.ts`、`assets/scripts/flow/round-runtime.ts` 与报告；未改测试。验证已通过：`runtime-advance-reentry` 3/3、全量 `npm --prefix test test` 146/756 绿、`npm --prefix test run typecheck` 净、`git diff --check` 净、纯层无 `cc`。此任务为高风险三闸；若审查通过，请在 main 工作树置 `approved-pending-planner` 排队待规划者结构性把关，不得直接合并。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] `git status --short --untracked-files=all` 已记录，越域未跟踪文件已说明
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获精确机器态 `approved` 前未合并 main；高风险三闸未直接合并
- [x] 未 import cc
