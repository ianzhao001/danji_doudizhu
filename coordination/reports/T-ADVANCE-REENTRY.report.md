# T-ADVANCE-REENTRY 实现报告

- 实现方标识：Codex / GPT-5
- 分支：`task/T-ADVANCE-REENTRY`
- 状态：approved-pending-planner（三闸高风险·审查者已审毕 `69468e5`·排队待规划者结构性把关）

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

## 审查者评审段（GLM-5.2·2026-07-07）

### 评审基线
- 分支：`task/T-ADVANCE-REENTRY`（HEAD `69468e5`）
- merge base：`1c9bdc9`（main HEAD at branch creation）；main HEAD = `cebbd93`（planner `cebbd93` 在分支建后于 main 更新 BOARD→ready + C 波续派记录②）
- 种子提交：`4b8a735`（planner `doudizhu-architect`）— 仅 `test/flow/runtime-advance-reentry.test.ts`
- 实现提交：`69468e5`（implementer）— `bidding-driver.ts` + `round-runtime.ts` + report

### 检查单逐项核销（R-WAVE9 R:T-ADVANCE-REENTRY）

1. **种子未改** ✅ — `git diff main..task -- test/` 仅含 `4b8a735` 种子提交（新增 `runtime-advance-reentry.test.ts` 157 行）；实现提交 `69468e5` 的 `diff-tree` 不含 `test/`。种子 3/3 全绿（1 红转绿 + 2 绿锚）。
2. **文件域** ✅ — `git diff --name-only main..task`（去 coordination/test）= `flow/runtime/bidding-driver.ts` + `flow/round-runtime.ts`，与 spec 声明一致。`flow/types.ts`/`driver.ts`/`policies.ts`/`clock.ts`/`event-replay.ts`/`persistence.ts` 零 diff（逐一验证）。`game/`/`rules/` 零触碰。
3. **RoundRuntime 公共接口零新增方法** ✅ — diff 仅 `RoundRuntimeImpl` 加 `private advanceLoopRunning = false;`（round-runtime.ts:110）；`interface RoundRuntime`（round-runtime.ts:60）零改动。
4. **防重入单一咽喉** ✅ — `advanceRuntimeUntilPause` 入口（bidding-driver.ts:207-208）：`if (runtime.advanceLoopRunning) return;` → 置 `true`。`scheduleRuntimeAdvance`（:199-200）不加第二处检查，仍统一调 `advanceRuntimeUntilPause()`。
5. **finally 全路径清位** ✅ — 循环体包进 try/finally（:209-272）；`finally`（:270-271）无条件 `runtime.advanceLoopRunning = false`。已进入循环后所有 return 均穿 finally：paused gate `:212`、maxTurns `:213-215`、bidding missing `:220-222`、bidding player-gate `:232`、disposed/paused after bidding sleep `:235-236`、settled finish `:244-246`、playing player-gate `:248`、disposed/paused after play sleep `:251-252`、unknown phase `:266`、while 正常退出（disposed）；catch `:268-269` 后亦入 finally；任何 throw 同样入 finally。重入早退 `:207` 在置位前，不需清位。
6. **语义锚** ✅ — ① resume 在旧 sleep 未醒时：guard 吞新调度→旧循环醒见未暂停续跑（恰一循环·不多一次 sleep）——种子①锁定 `sleeps.length===1`；② 旧循环因 paused 退出后 resume：finally 已清 flag→resume 重启正常——种子②锁定 `sleeps.length===2`（重启产生新 sleep）；③ 无丢唤醒：paused 退出必经 finally 清 flag。
7. **paused/disposed 既有 gate 零改动** ✅ — `runtimePause`（:136-140）/`runtimeResume`（:142-148）/`runtimeIsPaused`（:150-152）本体逐行核对未改；gate 位置（`:212`/`:235-236`/`:251-252`）与语义原样。
8. **submit 路径行为不变** ✅ — 执行者报告的「flag=true 时 submit 不可达」论证审查通过：submit 守卫 `:158` `runtimeIsPlayerTurn()` 在 AI turn 拒（`NOT_PLAYER_TURN`）；活循环只在 AI turn sleep、到 player-gate 必 return（finally 清 flag）；故 submit 通过守卫时 flag 必为 false，其 `await advanceRuntimeUntilPause` 照常执行——种子③锁定 submit 后 AI 推进 + 两过 reset 回 hero。
9. **runtime 全家零改动全绿** ✅ — 146 文件/756 用例全绿（含 runtime-pause/resume-phases/hardening/exceptions/diagnostics/bidding-visibility/round-runtime/policy-history/driver* 全家）。
10. **typecheck 净** ✅ — `tsc --noEmit` 无错。
11. **diff check 净** ✅ — `git diff --check main..task/T-ADVANCE-REENTRY` clean。
12. **纯层无 cc** ✅ — `rules`/`game`/`ai`/`flow`/`data` 无 `from "cc"` 匹配。

