# M3-34-bidding-settlement-popups 实现报告

- 实现方标识：Codex
- 分支：`task/M3-interaction`
- 状态：in-review（叫抢点击已验证；结算弹窗与再来一局/返回大厅待继续跑通）

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

2026-06-28 复验：
npm --prefix test test -- --testTimeout=10000
Test Files  85 passed (85)
Tests       437 passed (437)
```

## 与 spec 的偏差 / 关键决策
- 叫抢条运行时创建；`vm.bidding.buttons` 驱动文案与可用态。
- 浏览器预览不可交互问题已修：运行时节点继承 Canvas 图层、置顶，并改用真实 `cc.Button` click 事件。
- 叫/抢/不叫通过 `submitPlayerAction({ kind: 'bid', ... })` 提交。
- 结算弹窗运行时创建，底图加载 `RESOURCE_PATHS.settlementBg`。
- “再来一局”会 dispose 旧 runtime 并 `startGame(true)`；“返回大厅”调用 `director.loadScene('lobby')`。
- `onSettled` 落库仍由 runtime config 负责，弹窗不重复写库。

## 疑问（给架构）
- 用户已确认可以抢地主并进入 playing。
- 仍需继续打到结算，验证结算弹窗、“再来一局”和“返回大厅”。

## 自检（对照验收项）
- [x] hero 叫抢输入接线
- [x] 结算弹窗接 `deriveResultView`
- [x] 再来一局/返回大厅入口
- [x] 组件不被测试导入
- [x] 叫抢点击预览验证
- [ ] 结算弹窗截图
- [ ] 再来一局 / 返回大厅点击验证
