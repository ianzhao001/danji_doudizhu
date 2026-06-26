# M2-07-D-selfplay-diagnostics 实现报告

- 实现方标识：Codex
- 分支：`task/M2-07-D-selfplay-diagnostics`
- 状态：in-review

## 改了哪些文件
- `test/selfplay/runner.ts`

## 测试与类型检查输出
```
npm --prefix test test

Test Files  24 passed (24)
Tests  102 passed (102)

npm --prefix test run typecheck

> doudizhu-rules-tests@0.0.0 typecheck
> tsc --noEmit
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `runSeeds` 捕获 `HeadlessRoundError` 时把 `lastEvents` / `turns` / `landlord` 转成 `Partial<FlowResult>`，交给既有 `formatFailure` 输出富诊断。
- 非 `HeadlessRoundError` 的错误保持原有兜底行为。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
