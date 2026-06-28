# M3-34 叫抢 + 结算弹窗（bidding 输入 + result 弹窗 + 重开/返回）

- 状态：blocked（待 M3-32；同 `task/M3-interaction` 串行 #3）
- 派发模式：编辑器执行者（非 worktree·Cocos Creator）
- 执行分支：`task/M3-interaction`
- 文件域：`assets/scene/game.scene`（叫抢条 + 结算弹窗节点/prefab）、`assets/scripts/ui/components/*`、prefab/.meta（编辑器）
- 依赖：M3-32；view-model `bidding-view`（`deriveBiddingView`）、`result-view`（`deriveResultView`）均在 main；`settlement-bg` 资源已在 main

## 目标
补齐两个阶段性 UI：**叫抢输入条**（hero 叫抢回合）与**结算弹窗**（一局结束）。

## 行为要求
### 叫抢条（phase==='bidding' 且 hero 回合）
1. `vm.bidding = deriveBiddingView(bidding, HERO)`（已在 `deriveScreenVM` 输出）。按文案/可用渲染按钮：calling→「叫地主 / 不叫」，grabbing→「抢地主 / 不抢」。
2. 点击 → `submitPlayerAction({ kind:'bid', action:{ type:'call'|'grab'|'pass', seat:HERO } })`；提交后条隐藏，facade 继续推进（AI 抢/反抢经 onEvent 回流）。
3. 非 hero 叫抢回合：条隐藏或只读显示「等待 AI 叫抢」。

### 结算弹窗（runtime.settlement() !== null）
4. `vm.result = deriveResultView({ settlement, landlord, heroSeat: HERO })`（已在 `deriveScreenVM` 输出 `vm.result`）。弹窗显示胜负、倍数、本局得分（`settlement.scores[HERO]` 符号判胜负，VM 已封装）。
5. 底图用 `settlement-bg`。两入口：**再来一局**（dispose 旧 runtime → 新 `startRoundRuntime` 重置场景）、**返回大厅**（切 lobby.scene）。
6. `onSettled` 落库已由 M3-32 接好；弹窗只读不重复写库。

## 验收
- hero 可叫/抢地主，AI 抢/反抢倍数变化可见；一局结束弹出结算，数值与 `result-view` 一致；再来一局/返回大厅可用。
- 组件不被测试 import；纯逻辑/typecheck 不受影响。
- **390×844 截图**（叫抢条 + 结算弹窗各一）。
