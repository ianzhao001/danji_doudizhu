# T-PAUSE-GATE 实现报告

- 实现方标识：Codex / GPT-5
- 分支：`task/T-PAUSE-GATE`
- 状态：approved-pending-planner（三闸高风险·审查者已审毕·排队待规划者结构性把关）

## 改了哪些文件
- `assets/scripts/flow/round-runtime.ts`
  - `RoundRuntime` 接口新增 `pause()` / `resume()` / `isPaused()`。
  - `RoundRuntimeImpl` 新增 `paused` / `pauseRequested` 状态，并将三方法转发到 runtime driver。
  - `dispose()` 清理暂停标记；disposed 后 `pause()` / `resume()` 为幂等 no-op，不复活 runtime。
- `assets/scripts/flow/runtime/bidding-driver.ts`
  - `RuntimeDriverContext` 扩展 `paused` / `pauseRequested` 字段。
  - 新增 `runtimePause` / `runtimeResume` / `runtimeIsPaused`。
  - `advanceRuntimeUntilPause` 在主循环入口加 paused gate；在 bidding/play 两处 `sleepForRuntimeAi` 醒后、决策前再次检查 paused，命中即 return。
  - `runtimeResume` 清 gate 后重新调用 `scheduleRuntimeAdvance`。
- 复跑确认（2026-07-07 11:39 CST）：规划者修正种子后，执行者复跑 `runtime-pause` 4/4、全量 144/750、typecheck 全绿；实现无需改动，转审查者评审。

## 接口 diff + gate 插入点
- `round-runtime.ts:60-76`：`RoundRuntime` additive API。
- `round-runtime.ts:108-109`：pause 状态字段。
- `round-runtime.ts:148-152`：impl 三方法转发。
- `round-runtime.ts:166-170`：dispose 清理 pause 状态。
- `bidding-driver.ts:52-79`：`RuntimeDriverContext` 增字段。
- `bidding-driver.ts:134-150`：pause/resume/isPaused driver 函数。
- `bidding-driver.ts:207-208`：主循环 paused gate。
- `bidding-driver.ts:230-232`：叫抢 AI sleep 醒后、决策前 paused gate。
- `bidding-driver.ts:246-248`：出牌 AI sleep 醒后、决策前 paused gate。

## 测试与类型检查输出
```
$ npm --prefix test test -- runtime-pause
flow/runtime-pause.test.ts: 4 tests, 4 passed (规划者修正种子后)

$ npm --prefix test test -- runtime-resume-phases round-runtime-hardening
2 test files passed, 12 tests passed

$ npm --prefix test run typecheck
tsc --noEmit passed

$ npm --prefix test test
144 test files passed, 750 tests passed

$ git diff --check
passed

$ rg -n "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/flow assets/scripts/game assets/scripts/rules assets/scripts/ai assets/scripts/data
no matches
```

## 工作树状态
```
$ git status --short --untracked-files=all
 M assets/scripts/flow/round-runtime.ts
 M assets/scripts/flow/runtime/bidding-driver.ts
?? coordination/reports/T-PAUSE-GATE.report.md
```

## 非文字模态 / IDE 实操验收证据
- 不适用。本任务为纯逻辑 flow 改动，未涉及 Cocos Creator / IDE / 浏览器实操。

## 执行者视觉自审勾销表
- 不适用。本任务无 UI / 场景 / 视觉产物。

## 与 spec 的偏差 / 关键决策
- 未改测试；未改 `game/` / `rules/` / `flow/types.ts` / `driver.ts` / `policies.ts` / `clock.ts` / `event-replay.ts` / `persistence.ts`。
- `submitPlayerAction` 未加 paused 拒绝逻辑：暂停态仍按原路径接受玩家动作，随后进入 `advanceRuntimeUntilPause` 时被 paused gate 拦住 AI 自驱动。
- `pauseRequested` 与 `paused` 同步作为 gate 状态；`resume()` 只有在此前确实 paused/requested 时才重调度，重复 resume 不重复调度。

