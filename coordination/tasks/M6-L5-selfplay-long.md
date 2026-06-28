# M6-L5 selfplay 长回归（seeds 1..50 全 settled+零和+turns<300）

- 状态：**ready**（架构已 seed 测试 `test/selfplay/selfplay-long.test.ts`，当前应绿——纯回归护栏）
- 派发模式：实现型 AI（worktree·`task/M6-L5`·纯逻辑·零 cc·可测）
- 文件域（**只允许改这些**）：
  - `test/selfplay/selfplay-long.test.ts`（架构已提供·本任务主体）
  - （仅在 L4 改了 settle 行为导致回归失败时）改对应源码——但优先 rebase L4 而非改源码
- 依赖：无（复用 `./runner` 的 `runSeeds`）；若 M6-L4 改了 round-runtime settle 行为须 rebase 确认
- 分支：`task/M6-L5`

## 目标
扩大自对弈回归面：selfplay 从 seeds 1..30 扩到 50（QA_CHECKLIST.md「N 局无非法/死循环/无限等待」自动化护栏）。

## 行为要求（测试已钉死·见 `selfplay-long.test.ts`）
- seeds 1..50：每局 `phase==='settled'`、`turns < 300`（必终止无死循环）、三方分数和为 0（零和）、`landlord`/`winner` 合法。
- 可复现：同 seeds 跑两次 `SeedSummary[]` 深相等。
- 纯回归护栏——预计零源码改动即绿。若扩面命中未覆盖异常路径导致先红，实现方须**修复根因**（非改测试、非放宽断言）。
- 零 `cc` import（selfplay 层）。

## 验收
- `npm --prefix test test` 全绿（`selfplay-long.test.ts` 通过）
- `npm --prefix test run typecheck` 无错
- 仅改声明的文件域；未 import `cc`

## 测试命令
`npm --prefix test test`（注意：seeds 1..50 耗时较长，单测设 60s timeout）

## 后续
若 L4 rebase 后本测试仍绿，则本任务零源码改动、纯护栏确认。
