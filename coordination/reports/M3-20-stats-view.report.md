# M3-20-stats-view 实现报告

- 实现方标识：Codex
- 分支：`task/M3-20-stats-view`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/stats-view.ts`
- `test/ui/stats-view.test.ts`

## 测试与类型检查输出
```
npm --prefix test test -- ui/stats-view.test.ts
Test Files  1 passed (1)
Tests       4 passed (4)

npm --prefix test test
Test Files  57 passed (57)
Tests       309 passed (309)

npm --prefix test run typecheck
tsc --noEmit
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `winRatePct` 按 `Math.round((wins / rounds) * 100)` 计算；`rounds===0` 为 0。
- `netScoreLabel` 仅正数补 `+`，负数和 0 直接字符串化。
- 未改 `ui/index.ts`，未新增 `.meta`。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改 main / 他人模块
- [x] 未 import cc