### 逐行细读判断
- 实现极简（+5 行 bidding-driver / +1 行 round-runtime），但覆盖面精确：单一咽喉 + finally 全路径清位 = 所有退出路径安全。
- `driverContext()` 返回 `this as unknown as RuntimeDriverContext`（round-runtime.ts:183）—— `advanceLoopRunning` 私有字段经此 cast 被 bidding-driver 读写，与 `paused`/`pauseRequested` 等既有字段同模式，无新 pattern。
- `advanceUntilPause` 私有方法（round-runtime.ts:176）为 pre-existing 死代码（无调用方），非本任务引入，不关注。
- BOARD.md diff 系分支落后 main（merge base `1c9bdc9` < main `cebbd93`），非执行者改 BOARD——与 T-LIVE-MULT 同模式，合并时需 3-way 取 main 版。

### 全量回扫（覆盖全仓）
- **回扫范围**：全仓 grep `advanceLoopRunning`/`advanceRuntimeUntilPause`/`scheduleRuntimeAdvance` → 仅 `flow/runtime/bidding-driver.ts` + `flow/round-runtime.ts` 引用；UI/game/rules/ai/data 零引用。全仓无 mock `RuntimeDriverContext` 的测试（均经 `startRoundRuntime`/`resumeRoundRuntime` 公共接口）。
- **跨模块回归推理**：新增 `advanceLoopRunning` 字段对 `RuntimeDriverContext` 接口是纯加法；`driverContext()` cast 模式使新字段直接映射 `RoundRuntimeImpl` 私有字段，不影响既有字段读写。guard 仅在 `advanceRuntimeUntilPause` 入口，不影响 `runtimePause`/`runtimeResume`/`runtimeIsPaused`/`submitRuntimePlayerAction` 的既有逻辑。
- **分流结果**：域内致命 0 · 域外致命 0 · 拿不准 0。

### 结论
- **approved-pending-planner**（三闸高风险·审查者已审毕·排队待规划者批量结构性把关）
- 0 打回 · 0 域外升级 · 0 非阻断建议
- 合并前须：规划者认可改 `approved` → 审查者处理 BOARD 3-way 冲突（取 main 版）→ main 双闸 → claim/merge/release

## 回扫升级（转规划者，全量回扫的域外致命 / 拿不准）
- 无。域内致命 0 · 域外致命 0 · 拿不准 0。

## 批次交接记录 / 下一步
- 所属批次 / 任务号：C 波 / `T-ADVANCE-REENTRY`
- 本回合结论 / 状态：审查者已审毕 `69468e5`，置 `approved-pending-planner`；种子 3/3、全量 146/756、typecheck 净、diff check 净、纯层无 cc；0 打回 / 0 域外 / 0 拿不准。排队待规划者批量结构性把关认可后改 `approved`，由审查者合并。
- 下一步找谁：**规划者**（三闸结构性把关：认可后改 BOARD `approved`，由审查者处理 BOARD 3-way 冲突 + main 双闸 + claim/merge/release）。
- 用户终审配合：不适用。
- 给下一窗口的可粘贴提示词：
  > 你是本仓库 `斗地主` 的规划型 AI。T-ADVANCE-REENTRY 审查者已置 `approved-pending-planner`（分支 `task/T-ADVANCE-REENTRY` `69468e5`·审查见 `coordination/reports/T-ADVANCE-REENTRY.report.md` 审查者评审段）。先读：`coordination/PROTOCOL.md`、`coordination/tasks/T-ADVANCE-REENTRY.md`、`coordination/reports/T-ADVANCE-REENTRY.report.md`、`coordination/BOARD.md` T-ADVANCE-REENTRY 行。请做三闸结构性把关：认可后在 main 工作树改 BOARD 本行 `approved-pending-planner`→`approved`，交审查者合并（合并注意：分支 merge base `1c9bdc9` < main `cebbd93`，BOARD 有 3-way 冲突，取 main 版；合并前 main 双闸 + worktree 双闸）。T-TERM-FEEDBACK 暂停接线骑士依赖本任务 done。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] `git status --short --untracked-files=all` 已记录，越域未跟踪文件已说明
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获精确机器态 `approved` 前未合并 main；高风险三闸未直接合并
- [x] 未 import cc
