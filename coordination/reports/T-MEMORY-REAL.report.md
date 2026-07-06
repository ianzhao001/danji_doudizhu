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

## 审查者裁定（GLM-5.2 · 2026-07-06）

**结论：approved-pending-planner**（高风险三闸·排队待规划者结构性把关），打回 0 轮。

### R-WAVE8 R:T-MEMORY-REAL 检查单逐项

1. **种子未改** ✅：`git diff 3548ae8 task/T-MEMORY-REAL -- test/` = 0 行（种子逐字未动）；7 用例全绿（hard-memory 5 + policy-history 2，含 2 红转绿）。
2. **文件域** ✅：产品码仅 `flow/{types,driver,round-runtime,policies}.ts` + `ai/{strategy,levels/hard}.ts` + report；BOARD 文件域列亦含 `policies`（R-WAVE8 检查单同），spec 文件域列未列 policies 但 BOARD/R-WAVE8 均含——policies 改动为 1 行透传 `history ?? []`，必要且最小。`game/`、`rules/` 零 diff（wc=0）；`_shared.ts`/`simple.ts`/`normal.ts`/`lead-score.ts`/`cardMemory.ts` 零 diff（wc=0）。
3. **AiStrategy 第三参可选** ✅：`(snapshot: GameSnapshot, rng: Rng, history?: GameEvent[])`——既有两参直调测试（hard/hardening/hard-timing/hard-depth/normal/normal-combo/simple/hint/hint-rank/conservative-action-paths 共 10 文件 46 用例）零改动全绿，逐一确认未被重跑豁免。`simpleStrategy`/`normalStrategy` 签名 `(snapshot) =>` 不消费第三参，TypeScript 协变合法。
4. **接管规则实现** ✅：
   - 条件：跟牌（`!snapshot.top` 分支前返回）、非 pressing（`isPressing` 分支前返回）、非队友顶（`isTeammateTop` 分支前返回）、history 非空（`history.length === 0 → null`）、仅 `Category.Single`（`snapshot.top?.pattern.category !== Single → null`）——全部满足。
   - 判断：`trackPlayed(history, hand)` → `remainingByRank`；`isAbsoluteTopSingle` 核该单牌之上所有 rank 计数全为 0（`ALL_RANKS.every(candidate => candidate <= rank || remaining[candidate] === 0)`）——逻辑正确。
   - 选择：`pickSmallest(candidates)` 取最小绝对最大单——符合 spec。
   - 插入位置：`chooseControlFollow` 之后、`conservativeAction` 之前——精确匹配 spec 钉死位置。
   - 空历史不触发（`history.length === 0 → null`）——回归锚覆盖。
5. **评分常数逐字未动** ✅：`scoreLeadMove`/`highCardSpendPenalty`/`categoryShapingBonus` diff 核数字零改动；`estimateMemoryPressure` 评分公式不变（仅 `trackPlayed([], hand)` → `trackPlayed(history, hand)`）。
6. **runtime 调用点** ✅：`driver.ts:177` `decidePlayAction({ state, playPolicy, rng, history: gameEvents })`（`gameEvents` 为主循环累积数组，`pushRoundEvents` 已在 main 存在填充）；`round-runtime.ts:324` `decidePlayAction({ ..., history: this.gameEvents })`（`this.gameEvents` 为 runtime 累积事件，`pushRoundEvents` 填充）。`policies.ts:19` `strategyFor(...)(snapshot, rng, history ?? [])` 透传。
7. **trackPlayed 本体未改** ✅：`cardMemory.ts` diff=0；`trackPlayed(events, ownHand)` 签名与体不变，仅调用点从 `[]` 改为真实 `history`。
8. **质量门重验** ✅：`selfplay/quality.test.ts` 4/4 绿；三档指标（组合率/压队友/胜率差）与 v1.2 基线逐项完全一致（不回退）；确定性无 rng 新消费（`_rng` 未用）。
9. **全量 vitest/typecheck/diff --check** ✅：分支 worktree 实跑 143/746 绿（26.74s）+ typecheck 净 + diff --check exit=0。

### 全量回扫（覆盖全仓）
- **decidePlayAction 调用面**：全仓仅 2 个调用点（driver + round-runtime），均在文件域内且已更新传 `history`；无外部调用者被破坏。`decidePlayAction` 签名 `history` 为必填（内部函数），`PlayPolicy.history` 为可选（公共类型）——设计合理。
- **PlayPolicy 调用面**：全仓 test/ 中 `save-resume-e2e`/`runtime-resume-phases`/`quality`/`difficulty`/`policies` 等均用 `({ snapshot, rng })` 或 `({ seat, snapshot })` 不解构 `history`——optional 兼容，typecheck 绿确认。
- **strategyFor 调用面**：全仓 test/ + selfplay/ 均两参直调——第三参可选，行为不变（`history = []` 默认，绝对最大单不触发）。
- **跨模块回归**：flow→ai 链路仅加法透传，无语义变更；`game/`/`rules/` 零触碰；UI 层不消费 `PlayPolicy`/`AiStrategy`（无 `cc` import）。
- 回扫分流：**0 域内致命 / 0 域外致命 / 0 拿不准**。

### 补充说明
- `driver.ts` `runHeadlessRound` 从直调 `playPolicy({ seat, snapshot: snap, rng })` 改为 `decidePlayAction({ state, playPolicy, rng, history: gameEvents })`——`snap` 变量移除（仅此处使用），`decidePlayAction` 内部调用 `snapshot(state, turn)` 等价，行为保持。
- `quality.test.ts` 的 `statsPolicy` 不解构 `history`、不向 `strategyFor` 传第三参——这是规划者测试设计（测策略隔离行为），执行者正确未改测试；指标不回退即满足 spec。

### 合并状态
- 高风险三闸：置 `approved-pending-planner` 排队，**不合并**。
- 待规划者结构性把关认可后改 `approved`，再由审查者合并。
