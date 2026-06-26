# M3-00-result-view-model 实现报告

- 实现方标识：Codex
- 分支：`task/M3-00-result-view-model`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/result-view.ts`
- `coordination/reports/M3-00-result-view-model.report.md`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  37 passed (37)
Tests       166 passed (166)

npm --prefix test run typecheck
tsc --noEmit passed

rg "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/ui/result-view.ts
no matches
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- 胜负由 `settlement.scores[heroSeat] > 0` 判定。
- `springText` 按 `none/spring/anti-spring` 映射为空字符串、春天、反春天。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
