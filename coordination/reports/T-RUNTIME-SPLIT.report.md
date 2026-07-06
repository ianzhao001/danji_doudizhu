# T-RUNTIME-SPLIT 实现报告

- 实现方标识：Codex / GPT-5
- 分支：`task/T-RUNTIME-SPLIT`
- 状态：approved

## 改了哪些文件
- `assets/scripts/flow/round-runtime.ts`：收敛为 180 行公共 API + 状态持有 + 委托壳；保留 `RoundRuntime` 公共接口与旧内部 `advanceUntilPause()` 探针桥。
- `assets/scripts/flow/runtime/bidding-driver.ts`：搬出叫抢/出牌推进、玩家输入处理、AI sleep/redeal/错误终止逻辑；AI 出牌仍调用 `decidePlayAction({ state, playPolicy, rng, history: runtime.gameEvents })`，保持 T-MEMORY-REAL 真历史传参链路。
- `assets/scripts/flow/runtime/persistence.ts`：搬出逐手 `GameEvent` 累积、persist 写入、settled 结算/onSettled 派发。
- `assets/scripts/flow/runtime/event-replay.ts`：搬出订阅、启动 `deal` replay、subscriber 隔离投递。

未改 `test/**`、未改 `assets/scripts/flow/index.ts`，新 runtime 内部模块未进桶。

## 测试与类型检查输出
```
$ npm --prefix test test
Test Files  143 passed (143)
Tests       746 passed (746)
Duration    30.33s

$ npm --prefix test run typecheck
tsc --noEmit
exit 0
```

补充卫生检查：
```
$ wc -l assets/scripts/flow/round-runtime.ts
180 assets/scripts/flow/round-runtime.ts

$ git diff --check
exit 0

$ rg -n "from ['\"]cc['\"]|import\(['\"]cc['\"]\)" assets/scripts/flow assets/scripts/ai assets/scripts/game assets/scripts/data assets/scripts/rules
no matches

$ git diff -- test
no output

$ git diff -- assets/scripts/flow/index.ts
no output
```

## 工作树状态
```
$ git status --short --untracked-files=all
 M assets/scripts/flow/round-runtime.ts
 A assets/scripts/flow/runtime/bidding-driver.ts
 A assets/scripts/flow/runtime/event-replay.ts
 A assets/scripts/flow/runtime/persistence.ts
?? coordination/reports/T-RUNTIME-SPLIT.report.md
```

## Diff 摘要 / color-moved 说明
```
$ git diff --stat
 assets/scripts/flow/round-runtime.ts           | 371 +++----------------------
 assets/scripts/flow/runtime/bidding-driver.ts  | 297 ++++++++++++++++++++
 assets/scripts/flow/runtime/event-replay.ts    |  54 ++++
 assets/scripts/flow/runtime/persistence.ts     |  80 ++++++
 coordination/reports/T-RUNTIME-SPLIT.report.md | 130 +++++++++
 5 files changed, 603 insertions(+), 329 deletions(-)
```

`git diff --color-moved=zebra -- assets/scripts/flow/round-runtime.ts assets/scripts/flow/runtime` 已人工查看：从 `round-runtime.ts` 移出的访问器、输入枚举、submit、推进循环、event replay、persist/settled 等主体在新增模块中按 moved 色块显示；非 moved 的新增内容限于模块 import、内部上下文类型、门面委托调用与 `this` 接收者改为 `runtime` 接收者的模块边界适配。未引入行为分支、策略变更、测试改动或桶导出。

## 非文字模态 / IDE 实操验收证据（如适用，由执行者填写）
- 验收面：不适用（纯逻辑 move-only）
- 环境与版本：Node/Vitest 本地测试环境；未打开 Cocos Creator
- 操作步骤：不适用
- 原始证据路径（截图/录屏/样本/日志）：不适用
- 结果摘要：不适用
- 用户主观终审状态（如适用）：不适用
- 执行者配合用户终审记录（如适用）：不适用
- 审查边界：审查者仅核验证据链、步骤、环境、日志、用户终审记录与可复现说明；不亲验图像/音频/视频，不操作 Cocos Creator/IDE/浏览器，不替代用户下主观结论。

## 执行者视觉自审勾销表（UI/场景任务·双层视觉预审第一层·交规划者前必填）
- ① 元素重叠（节点框相交）：不适用
- ② 文字对比（浅底浅字/深底深字）：不适用
- ③ 文字包裹（按钮/面板背景未包住文字·文字溢出）：不适用
- ④ 闪烁/重渲（同帧重复动画·周期 render 抖动）：不适用
- 自审覆盖：不适用；存疑截图路径：不适用

