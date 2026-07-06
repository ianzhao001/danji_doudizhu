# T-PAUSE-GATE 实现报告

- 实现方标识：Codex / GPT-5
- 分支：`task/T-PAUSE-GATE`
- 状态：blocked

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
flow/runtime-pause.test.ts: 4 tests, 3 passed, 1 failed
唯一失败：
  T-PAUSE-GATE runtime 暂停门（对局冻结） > 真暂停门：pause() 后 AI sleep 醒来不推进，state 不变；resume() 后继续
  test/flow/runtime-pause.test.ts:130 expected runtime.isPlayerTurn() true, received false

$ npm --prefix test test -- runtime-resume-phases round-runtime-hardening
2 test files passed, 12 tests passed

$ npm --prefix test run typecheck
tsc --noEmit passed

$ npm --prefix test test
143 test files passed, 1 failed; 749 tests passed, 1 failed
唯一失败同 runtime-pause.test.ts:130

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
  - `npm --prefix test test`：blocked，见上方唯一失败。
  - `npm --prefix test run typecheck`：passed。
- merge commit：待审查者 / 规划者裁定后回填。
- BOARD 状态：待审查者 / 规划者裁定。
- 规划者批量结构性把关（仅高风险任务）：blocked，需先裁定种子矛盾。

## 全量回扫（审查者·写 approved 前一次）
- 待审查者填写。

## 回扫升级（转规划者，全量回扫的域外致命 / 拿不准，由审查者填写）
- 待审查者填写。

## 批次交接记录 / 下一步
- 所属批次 / 任务号：C 波 / `T-PAUSE-GATE`
- 本回合结论 / 状态：实现已按文件域完成，但被种子第二例不可达断言阻塞；状态 `blocked`。
- 下一步找谁：规划者。
- 用户终审配合：不适用。
- 给下一窗口的可粘贴提示词：
  > 你是本仓库 `斗地主` 的规划者。请读取 `coordination/PROTOCOL.md`、`coordination/tasks/T-PAUSE-GATE.md`、`coordination/reports/T-PAUSE-GATE.report.md`，并裁定 `test/flow/runtime-pause.test.ts:101-130` 的种子矛盾：当前牌局 `heroSeat=1/turn=2/seat2 单牌/top=null` resume 后按既有规则会 settled 或至少不会到 hero gate。请决定修正种子为可达 hero gate，或改验收为当前构造下的合法 settled 终点；裁定后再交执行者复跑并提审。

## 自检（对照验收项）
- [ ] 测试全绿（blocked：唯一失败见 `runtime-pause.test.ts:130`）
- [x] typecheck 无错
- [x] `git status --short --untracked-files=all` 已记录，越域未跟踪文件已说明
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获精确机器态 `approved` 前未合并 main；高风险三闸未合并
- [x] 未 import cc
