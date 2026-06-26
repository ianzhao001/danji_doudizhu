# M4-04-difficulty-selfplay 实现报告

- 实现方标识：Codex
- 分支：`task/M4-04-difficulty-selfplay`
- 状态：in-review

## 改了哪些文件
- `test/selfplay/difficulty.ts`
- `test/selfplay/difficulty.test.ts`

## 测试与类型检查输出
```
npm --prefix test test

Test Files  24 passed (24)
Tests  104 passed (104)

npm --prefix test run typecheck

> doudizhu-rules-tests@0.0.0 typecheck
> tsc --noEmit
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `runDifficultyMatchup` 使用单个 routing `playPolicy`，按 `snapshot.turn` 分派到对应座位难度。
- 难度信号用受控场景验证 hard pressing 跟牌抢最大、normal 保守出最小，避免依赖小样本胜率阈值。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改架构既有断言、未碰 main / 他人模块
- [x] 未 import cc
