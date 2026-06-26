# M4-04B-difficulty-routing 实现报告

- 实现方标识：Codex
- 分支：`task/M4-04B-difficulty-routing`
- 状态：in-review

## 改了哪些文件
- `test/selfplay/difficulty.ts`
- `coordination/reports/M4-04B-difficulty-routing.report.md`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  29 passed (29)
Tests       123 passed (123)

npm --prefix test run typecheck
tsc --noEmit passed

rg "from ['\"]cc['\"]|import .*['\"]cc['\"]" test/selfplay/difficulty.ts
no matches
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `buildRoutingPolicy` 按 `snapshot.turn` 选择 `levels` 并委派 `strategyFor`。
- `runDifficultyMatchup` 复用 `buildRoutingPolicy`，保持原有输出结构与顺序。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
