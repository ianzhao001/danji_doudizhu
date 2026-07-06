# T-MEMORY-REAL 实现报告

- 实现方标识：Codex / GPT-5
- 分支：`task/T-MEMORY-REAL`
- 状态：in-review（三闸高风险；审查通过后应置 `approved-pending-planner`）

## 改了哪些文件
- `assets/scripts/flow/types.ts`：`PlayPolicy` 入参扩展 `history?: GameEvent[]`，保留旧直调兼容；driver/runtime 实际调用均传数组。
- `assets/scripts/flow/driver.ts`：`decidePlayAction` 接收累积 `history`，向 policy 传 `history.slice()`；`runHeadlessRound` 出牌循环传当前 `gameEvents`。
- `assets/scripts/flow/round-runtime.ts`：AI 出牌调用 `decidePlayAction` 时传 `this.gameEvents`。
- `assets/scripts/flow/policies.ts`：难度路由 policy 将 `history` 透传到 `strategyFor(...)(snapshot, rng, history)`。
- `assets/scripts/ai/strategy.ts`：`AiStrategy` 第三参新增可选 `history?: GameEvent[]`，旧两参调用保持合法。
- `assets/scripts/ai/levels/hard.ts`：`estimateMemoryPressure` 改用 `trackPlayed(history, hand)`；新增单牌绝对最大接管逻辑，位置在 `chooseControlFollow` 之后、`conservativeAction` 之前。
- `coordination/reports/T-MEMORY-REAL.report.md`：本报告。

## 测试与类型检查输出
```
$ npm --prefix test test -- ai/hard-memory.test.ts flow/policy-history.test.ts
Test Files  2 passed (2)
Tests       7 passed (7)

$ npm --prefix test test -- ai/hard.test.ts ai/hardening.test.ts ai/hard-timing.test.ts ai/hard-depth.test.ts ai/normal.test.ts ai/normal-combo.test.ts ai/simple.test.ts ai/hint.test.ts ai/hint-rank.test.ts ai/conservative-action-paths.test.ts
Test Files  10 passed (10)
Tests       46 passed (46)

$ npm --prefix test test -- flow/driver.test.ts flow/driver-diagnostics.test.ts flow/diagnostics.test.ts flow/policies.test.ts flow/policies-bid.test.ts flow/policy-history.test.ts flow/round-runtime.test.ts flow/round-runtime-hardening.test.ts flow/round-runtime-diagnostics.test.ts flow/round-runtime-exceptions.test.ts flow/runtime-resume-phases.test.ts flow/bidding-visibility.test.ts flow/illegal-action.test.ts integration/save-resume-e2e.test.ts integration/barrel-exports.test.ts
Test Files  15 passed (15)
Tests       52 passed (52)

$ npm --prefix test test -- selfplay/quality.test.ts
Test Files  1 passed (1)
Tests       4 passed (4)

$ npm --prefix test test -- --testTimeout=60000
Test Files  143 passed (143)
Tests       746 passed (746)

$ npm --prefix test run typecheck
tsc --noEmit
exit 0

$ git diff --check
exit 0
```

说明：Vitest 仍打印根 `package.json` `"type": "3d"` 的既有 Vite warning，非阻断。

### selfplay/quality 三档指标对照

前值使用 v1.2 收版质量门基线（同一确定性 seed/同一指标口径，BOARD 已记录）；后值为本分支 `selfplay/quality.test.ts` 实跑输出。

| 指标 | v1.2 前值 | 本分支后值 | 结论 |
|---|---:|---:|---|
| Simple 组合首出率 | 0 | 0 | 不回退 |
| Simple 压队友率 | 1 | 1 | 不回退 |
| Normal 组合首出率 | 0.9846153846153847 | 0.9846153846153847 | 不回退 |
| Normal 压队友率 | 0 | 0 | 不回退 |
| Normal−Simple 胜率差 | 0.6111111111111112 | 0.6111111111111112 | 不回退 |
| Hard 组合首出率 | 0.9933774834437086 | 0.9933774834437086 | 不回退 |
| Hard 压队友率 | 0 | 0 | 不回退 |
| Hard−Normal 胜率差 | 0.13333333333333336 | 0.13333333333333336 | 不回退 |
| Hard−Simple 胜率差 | 0.6333333333333333 | 0.6333333333333333 | 不回退 |

## 工作树状态
```
$ git status --short --untracked-files=all
M  assets/scripts/ai/levels/hard.ts
M  assets/scripts/ai/strategy.ts
M  assets/scripts/flow/driver.ts
M  assets/scripts/flow/policies.ts
M  assets/scripts/flow/round-runtime.ts
M  assets/scripts/flow/types.ts
?? coordination/reports/T-MEMORY-REAL.report.md
```

