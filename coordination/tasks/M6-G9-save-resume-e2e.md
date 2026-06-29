# M6-G9 存档→断局→续局→结算→聚合 端到端护栏（第十一批·核心质量）

- 状态：**ready**（依赖全在 main：save/resume/session/aggregate/round-runtime）
- 派发模式：纯逻辑 worktree · 禁 `cc` · 绿护栏（行为已实现，写测试锁端到端不变量）
- 分支：`task/M6-G9-save-resume-e2e`（`git worktree add ../斗地主.worktrees/M6-G9 -b task/M6-G9-save-resume-e2e main`）
- 文件域：`test/integration/save-resume-e2e.test.ts`（新；可新建 `test/integration/` 目录）、report
- **不改产品码**（纯绿护栏；若红须修根因并在 report 报架构，不放宽断言）

## 目标
覆盖 QA_CHECKLIST「序列化与断局：存档→读档一致 / 读档后能合法继续」。把单局走到中途 → `serializeSave`/`deserializeSave`（或 session `persistRound`/`restoreRound`）→ `resumeRound` 续局 → 走到 `settled` → `aggregate` 聚合，断言全链路一致。

## 行为要求（测试钉死）
- 用可设种子 RNG 起一局，推进到出牌中途（非 settled），存档；反序列化得到等价 `RoundState`（深相等关键字段）。
- 用存档 `resumeRound`/`resumeRoundRuntime`（注 ResumeSnapshot）续局，合法推进到 `settled`。
- 续局结算的 `settlement.scores` 零和；`aggregate`(RoundFinishInput) 产出的 stats.rounds=1、records 追加 1 条、netScore 符号正确。
- 至少 2 个种子，确保非偶然。
- 零 `cc`。

## 验收
- `npm --prefix test test` 全绿（新 e2e 通过）、`typecheck` 净、零 cc、report 落盘。