## 阻塞升级（转规划者）
- 阻塞类型：spec/测试矛盾。
- 已尝试路径：
  - 已实现公共 pause API 与 driver gate。
  - 已确认暂停后 in-flight sleep 醒来不会提交该 AI 步：`runtime-pause.test.ts` 第二例在 line 118-119 已通过，state 保持 `turn=2`。
  - 已确认暂停态玩家主动动作仍接受、disposed 后 pause/resume 幂等：对应种子第 3/4 例通过。
  - 已跑 `runtime-resume-phases` / `round-runtime-hardening`，一张牌出完立即 settled 的既有契约仍绿。
- 失败证据：
  - `test/flow/runtime-pause.test.ts:103-105` 构造 `heroSeat=1`、`turn=2`、seat2 手牌 `[R4]`、`top=null`。
  - 现有规则 `game/core.ts:147-155` 明确：玩家出完最后一张牌立即 `GamePhase.Settled`。
  - 现有座位流转 `game/seat.ts:8-9` 为 `nextSeat = (seat + 1) % 3`，即 seat2 下一位是 seat0，不是 hero seat1。
  - 因此 resume 后 seat2 若按合法 AI 自驱动领出 `[R4]`，结果应为 settled；即便 seat2 不结算且只推进一手，下一位也会是 seat0，不会是 hero seat1。种子 line 130 期待 `runtime.isPlayerTurn() === true` 与现有规则/座位顺序不相容。
- 为什么不能由执行者/审查者继续解决：
  - 若为了 line 130 通过而跳过 AI 最后一手、伪造 turn、改变 settled 判断、改变 seat 顺序或让 AI 非法 pass，都会触碰 `game/` 语义或破坏既有 runtime 契约，超出本任务文件域且属于规避性实现。
  - 测试由规划者维护，执行者不得修改。
- 建议选项：
  - 调整种子第二例，使 resume 后一手 AI 合法推进到 hero gate，例如将 `heroSeat` 改为 `0`，并让 seat2 手牌至少 2 张，避免一手出完 settled。
  - 或将该断言改为验证 resume 后继续推进到合法终点（本构造下为 `settled`），但这会弱化“继续推进至 player-gate”的原测试意图。
- 需规划者裁定的问题：
  - `runtime-pause.test.ts` 第二例应改为“resume 后到 hero gate”的可达牌局，还是接受当前构造下 resume 后 settled 的合法结果？

## 合并证据（approved 后由审查者回填）
- 合并前回归：
  - `npm --prefix test test -- runtime-pause`：4/4 绿（执行者复跑确认）。
  - `npm --prefix test test`：144/750 绿（执行者复跑确认）。
  - `npm --prefix test run typecheck`：passed。
- merge commit：待审查者回填。
- BOARD 状态：待审查者 / 规划者。
- 规划者批量结构性把关（仅高风险任务）：待审查者置 `approved-pending-planner` 后由规划者回填。

## 审查者评审段（GLM-5.2·2026-07-07 12:20 CST）

