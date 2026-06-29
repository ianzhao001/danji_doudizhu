# M6-G10 倍数连乘穷举护栏（第十一批·核心质量）

- 状态：**ready**（依赖 `game/settlement.ts` 已在 main）
- 派发模式：纯逻辑 worktree · 禁 `cc` · 绿护栏
- 分支：`task/M6-G10-multiplier-stacking`（`git worktree add ../斗地主.worktrees/M6-G10 -b task/M6-G10-multiplier-stacking main`）
- 文件域：`test/game/multiplier-stacking.test.ts`（新）、report
- **不改产品码**

## 目标
锁定 RULES「最终倍数 = 各来源连乘」：叫抢倍数 × 每炸弹翻倍 × 火箭翻倍 × 春天/反春天翻倍。穷举组合，断言乘积正确、最终分数 = 底分 × 倍数、零和。

## 行为要求（测试钉死）
- 构造 settlement 输入覆盖：bidMultiplier ∈ {1,2,4}、bombs ∈ {0,1,2,3}、含/不含火箭、spring ∈ {none, spring, anti-spring} 的组合（合理子集，确保每个来源各被验证至少一次且有叠加用例）。
- 断言：`settlement.multiplier` == 各来源连乘；`scores` 零和；地主/农民符号与 winner 一致；倍数恒为 ≥1 正整数。
- 以 `settlement.ts` 实际 API 为准（先读签名再写；不臆造字段）。
- 零 `cc`。

## 验收
- 全绿、typecheck 净、零 cc、report 落盘（列出验证的组合矩阵）。
