# M3-00-table-layout 实现报告

- 实现方标识：Codex
- 分支：`task/M3-00-table-layout`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/table-layout.ts`
- `coordination/reports/M3-00-table-layout.report.md`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  37 passed (37)
Tests       164 passed (164)

npm --prefix test run typecheck
tsc --noEmit passed

rg "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/ui/table-layout.ts
no matches
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- 采用 390x844 竖屏固定整数区域：topBar 顶部、opponents 上半区、playArea 居中、actionButtons 在手牌上方、playerHand 贴底。
- 各区域留出间隔，避免重叠。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
