# M3-00-selection 实现报告

- 实现方标识：Codex
- 分支：`task/M3-00-selection`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/selection.ts`
- `coordination/reports/M3-00-selection.report.md`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  29 passed (29)
Tests       126 passed (126)

npm --prefix test run typecheck
tsc --noEmit passed

rg "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/ui/selection.ts
no matches
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- 选中判定使用 `rank + suit`。
- `toggle` 和 `sortByRank` 都返回新数组，不修改入参；排序用原始 index 保证同 rank 稳定。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
