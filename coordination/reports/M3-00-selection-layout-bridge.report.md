# M3-00-selection-layout-bridge 实现报告

- 实现方标识：Codex
- 分支：`task/M3-00-selection-layout-bridge`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/hand-interaction.ts`
- `coordination/reports/M3-00-selection-layout-bridge.report.md`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  37 passed (37)
Tests       164 passed (164)

npm --prefix test run typecheck
tsc --noEmit passed

rg "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/ui/hand-interaction.ts
no matches
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- 先用 `sortByRank` 排序，再把 `layoutHand` 的 x 顺序映射到排序后的手牌。
- `selected` 复用 `isSelected`，选中牌 y 为 `-liftOffset`，未选为 0。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