## 合并证据（approved 后由审查者回填）
- 合并前回归：
  - `npm --prefix test test`：143 passed (143) / 746 passed (746) · 27.10s
  - `npm --prefix test run typecheck`：exit 0（净）
- merge commit：`6cc314f`（`--no-ff` 合并 · main 合并后 143/746 绿 + typecheck 净）
- BOARD 状态：done 6cc314f
- 规划者批量结构性把关（仅高风险任务）：不适用（常规任务）

## 全量回扫（审查者·写 approved 前一次）
- 回扫范围 / 方法：① 逐行细读 `git diff 93d5fff..task/T-RUNTIME-SPLIT` 全部 5 文件 diff（round-runtime.ts 收敛 + 3 新模块 + report）；② 跨模块回归——grep 全仓外部引用新 runtime 模块（`runtime/bidding-driver`/`persistence`/`event-replay`）、外部引用被搬移的私有方法名（`readonlyBidding`/`pushApplyResult`/`finishIfSettled`/`startDeal`/`enterPlaying`/`redeal`/`terminateWithError`/`sleepForAi`/`isReplayableStartupEvent`）、hardening test 探针桥（`advanceUntilPause` cast）；③ `--color-moved=zebra` 核纯搬移；④ 验证 `flow/index.ts` 桶零改动、`test/` 零改动、无 `cc` import。
- 逐行细读新提交：
  - `round-runtime.ts`：公共 `RoundRuntime` 接口签名逐字未变（`phase/currentSnapshot/currentBidding/biddingDeal/isPlayerTurn/legalInputs/submitPlayerAction/onEvent/settlement/terminationReason/terminationDetail/dispose`）；构造器逻辑原样——`resume` 分支调 `finishRuntimeIfSettled(this.persistenceContext())`、非 resume 调 `startRuntimeDeal(this.driverContext())`、末尾 `scheduleRuntimeAdvance(this.driverContext())`；私有 `advanceUntilPause` 桥保留（委托 `advanceRuntimeUntilPause(this.driverContext(), bucket)`）供 hardening test cast 探针；私有 `emit` 桥保留（委托 `emitRuntimeEvent`）；context 三个访问器 `driverContext()/eventReplayContext()/persistenceContext()` 用 `this as unknown as ...` cast（TS private 仅编译期，运行时字段/方法均在对象上，cast 合法）。
  - `bidding-driver.ts`：逐函数比对原 `RoundRuntimeImpl` 方法体——`runtimeSnapshot/runtimeBidding/runtimeBiddingDeal/runtimeIsPlayerTurn/runtimeLegalInputs/submitRuntimePlayerAction/startRuntimeDeal/scheduleRuntimeAdvance/advanceRuntimeUntilPause/sleepForRuntimeAi/isRuntimeDisposed/enterRuntimePlaying/redealRuntime/terminateRuntimeWithError/readonlyBidding` 全部为原样搬移，`this.` → `runtime.` 替换；**关键链路**：`advanceRuntimeUntilPause` 中 `decidePlayAction({ state: runtime.state, playPolicy: runtime.playPolicy, rng: runtime.rng, history: runtime.gameEvents })` 与 T-MEMORY-REAL 传参逐字一致；`enterRuntimePlaying` 中 persist 调用提取为 `persistRuntimePlayingStart(runtime)`（persistence.ts），新增 `if (!runtime.state) return` 防御但 `createPlayingState` 恒返回非 null，不改变行为。
  - `persistence.ts`：`pushRuntimeApplyResult` 与原 `pushApplyResult` 逐行一致（`pushRoundEvents` → `emit` → `landlordDecided` 短路 → `persist`）；`persistRuntimePlayingStart` 为从 `enterPlaying` 提取的 persist 调用（含上述防御 guard）；`finishRuntimeIfSettled` 与原 `finishIfSettled` 逐行一致（settled 门控 → `winEventFrom` → `settleFromGameEvents` → `onSettled`）。
  - `event-replay.ts`：`subscribeRuntimeEvent/emitRuntimeEvent/isReplayableStartupEvent/deliverRuntimeEvent` 与原 `onEvent/emit/isReplayableStartupEvent/deliver` 逐行一致。
- 发现分流：
  - 域内致命（→ `changes-requested` 打回执行者）：0
  - 域外致命（→ 转规划者派发定向修复）：0
  - 拿不准（→ 转规划者非阻断建议单）：0

## 审查者裁定（GLM-5.2 · 2026-07-07）

**结论：approved**（常规·move-only 强化），打回 0 轮。

### R-WAVE8 R:T-RUNTIME-SPLIT 检查单逐项

