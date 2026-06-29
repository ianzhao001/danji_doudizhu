# M6-L5 selfplay 长回归（seeds 1..50 全 settled+零和+turns<300）

- 状态：**ready**（依赖 M6-L4 已并入 main `c08de19`——L4 的 resume-to-settled settle 投影已落，可基于改后 main 跑长回归）
- 派发模式：**纯逻辑 worktree + 纯 spec**（实现方自写 `selfplay-long.test.ts`，禁 `cc`·Vitest）
- 分支：`task/M6-L5-selfplay-long`（`git worktree add ../斗地主.worktrees/M6-L5 -b task/M6-L5-selfplay-long main`）
- 文件域（**只允许改这些**）：
  - `test/selfplay/selfplay-long.test.ts`（**新**·实现方自写，克隆 `test/selfplay/selfplay.test.ts` 把 1..30 扩到 1..50）
  - `coordination/reports/M6-L5-selfplay-long.report.md`（验证报告）
- 依赖：✅ **M6-L4 已 merge 入 main**（L4 改 round-runtime settle 行为，L5 基于改后 main 跑回归）

## 目标
扩大自对弈回归面：selfplay 从 seeds 1..30 扩到 50（QA_CHECKLIST.md「N 局无非法/死循环/无限等待」自动化护栏）。

## 为什么是 L4 后置而非并行
M6-L4 修改 round-runtime 的 settle 行为（resume-to-settled 补 settle 投影）。L5 的 selfplay 1..50 会触及 settle 路径，若与 L4 并行跑，结果基于改前代码、易过期。故 L5 **必须在 L4 merge 后**跑：基于改后 main 验证 1..50 全绿，确认 L4 的 settle 修改未引入回归。

## 行为要求（测试已钉死·见 `selfplay-long.test.ts`）
- seeds 1..50：每局 `phase==='settled'`、`turns < 300`（必终止无死循环）、三方分数和为 0（零和）、`landlord`/`winner` 合法。
- 可复现：同 seeds 跑两次 `SeedSummary[]` 深相等。
- 纯回归护栏——预计零源码改动即绿。若扩面命中未覆盖异常路径导致红，须**修复根因**（非改测试、非放宽断言）。
- 零 `cc` import（selfplay 层）。

## 执行流程
1. 从 main（含 L4 settle 修改）建 worktree/分支；克隆 `test/selfplay/selfplay.test.ts` → `selfplay-long.test.ts`，把 `length: 30` 改 `50`、描述改 `1..50`，断言（settled/零和/turns<300/landlord∈[0,2]/winner 非空 + 可复现深相等）原样保留。
2. 跑 `npm --prefix test test`，确认 1..50 全绿（单测耗时较长，必要时 `it` 设 60s timeout）。
3. 若全绿：落 `coordination/reports/M6-L5-selfplay-long.report.md`（seeds 数、耗时、零和/终止结论），提交，回 PROTOCOL 待架构 review/merge。
4. 若红：定位根因（多为扩面命中未覆盖异常路径或 L4 settle 副作用），**修源码根因**后重跑；**非改测试、非放宽断言**。若根因落在本任务文件域外，在 report 记录并联系架构。

## 验收
- `npm --prefix test test` 全绿（`selfplay-long.test.ts` 通过）
- `npm --prefix test run typecheck` 无错
- `M6-L5-selfplay-long.report.md` 落盘

## 测试命令
`npm --prefix test test`（seeds 1..50 耗时较长，单测设 60s timeout）