### 检查单逐项核销（R-WAVE9 R:T-PAUSE-GATE）
- [x] **种子未改**：`git diff main..task -- test/` 仅含 `runtime-pause.test.ts`（规划者种子 `c092b19` + 规划者修正 `36cbf33`）；执行者实现提交 `93cbc29` 零触 test/；4 用例全绿（原 2 红+1 绿→4 绿，规划者修正后 2 红转绿）。
- [x] **文件域**：产品码仅 `flow/round-runtime.ts`（+16 行）+ `flow/runtime/bidding-driver.ts`（+23 行）+ report；`game/`/`rules/` 零触碰；`flow/types.ts`/`driver.ts`/`policies.ts`/`clock.ts`/`runtime/event-replay.ts`/`runtime/persistence.ts` 零 diff。
- [x] **RoundRuntime 接口**：加 `pause(): void` / `resume(): void` / `isPaused(): boolean` 三方法（`round-runtime.ts:67-69`）；既有 14 方法签名一字不动；`submitPlayerAction` 暂停态仍接受——`submitRuntimePlayerAction` 先处理玩家动作再调 `advanceRuntimeUntilPause`，后者在 while 顶部被 paused gate 拦截即 return（契约·非 bug·种子第 3 例钉此语义）。
- [x] **gate 位置**：3 处 gate——① `advanceRuntimeUntilPause` while 顶部（`bidding-driver.ts:207`·step 计数前）② 叫抢 `sleepForRuntimeAi` 醒后、`decideBidAction` 前（`:231`）③ 出牌 `sleepForRuntimeAi` 醒后、`decidePlayAction` 前（`:247`）；in-flight sleep 醒来若 paused → return（丢弃该步决策）；`runtimeResume` 清 gate 后调 `scheduleRuntimeAdvance` 重启循环。
- [x] **disposed 幂等**：`runtimePause`/`runtimeResume` 首行 `isRuntimeDisposed` 检查→return；`dispose()` 清 `paused=false`/`pauseRequested=false`；`runtimeIsPaused` 返回 `!disposed && (paused||pauseRequested)`→disposed 后恒 false；种子第 4 例验证 `pause()/resume()` 不抛、不复活。
- [x] **headless 零影响**：`driver.ts` 无 `pause`/`resume`/`isPaused` 调用（`rg` 确认）；runtime 全家（resume-phases/hardening/diagnostics/exceptions/bidding-visibility/round-runtime/policy-history/driver*）零改动全绿。
- [x] **全量零回归**：`npm --prefix test test` 144 文件/750 用例全绿（27.65s）；`npm --prefix test run typecheck` 净；`git diff --check` 净。

### 逐行细读结论
- **round-runtime.ts**：接口 3 方法纯加法，位于 `isPlayerTurn()` 与 `legalInputs()` 之间，不影响既有调用方。impl 3 方法为一行转发（`runtimePause(this.driverContext())` 等），与既有风格一致。`driverContext()` 用 `this as unknown as RuntimeDriverContext`——impl 的 `paused`/`pauseRequested` 私有字段即 context 字段（同一对象引用），转发直接写读。`dispose()` 增两行清理，与既有 `subscribers.clear()` 同位。
- **bidding-driver.ts**：`RuntimeDriverContext` 加两字段（`paused`/`pauseRequested`·均为 `boolean`）。3 新函数语义正确——`runtimePause`：disposed 短路→置双 flag；`runtimeResume`：disposed 短路→未 paused/requested 短路（幂等）→清双 flag→`scheduleRuntimeAdvance`；`runtimeIsPaused`：`!disposed && (paused||pauseRequested)`。gate 三处插入点与 `isRuntimeDisposed` 检查同形同位（`:210,:225` 既有模式），风格一致。`paused` 与 `pauseRequested` 当前始终同步赋值/清除，OR 检查冗余但无害（预留语义扩展）。
- **submitPlayerAction 契约**：暂停态调用时，`submitRuntimePlayerAction` 先执行 `applyPlayStep`/`applyBiddingStep`（改 state/turn），再 `await advanceRuntimeUntilPause`（paused gate 立即 return）。效果：玩家动作被处理、turn 前进到下一席，但 AI 不自驱动。与 spec "照常处理并推进到下一个 player-gate" 一致——暂停态下 "gate" 即 paused gate 立即返回。

### 全量回扫（审查者·写 approved-pending-planner 前一次）
- **RoundRuntime 消费者**：`game-scene-skeleton.ts`（`private runtime: RoundRuntime | null`·`startRoundRuntime`/`resumeRoundRuntime` 创建·`currentSnapshot` 返回类型引用）、`seats-renderer.ts`（`runtime: RoundRuntime | null` 纯类型）—— 均为纯消费方，接口加法不破坏。
- **RuntimeDriverContext 消费者**：仅 `round-runtime.ts`（`driverContext()` 构造）+ `bidding-driver.ts`（所有 runtime 函数参数）—— 均在文件域内，无外部消费者。
- **flow/index.ts 桶**：零 diff（未导出新函数·pause/resume/isPaused 通过 RoundRuntime 接口暴露·不经桶）。
- **driver.ts runHeadlessRound**：无 pause/resume/isPaused 调用 → headless 自对弈模式零影响。
- **cc import**：`rg` 确认 flow/ 全目录无 `cc` import。
- **全量回归**：144/750 绿 + typecheck 净 + diff --check 净。