1. **串行前置确认** ✅：分支基 `93d5fff`（含 T-MEMORY-REAL `done 408a2ea`），main 仅多 1 个规划者派发提交 `1739718`（BOARD/task 状态更新，不改产品码）。
2. **`RoundRuntime` 公共接口零变化** ✅：接口签名逐字未动（12 方法 + dispose）；`startRoundRuntime`/`resumeRoundRuntime` 导出签名未动。
3. **新模块不入 `flow/index.ts` 桶** ✅：`git diff 93d5fff..task/T-RUNTIME-SPLIT -- assets/scripts/flow/index.ts` = 0 行；全仓 grep 无外部引用 `runtime/bidding-driver|runtime/persistence|runtime/event-replay`（仅 round-runtime.ts 自身 import）。
4. **`--color-moved=zebra` 纯搬移** ✅：`git diff --color-moved=zebra --stat` 呈现搬移色块；非 moved 新增仅限模块 import 头、内部上下文类型定义（`RuntimeDriverContext`/`RuntimePersistenceContext`/`RuntimeEventReplayContext`）、门面委托调用与 `this`→`runtime` 接收者适配。未发现行为分支、策略变更或顺手改。
5. **runtime 全家测试零改动全绿** ✅：`git diff 93d5fff..task/T-RUNTIME-SPLIT -- test/` = 0 行；143 文件 746 用例全绿（27.10s）；hardening test `advanceUntilPause` cast 探针通过桥委托正常工作。
6. **T-MEMORY-REAL 真历史链路不变** ✅：`advanceRuntimeUntilPause`（bidding-driver.ts）中 `decidePlayAction({ ..., history: runtime.gameEvents })` 与 T-MEMORY-REAL 传参逐字一致；`gameEvents` 累积/传递语义原样搬迁。
7. **`round-runtime.ts <200 行`** ✅：`wc -l` = 180 行。
8. **typecheck 净** ✅：`tsc --noEmit` exit 0。
9. **`git diff --check`** ✅：exit 0（无空白错误）。
10. **纯层零 `cc` import** ✅：rg 无匹配。

### 回扫结论
- 0 域内致命 / 0 域外致命 / 0 拿不准；全量回扫覆盖全仓跨模块引用与 hardening test 探针兼容性。

## 与 spec 的偏差 / 关键决策
- `round-runtime.ts` 目标 `<200` 已满足（180 行）。
- 为保持既有 `round-runtime-hardening.test.ts` 的内部探针可用，门面保留同名私有 `advanceUntilPause()` 委托桥；公共 `RoundRuntime` 接口未新增/删改。
- 新模块未导入 `cc`，未加入 `flow/index.ts` 桶。
- 未手写 `.meta`，本任务新增的 `runtime/*.ts` 作为纯 TS 内部模块提交；Cocos 生成 meta 仍应由 Creator 负责。

## 疑问 / 需规划者裁定
- 无。

## 阻塞升级（转规划者，仅 blocked 时填写）
- 不适用。

## 回扫升级（转规划者，全量回扫的域外致命 / 拿不准，由审查者填写）
- 不适用。

## 验收披露
- 评审结论：approved（常规·move-only 强化）
- 打回轮次：0 轮
- 全量回扫范围与分流结果：全仓跨模块引用核 + hardening test 探针桥兼容性 + color-moved=zebra 纯搬移；0 域内致命 / 0 域外致命 / 0 拿不准
- 合并 commit：`6cc314f`
- 最终测试基线：main 合并后 143 文件 746 用例全绿（27.04s）+ typecheck 净 + diff --check 净

## 批次交接记录 / 下一步（种档，供下一窗口自助读；配合 templates/handoff.md）
- 所属批次 / 任务号：A 波 / `T-RUNTIME-SPLIT`
- 本回合结论 / 状态：审查者 approved + 合并完成（`6cc314f`）；main 已含 round-runtime 拆分（180 行壳 + 3 新内部模块）。
- 下一步找谁：规划者
- 用户终审配合（如适用）：不适用
- 给下一窗口的可粘贴提示词（指针化）：你是本仓库 `斗地主` 的规划型 AI。T-RUNTIME-SPLIT 已由审查者合并完成（main `6cc314f`·BOARD done·143/746 绿+typecheck 净·打回 0 轮·回扫 0/0/0）。先读：coordination/PROTOCOL.md、coordination/BOARD.md 第八批本任务行、coordination/reports/T-RUNTIME-SPLIT.report.md（含验收披露段）。A 波剩余 T-VIEW-SEAT / T-PROFILE-FOLLOWS / T-DOCS-SYNC 可继续随到随合。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] `git status --short --untracked-files=all` 已记录，越域未跟踪文件已清理或说明
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获精确机器态 `approved` 前未合并 main；高风险 `approved-pending-planner` 未直接合并；获批后仅由审查者通过 `agentctl.sh claim/merge/release` 合并
- [x] 未 import cc
