# M6-G11 round-runtime 各阶段断点续局护栏（第十一批·核心质量）

- 状态：**ready**（依赖 `flow/round-runtime.ts` 已在 main，含 L4 resume-to-settled 修复）
- 派发模式：纯逻辑 worktree · 禁 `cc` · 绿护栏
- 分支：`task/M6-G11-runtime-resume-phases`（`git worktree add ../斗地主.worktrees/M6-G11 -b task/M6-G11-runtime-resume-phases main`）
- 文件域：`test/flow/runtime-resume-phases.test.ts`（新）、report
- **不改产品码**（既有 `round-runtime.test.ts`/`round-runtime-exceptions.test.ts` 不改）

## 目标
系统覆盖 `resumeRoundRuntime` 从不同 `RoundState.phase` 恢复后的行为正确性，补强 L4 修复的回归面。

## 行为要求（测试钉死）
- 构造 ResumeSnapshot 覆盖三态恢复：
  - **playing 中途**：`phase()` 回 `'playing'`、`currentSnapshot()` 非空、`isPlayerTurn()` 与 state.turn 一致、可继续推进到 settled。
  - **bidding（若 runtime 支持从 bidding resume）**：按实际 API（先读 round-runtime 再写；不支持则 report 注明并略）。
  - **已 settled**：`phase()` 立即 `'settled'`、`onSettled` 被调用一次（L4 投影）、`currentSettlement` 非空。
- dispose 后不再 emit/推进（复用既有契约断言）。
- 注入确定时钟/seed 保证可复现；零 `cc`、对 `../data` 零 import（守分层）。

## 验收
- 全绿、typecheck 净、零 cc、`flow→data` 零 import、report 落盘。
