# M6-G14 AI 隐藏状态隔离 横切护栏（第十二批·核心质量）

- 状态：**ready**（依赖三档 AI + snapshot 已在 main）
- 派发模式：纯逻辑 worktree · 禁 cc · 绿护栏·不改产品码
- 分支：`task/M6-G14-ai-hidden-state-isolation`（`git worktree add ../斗地主.worktrees/M6-G14 -b task/M6-G14-ai-hidden-state-isolation main`）
- 文件域：`test/ai/ai-hidden-state-isolation.test.ts`（新）、report

## 目标
锁 ARCHITECTURE 契约「AI 不得修改隐藏状态、不得输出非法动作、只依据快照」。补一个横切护栏（既有 legality-matrix 偏合法性，本任务偏**隔离性/不变异**）。

## 行为要求（测试钉死）
- 构造若干 `GameSnapshot`（含 viewerHand）；调三档 `strategyFor(level)(snapshot, rng)`：
  - 断言**不修改 snapshot**（调用前后深相等：handCounts/top/viewerHand 等未变）。
  - 断言输出 `RoundAction` 合法（在该 snapshot 的 `enumerateMoves`/`legalFollows` ∪ pass 内）。
  - snapshot **不含**他人手牌（仅 handCounts）——确认 AI 不依赖隐藏字段（类型层已保证，测试再锁一道）。
- 以 `ai/strategy.ts` 实际签名 `(snapshot, rng)` 为准；用可设种子 rng 保证可复现。
- 零 cc。

## 验收
- 全绿、typecheck 净、零 cc、report 落盘。
