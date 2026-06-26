# M3-00-bidding-view-model 实现报告

- 实现方标识：Codex
- 分支：`task/M3-00-bidding-view-model`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/bidding-view.ts`
- `coordination/reports/M3-00-bidding-view-model.report.md`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  37 passed (37)
Tests       165 passed (165)

npm --prefix test run typecheck
tsc --noEmit passed

rg "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/ui/bidding-view.ts
no matches
```

## 与 spec 的偏差 / 关键决策
- 无偏差。
- calling 阶段返回 `call/pass`；grabbing 阶段返回 `grab/pass`。
- done/redeal 阶段返回三类按钮但全部 disabled，便于 UI 固定消费。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰 main / 他人模块
- [x] 未 import cc
