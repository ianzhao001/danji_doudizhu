# M6-G15 难度平衡度量护栏（第十三批·核心质量）

- 状态：**ready**（依赖三档 AI + selfplay runner 已在 main）
- 派发模式：纯逻辑 worktree · 禁 cc · 绿护栏·不改产品码
- 分支：`task/M6-G15-selfplay-balance`（`git worktree add ../斗地主.worktrees/M6-G15 -b task/M6-G15-selfplay-balance main`）
- 文件域：`test/selfplay/balance.test.ts`（新）、report；可复用 `runner.ts`/`difficulty.ts` helper（**不改** 既有断言测试）
- **不改产品码**

## 目标
量化「难度确实有梯度」：在固定种子集上，让 hard 与 simple 在**对等座位条件**下对弈，断言 hard 的胜率**不低于** simple（带容差），normal 介于其间或不劣于 simple。把「难度有效」从主观变成可回归的客观护栏。

## 行为要求（测试钉死·确定性）
- 用可复现 seeds 跑两组对照（如座位/角色对称轮换以消除地主先手偏置）：
  - hard vs simple×2、simple vs hard×2 等组合，统计 hero 胜率。
  - 断言：`winRate(hard) >= winRate(simple) - tol`（hard 不弱于 simple；tol 容差如 0.05），且整体每局仍 settled/零和/必终止。
- **若断言不成立**：说明难度梯度不显著 → 这是**暴露的产品问题**，在 report 标记并报架构（按审查纪律：先判是否既有实现缺口，再决定是否派 AI 调优任务），**不放宽容差糊弄**。
- 种子数足够稳（如各 ≥20 局）；设 `it` timeout；零 cc。

## 验收
- 全绿（或红时 report 明确暴露的梯度问题 + 建议）；typecheck 净、零 cc、report 列胜率矩阵 + 容差。
