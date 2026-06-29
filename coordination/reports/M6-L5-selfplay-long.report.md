# M6-L5-selfplay-long 实现报告

- 实现方标识：Codex
- 分支：`task/M6-L5-selfplay-long`
- 状态：in-review

## 改了哪些文件
- `test/selfplay/selfplay-long.test.ts`：新增 seeds 1..50 自对弈长回归，覆盖 settled 终止、turns<300、三方零和、landlord/winner 合法与同 seeds 可复现。
- `coordination/reports/M6-L5-selfplay-long.report.md`：本报告。

## 测试与类型检查输出
```text
npm --prefix test test
Test Files  91 passed (91)
Tests       464 passed (464)
selfplay/selfplay-long.test.ts (2 tests) 10754ms
  seeds 1..50 settled/zero-sum/turns<300: 3577ms
  reproducible same-seeds summaries: 7175ms

npm --prefix test run typecheck
tsc --noEmit
exit 0
```

## 与 spec 的偏差 / 关键决策
- 本地没有预建 `task/M6-L5-selfplay-long` 分支；按任务书命令从当前 `main` 新建 worktree/branch 执行。
- 长回归只新增测试，不改任何产品源码；60s timeout 仅用于覆盖 1..50 两轮 selfplay 的耗时波动。
- `npm --prefix test install` 报出现有依赖 audit 风险，未在本任务处理，避免越过文件域升级依赖。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