## 非文字模态 / IDE 实操验收证据（如适用，由执行者填写）
- 验收面：不适用（纯逻辑任务）
- 环境与版本：命令行 Vitest + TypeScript
- 操作步骤：见上方测试命令
- 原始证据路径（截图/录屏/样本/log）：不适用
- 结果摘要：不适用
- 用户主观终审状态（如适用）：不适用
- 执行者配合用户终审记录（如适用）：不适用
- 审查边界：审查者仅核验证据链、步骤、环境、日志、用户终审记录与可复现说明；不亲验图像/音频/视频，不操作 Cocos Creator/IDE/浏览器，不替代用户下主观结论。

## 执行者视觉自审勾销表（UI/场景任务·双层视觉预审第一层·交规划者前必填）
- 不适用：本任务无 UI/场景/截图产出。

## 合并证据（approved 后由审查者回填）
- 合并前回归：
  - `npm --prefix test test`：待审查者回填
  - `npm --prefix test run typecheck`：待审查者回填
- merge commit：待审查者回填
- BOARD 状态：待审查者回填
- 规划者批量结构性把关（仅高风险任务）：待审查者置 `approved-pending-planner` 后由规划者回填

## 全量回扫（审查者·写 approved 前一次）
- 待审查者填写。

## 与 spec 的偏差 / 关键决策
- `PlayPolicy.history` 在类型层保留为可选，以兼容既有测试和手写直调；driver/runtime 两条真实驱动路径每次都传数组，满足种子 probe 和运行时契约。
- `AiStrategy` 第三参为可选；`simple` / `normal` / `hint` / `conservative` 既有两参直调测试未改且全绿。
- `hard.ts` 的评分常数未改；`scoreLeadMove` / `highCardSpendPenalty` 数字保持原样。
- `trackPlayed` 本体未改；仅调用点从空数组改为真实 `history`。

## 接管规则实现说明
- 条件：跟牌、`snapshot.top.pattern.category === Category.Single`、history 非空、非队友顶牌、非 pressing。
- 插入位置：`hard.ts:251`，位于 `chooseControlFollow` 之后、`conservativeAction` 之前。
- 判断：`trackPlayed(history, hand)` 先扣已出牌和自手牌；若候选单牌以上所有 rank 的 `remainingByRank` 均为 0，则该候选为绝对最大单。
- 选择：在所有绝对最大单候选里用既有 `pickSmallest` 取最小者，避免无谓抬高。
- 空 history 不触发，旧行为由 `hard-memory.test.ts` 回归锚覆盖。

## runtime 调用点 diff 指认
- `assets/scripts/flow/driver.ts:74-85`：`decidePlayAction` 新增 `history: GameEvent[]`，传给 policy 时使用 `history.slice()`。
- `assets/scripts/flow/driver.ts:180-182`：`runHeadlessRound` 出牌循环传当前累积 `gameEvents`。
- `assets/scripts/flow/round-runtime.ts:320-325`：runtime AI 出牌传 `this.gameEvents`。
- `assets/scripts/flow/policies.ts:19`：`levelPolicies(...).playPolicy` 将 history 继续传入对应难度策略。

## 疑问 / 需规划者裁定
- 无执行阻塞。因任务为高风险三闸，审查者通过后应置 `approved-pending-planner`，等待规划者结构性把关。

## 阻塞升级（转规划者，仅 blocked 时填写）
- 不适用。

## 回扫升级（转规划者，全量回扫的域外致命 / 拿不准，由审查者填写）
- 待审查者填写。

## 批次交接记录 / 下一步（种档，供下一窗口自助读；配合 templates/handoff.md）
- 所属批次 / 任务号：第八批 v1.3 / `T-MEMORY-REAL`
- 本回合结论 / 状态：实现完成，种子测试、目标回归、质量门、全量 Vitest、typecheck 均通过；待审查者评审。
- 下一步找谁：审查者；审查通过后置 `approved-pending-planner` 并交规划者结构性把关。
- 用户终审配合（如适用）：不适用。
- 给下一窗口的可粘贴提示词（指针化）：你是本仓库 `斗地主` 的审查者，请读 `coordination/PROTOCOL.md`、`coordination/tasks/T-MEMORY-REAL.md`、`coordination/tasks/R-WAVE8.md` 的 R:T-MEMORY-REAL、`coordination/reports/T-MEMORY-REAL.report.md`，评审 `task/T-MEMORY-REAL`。重点核：种子未改、文件域、history 透传、`AiStrategy` 第三参可选、`trackPlayed` 本体未改、game/rules 零触碰、质量门不回退。此任务为高风险三闸，通过后置 `approved-pending-planner`，交规划者结构性把关。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] `git status --short --untracked-files=all` 已记录，越域未跟踪文件已清理或说明
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获精确机器态 `approved` 前未合并 main；高风险 `approved-pending-planner` 未直接合并；获批后仅由审查者通过 `agentctl.sh claim/merge/release` 合并
- [x] 未 import cc
