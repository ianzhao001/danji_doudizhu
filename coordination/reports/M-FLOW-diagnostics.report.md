# M-FLOW-diagnostics 实现报告

- 实现方标识：Codex
- 分支：`task/M-FLOW-diagnostics`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/flow/driver.ts`

## 测试与类型检查输出
```
npm --prefix test test

Test Files  20 passed (20)
Tests  87 passed (87)

npm --prefix test run typecheck

> doudizhu-rules-tests@0.0.0 typecheck
> tsc --noEmit
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `defaultPlayPolicy` 在 driver 内包装 baseline `chooseAction`，未注入时保持既有 selfplay/driver 行为。
- `maxTurns` 与 settled 后缺 `win` 路径改抛 `HeadlessRoundError`，诊断事件取 `events.slice(-10)`。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
