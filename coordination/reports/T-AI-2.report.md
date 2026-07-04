# T-AI-2 实现报告

- 任务：T-AI-2 — 困难档拉开：压制性领出 + 残局收割 + 三档排序闭环 + 文案对齐
- 分支：`task/T-AI-2`
- 实现者：Codex
- 日期：2026-07-04

## 改动概述

- 更新 `assets/scripts/ai/levels/hard.ts`
  - 提高 Hard 首出评分中的成型牌权重，避免在质量门采样中回落到单张散出。
  - 新增 pressing 领出路径：对手短手时优先出安全非炸弹的多张牌；无可用多张牌时领最大单张，避免送低单。
  - 新增短手残局跟牌收割：自己手牌很短且跟牌后剩余手牌可一手走完时，优先选择控制牌夺权。
  - 保留非 pressing 长手不拆炸弹/火箭的守卫语义；未改 `compareMoves`、`pickSmallest`、`pickLargest`。
- 更新 `assets/scripts/data/difficultyConfig.ts`
  - 仅同步三档 description 文案，使“简单/普通/困难”的行为差异更清晰。

## 启发式取舍

- pressing 领出先过滤炸弹/火箭和受保护大牌；仍有安全牌时，按“剩余粗略墩数更少、一次出牌张数更多、牌型更成型”评分。
- 短手收割只在 `hand.length <= 4` 生效，且必须满足跟牌后剩余手牌能一手走完；这样能覆盖 `AA2` 跟单出 `2` 的控权案例，同时避免长手阶段过度消耗控制牌。
- 组合首出权重集中给顺子、连对、飞机和三带，目标是把 Hard 保持在与 Normal 同带但不回落，同时把真正的强弱差异交给 pressing/残局时机与胜率门。

## 质量指标实测

来自目标与关键回归测试：

| 指标 | Normal | Hard | 门槛 |
|---|---:|---:|---:|
| 组合首出率 | 0.9846153846153847 | 0.9933774834437086 | Hard >= 0.50 且 >= Normal - 0.05 |
| 压队友率 | 0 | 0 | Hard <= 0.08 |
| leadComboOps | 130 | 151 | 采样信息 |
| teammateBeatOps | 99 | 67 | 采样信息 |

胜率差：

| 指标 | 数值 | 门槛 |
|---|---:|---:|
| Hard vs Normal diff | 0.13333333333333336 | >= 0.03 |
| Hard vs Simple diff | 0.6333333333333333 | >= 0.10 |
| Hard vs Normal targetA | 0.5166666666666667 | 采样信息 |
| Hard vs Normal targetB | 0.38333333333333336 | 采样信息 |
| Hard vs Simple targetA | 0.8333333333333334 | 采样信息 |
| Hard vs Simple targetB | 0.2 | 采样信息 |

## 验证

- ✅ `npm --prefix test test -- ai/hard-timing.test.ts ai/hardening.test.ts selfplay/quality.test.ts data/difficulty-config.test.ts ai/hard.test.ts ai/hard-depth.test.ts ai/normal-combo.test.ts ai/tie-breaker.test.ts ai/simple.test.ts ai/conservative-action-paths.test.ts ai/hint.test.ts ai/hint-rank.test.ts`
  - 12 files / 57 tests passed。
- ✅ `npm --prefix test test`
  - 140 files / 710 tests passed。
- ✅ `npm --prefix test run typecheck`
  - `tsc --noEmit` passed。
- ✅ `git diff --check`
- ✅ `rg -n "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/ai/levels/hard.ts assets/scripts/ai/endgame.ts assets/scripts/data/difficultyConfig.ts`
  - 无匹配（命令以 1 退出，表示未发现 `cc` import）。

## 风险与后续

- 本任务没有改 `endgame.ts`；收割逻辑目前只在 Hard 策略内生效，符合文件域和最小改动原则。
- 当前 worktree 仍有两份无关未跟踪 `.meta` 文件，未纳入本任务提交。

## 审查者验收披露（2026-07-04）

- **评审结论**：approved
- **打回轮次**：0（首次通过）
- **种子完整性**：种子提交 `9678b97`（规划者）与实现提交 `c562e45`（执行者）分离；执行者仅改 `hard.ts`+`difficultyConfig.ts`+报告，未碰测试文件。
- **红线核查**：`simple.ts`/`normal.ts`/`lead-score.ts`/`_shared.ts` 零改动；无 `rng.` 新调用；`compareMoves`/`pickSmallest` 语义不动；`difficultyConfig` 仅 description 改动。
- **独立复跑**：140 files / 710 tests passed + typecheck 净 + 纯层零 cc。
- **质量门实测**：Hard 组合率 0.993≥0.50 且≥Normal(0.985)−0.05；压队友 0≤0.08；Hard−Normal +0.133≥+0.03；Hard−Simple +0.633≥+0.10。Normal>Hard 过渡态已关闭。

### 全量回扫（写 approved 前一次）
- 回扫范围 / 方法：grep 跨模块 import / cc 泄漏 / asset key 消费 / 交互面排查；不止本任务 diff。
- 逐行细读新提交：已做。`choosePressingLeadMove` 过滤炸弹/保护牌后选多张或最大单（K 案例）；`chooseControlFollow` 限 hand≤4 且跟牌后 `canFinishInOneMove` 才选控制牌；组合权重按牌型递增（Pair 32 → Airplane 100），相对序保持。
- 发现分流：
  - 域内致命（→ changes-requested）：无
  - 域外致命（→ 转规划者）：无
  - 拿不准（→ 转规划者非阻断）：无
