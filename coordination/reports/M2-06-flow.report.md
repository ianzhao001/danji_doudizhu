# M2-06-flow 实现报告

- 实现方标识：Codex
- 分支：`task/M2-06-flow`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/flow/driver.ts`：实现 `runHeadlessRound`，串接发牌、叫抢、出牌循环、结算与事件收集。
- `coordination/reports/M2-06-flow.report.md`：本实现报告。

## 测试与类型检查输出
```
npm --prefix test test
Test Files  13 passed (13)
Tests  62 passed (62)

npm --prefix test run typecheck
tsc --noEmit
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- 出牌阶段每回合均通过 `await clock.sleep(thinkingDelayMs)` 执行思考时延；未直接使用 `setTimeout`。
- 结算 winner 来自累计 `GameEvent` 中的 `win` 事件，并将完整 game event 流传给 `settle`。
- redeal 使用同一个 seeded rng 连续重发，保证同 seed 结果可复现。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
