# T-AI-1 实现报告

- 任务：T-AI-1 — 普通档脱胎：组合首出 + 农民不压队友
- 分支：`task/T-AI-1`
- 实现者：Codex
- 日期：2026-07-03

## 改动概述

- 新增 `assets/scripts/ai/levels/lead-score.ts`
  - 在保护炸弹/火箭的 safe 候选内进行普通档首出评分。
  - 优先连对、顺子、飞机、三带、对子等成型牌；无可用成型牌时回退最小安全单牌。
  - 对“5 张短顺子打完后只剩两个以上孤张、且整手无重复点数”的散牌手做克制回退，避免普通档过度贴近 Hard。
- 更新 `assets/scripts/ai/levels/normal.ts`
  - 首出 `top === null` 改走 `chooseNormalLeadMove`。
  - 跟牌仍复用 `conservativeAction`，保持最小代价压制。
  - 农民队友顶牌且地主手牌数 > 2 时默认 pass；当前座位仅剩 2 张以内时保留收官出口。
- 更新 `assets/scripts/ai/levels/_shared.ts`
  - 只新增 `isTeammateTop` 导出，未改 `compareMoves` / `pickSmallest` / `pickLargest` 语义。
- 更新 `assets/scripts/ai/levels/hard.ts`
  - 仅去重：`isTeammateTop` 改用 `_shared` 导出。
  - `cardKey` 去本地重复实现，按当前 rules 层已存在的公共函数从 `../../rules/guards` 引入；当前分支 `../../rules` barrel 未导出 `cardKey`，未越域修改 `rules/index.ts`。

## 质量指标实测

来自 `npm --prefix test test -- ai/normal-combo.test.ts ai/tie-breaker.test.ts selfplay/quality.test.ts ai/hard-depth.test.ts ai/hard.test.ts ai/hardening.test.ts ai/conservative-action-paths.test.ts ai/hint.test.ts ai/hint-rank.test.ts`：

| 指标 | Simple | Normal | 门槛 |
|---|---:|---:|---:|
| 组合首出率 | 0 | 0.9846153846153847 | Normal >= 0.35；Simple <= 0.15 |
| 压队友率 | 1 | 0 | Normal <= 0.20 |
| leadComboOps | 166 | 130 | > 20 |
| teammateBeatOps | 358 | 99 | 采样信息 |

胜率差：

| 指标 | 数值 |
|---|---:|
| targetA: 单席 Normal 对双席 Simple | 0.8 |
| targetB: 单席 Simple 对双席 Normal | 0.18888888888888888 |
| diff | 0.6111111111111112 |
| 门槛 | >= 0.05 |

## 验证

- ✅ `npm --prefix test test -- ai/normal-combo.test.ts ai/tie-breaker.test.ts selfplay/quality.test.ts ai/hard.test.ts ai/hardening.test.ts ai/conservative-action-paths.test.ts ai/hint.test.ts ai/hint-rank.test.ts`
  - 8 files / 38 tests passed。
- ✅ `npm --prefix test test -- ai/normal-combo.test.ts ai/tie-breaker.test.ts selfplay/quality.test.ts ai/hard-depth.test.ts ai/hard.test.ts ai/hardening.test.ts ai/conservative-action-paths.test.ts ai/hint.test.ts ai/hint-rank.test.ts`
  - 9 files / 42 tests 中 41 passed；唯一失败见下方“阻塞”。
- ✅ `npm --prefix test run typecheck`
- ✅ `git diff --check`
- ✅ `rg -n "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/ai/levels/lead-score.ts assets/scripts/ai/levels/normal.ts assets/scripts/ai/levels/_shared.ts assets/scripts/ai/levels/hard.ts`
  - 无匹配（命令以 1 退出，表示未发现 `cc` import）。

## 全量回归阻塞

`npm --prefix test test` 当前仍有 1 个跨任务旧合同失败：

- ❌ `test/ai/hard-depth.test.ts` / `M4-42 hard AI 纵深启发式 > 固定种子 selfplay：Hard 地主相对 Normal 基线有胜率与均分优势`
  - 当前结果：Hard landlord winRate = 0.5；Normal baseline winRate = 0.6666666666666666。
  - 失败原因：该 M4-42 护栏建立在旧 Normal 基线（最小单、会压队友）上；T-AI-1 的目标正是增强 Normal，导致 Hard 相对旧 Normal 的优势门漂移。
  - 前两个 `hard-depth` 行为断言已通过：Normal 在纯散短顺子样例仍出最小单；Normal 在自己仅剩 2 张以内时仍可压队友收官。
  - 继续修复该胜率门需要调整 `hard.ts` 深度策略或改写 M4-42 测试阈值，均超出 T-AI-1 对 `hard.ts` 的“仅两处机械替换 / 行为零变化”和“不可改测试”边界。

## 风险与后续

- 本分支已满足 T-AI-1 新增目标测试、质量门、相关 hard/hint/conservative 回归、typecheck 和纯层禁 `cc`。
- 合并前需要规划者/架构者处理 M4-42 与 T-AI-1 的相对强弱合同：要么给 Hard 新增 T-AI-2/T-HARD 后续增强，要么更新 `hard-depth` 中依赖旧 Normal 基线的胜率断言。

## 合并证据（审查者复审回填）

- 规划者裁定 + 种子修正：`3ffe8e9` — `hard-depth` 用例 4 摘除 `winRate/averageScore(Hard 地主) ≥ Normal 基线` 排序断言（12-seed 代理实测反转 Hard 0.5 vs Normal 0.667，非实现缺陷），保留 selfplay 不变量并留墓碑注释。三档排序契约迁移至 T-AI-2 对称质量门（Hard−Normal ≥ +0.03 / 90 局/侧），迁移期 main 上 Normal>Hard 为 BOARD 登记过渡态。纯测试提交，执行者实现 `9196d6c` 未动。
- 复审前回归（分支 `3ffe8e9`）：
  - `npm --prefix test test`：136 files / 669 tests passed
  - `npm --prefix test run typecheck`：tsc --noEmit passed
- merge commit：`9353f76`（--no-ff merge）
- 合并后基线：139 files / 703 tests 绿 + typecheck 净
- BOARD 状态：done `9353f76`
