# M2-07-selfplay 实现报告

- 实现方标识：Codex
- 分支：`task/M2-07-selfplay`
- 状态：in-review

## 改了哪些文件
- `test/selfplay/runner.ts`：实现 `runSeeds`，复用 `runHeadlessRound({ seed })`，按入参顺序输出 `SeedSummary[]`，并在不变量失败时输出 seed/landlord/winner/turns/最后 10 个事件。

## 测试与类型检查输出
```
npm --prefix test test
Test Files  16 passed (16)
Tests       74 passed (74)
selfplay/selfplay.test.ts (2 tests) passed

npm --prefix test run typecheck
tsc --noEmit
passed
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- runner 保持顺序串行执行 seeds，避免并行调度影响诊断顺序。
- flow 抛错时仍会包装为包含 seed/landlord/winner/turns/lastEvents 的错误消息；此时未取得 FlowResult 的字段会显示为 `undefined`，lastEvents 为 `[]`。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
