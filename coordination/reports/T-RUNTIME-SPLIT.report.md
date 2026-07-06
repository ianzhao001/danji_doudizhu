# T-RUNTIME-SPLIT 实现报告

- 实现方标识：Codex / GPT-5
- 分支：`task/T-RUNTIME-SPLIT`
- 状态：in-review

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
  - `npm --prefix test test`：
  - `npm --prefix test run typecheck`：
- merge commit：
- BOARD 状态：
- 规划者批量结构性把关（仅高风险任务）：不适用（常规任务）

## 全量回扫（审查者·写 approved 前一次）
- 回扫范围 / 方法：待审查者填写
- 逐行细读新提交：待审查者填写
- 发现分流：
  - 域内致命（→ `changes-requested` 打回执行者）：待审查者填写
  - 域外致命（→ 转规划者派发定向修复）：待审查者填写
  - 拿不准（→ 转规划者非阻断建议单）：待审查者填写

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

## 批次交接记录 / 下一步（种档，供下一窗口自助读；配合 templates/handoff.md）
- 所属批次 / 任务号：A 波 / `T-RUNTIME-SPLIT`
- 本回合结论 / 状态：实现完成，in-review；未合并 main。
- 下一步找谁：审查者
- 用户终审配合（如适用）：不适用
- 给下一窗口的可粘贴提示词（指针化）：你是本仓库 `斗地主` 的审查型 AI。请读 `coordination/PROTOCOL.md`、`coordination/tasks/T-RUNTIME-SPLIT.md`、`coordination/tasks/R-WAVE8.md` 中 `R:T-RUNTIME-SPLIT` 检查单、`coordination/reports/T-RUNTIME-SPLIT.report.md`，评审 `git diff main..task/T-RUNTIME-SPLIT`。重点核 move-only、`RoundRuntime` 公共接口不变、`decidePlayAction(... history: gameEvents ...)` 链路不变、`round-runtime.ts <200`、新模块不进 `flow/index.ts`、测试/typecheck 全绿；通过后按协议写 `approved` 并由审查者执行双闸合并。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] `git status --short --untracked-files=all` 已记录，越域未跟踪文件已清理或说明
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获精确机器态 `approved` 前未合并 main；高风险 `approved-pending-planner` 未直接合并；获批后仅由审查者通过 `agentctl.sh claim/merge/release` 合并
- [x] 未 import cc
