# M3-34-bidding-settlement-popups 实现报告

- 实现方标识：Codex
- 分支：`task/M3-interaction`
- 状态：blocked（代码接线完成；Cocos Creator 预览/截图待执行）

## 改了哪些文件
- `assets/scripts/ui/components/game-scene-skeleton.ts`

## 测试与类型检查输出
```
npm --prefix test test
Test Files  85 passed (85)
Tests       437 passed (437)

npm --prefix test run typecheck
tsc --noEmit

git diff --check
<no output>
```

## 与 spec 的偏差 / 关键决策
- 叫抢条运行时创建；`vm.bidding.buttons` 驱动文案与可用态。
- 叫/抢/不叫通过 `submitPlayerAction({ kind: 'bid', ... })` 提交。
- 结算弹窗运行时创建，底图加载 `RESOURCE_PATHS.settlementBg`。
- “再来一局”会 dispose 旧 runtime 并 `startGame(true)`；“返回大厅”调用 `director.loadScene('lobby')`。
- `onSettled` 落库仍由 runtime config 负责，弹窗不重复写库。

## 疑问（给架构）
- 需要 Creator 预览验证叫抢流程、结算弹窗、再来一局/返回大厅。

## 自检（对照验收项）
- [x] hero 叫抢输入接线
- [x] 结算弹窗接 `deriveResultView`
- [x] 再来一局/返回大厅入口
- [x] 组件不被测试导入
- [ ] Creator 预览验证
- [ ] 叫抢条与结算弹窗截图