### 回扫升级（转规划者）
- **拿不准（非阻断）**：`scheduleRuntimeAdvance` 是 fire-and-forget async（`void advanceRuntimeUntilPause(runtime).catch(...)`）。若 `resume()` 在旧 advance 循环的 `clock.sleep` 尚未 resolve 时被调用（即 pause 后 sleep 未醒即 resume），会启动第二个 advance 循环，可能导致两个循环并发推进状态。当前种子用 `PendingClock` 控制时序不会触发（测试中 `resolveAll()` → `await flush()` 确保旧循环退出后再 `resume()`）；生产环境 `realClock` + `thinkingDelayMs > 0` 时存在理论窗口。此为 **pre-existing 设计模式**（constructor 和 `submitRuntimePlayerAction` 也有同样的 fire-and-forget 调用 `scheduleRuntimeAdvance`/`advanceRuntimeUntilPause`），**非本任务引入的回归**。建议规划者评估是否需要加 "advance loop running" 防重入标志（可另拆任务·不阻断本任务）。
- **域外致命**：无。
- **打回轮次**：0 轮。
- **回扫分流**：域内致命 0 / 域外致命 0 / 拿不准 1（上述·非阻断·转规划者）。

## 批次交接记录 / 下一步
- 所属批次 / 任务号：C 波 / `T-PAUSE-GATE`
- 本回合结论 / 状态：**approved-pending-planner**（三闸高风险·审查者已审毕·0 打回·回扫 0/0/1 拿不准非阻断）。审查者复跑 `runtime-pause` 4/4、全量 144/750 绿、typecheck 净、diff --check 净。排队待规划者批量结构性把关认可后改 `approved`，再由审查者执行 claim/merge/release。
- 下一步找谁：**规划者**（三闸结构性把关：RoundRuntime 接口加法纯增量·gate 位置与 isDisposed 同形同位·submitPlayerAction 暂停态契约·pauseRequested 冗余但无害·fire-and-forget 防重入建议）。
- 用户终审配合：不适用。
- 给下一窗口的可粘贴提示词：
  > 你是本仓库 `斗地主` 的规划型 AI。T-PAUSE-GATE 审查者已审毕置 `approved-pending-planner`（main `51b8bb3`·分支 `task/T-PAUSE-GATE` `e43aa91`·0 打回·回扫 0/0/1 拿不准非阻断）。先读：`coordination/PROTOCOL.md`、`coordination/tasks/R-WAVE9.md` R:T-PAUSE-GATE、`coordination/reports/T-PAUSE-GATE.report.md`（含审查者评审段+全量回扫+拿不准项）、`coordination/BOARD.md` 第九波 T-PAUSE-GATE 行。请做三闸结构性把关：① RoundRuntime 接口 3 方法纯加法·既有签名一字不动 ② gate 3 处插入点（while 顶 + bidding sleep 后 + playing sleep 后）与 isDisposed 同形同位 ③ submitPlayerAction 暂停态仍接受是契约（gate 在 advance 顶部拦截 AI·不拒玩家输入）④ disposed 后 pause/resume 幂等 ⑤ headless 零影响 ⑥ 全量 144/750 绿+typecheck 净。拿不准项：`scheduleRuntimeAdvance` fire-and-forget 在 resume 时若旧 sleep 未醒可能双循环并发（pre-existing·非回归·建议评估是否加防重入标志）。认可后请改 BOARD 状态为 `approved` 并通知审查者执行合并。

## 自检（对照验收项）
- [x] 测试全绿（4/4·规划者修正种子后 144/750 绿）
- [x] typecheck 无错
- [x] `git status --short --untracked-files=all` 已记录，越域未跟踪文件已说明
- [x] 仅改声明文件域
- [x] 未改测试（种子由规划者修正·执行者未触 test/）、未碰他人模块
- [x] 未获精确机器态 `approved` 前未合并 main；高风险三闸未合并
- [x] 未 import cc
