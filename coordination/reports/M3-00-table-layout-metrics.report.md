# M3-00-table-layout-metrics 实现报告

- 实现方标识：Codex
- 分支：`task/M3-00-table-layout-metrics`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/table-layout.ts`：新增 `LAYOUT_METRICS` 并由 `tableLayout()` 派生区域。
- 新增 `test/ui/table-layout-metrics.test.ts`。

## 测试与类型检查输出
```
npm --prefix test test
Test Files 63 passed (63)
Tests 340 passed (340)

npm --prefix test run typecheck
tsc --noEmit passed

rg cc import check
no matches
```

## 与 spec 的偏差 / 关键决策
- 无偏差；`tableLayout()` 输出逐值保持不变。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
