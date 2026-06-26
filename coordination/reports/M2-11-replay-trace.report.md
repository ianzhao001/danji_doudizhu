# M2-11-replay-trace 实现报告

- 实现方标识：Codex
- 分支：`task/M2-11-replay-trace`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/game/replay.ts`
- `coordination/reports/M2-11-replay-trace.report.md`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  37 passed (37)
Tests       165 passed (165)

npm --prefix test run typecheck
tsc --noEmit passed

rg "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/game/replay.ts
no matches
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `buildTrace` 跳过 `win`，其余事件按出现顺序生成递增 turn。
- `play` 摘要包含 `Category` 与 `Rank` 枚举名；`traceSummary` 中 bomb 与 rocket 都计入 bombs。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
