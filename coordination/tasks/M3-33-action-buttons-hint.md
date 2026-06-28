# M3-33 操作按钮 + 提示（出牌/不要/提示 → submitPlayerAction）

- 状态：blocked（待 M3-32；同 `task/M3-interaction` 串行 #2）
- 派发模式：编辑器执行者（非 worktree·Cocos Creator）
- 执行分支：`task/M3-interaction`
- 文件域：`assets/scene/game.scene`（加按钮节点）、`assets/scripts/ui/components/*`（绑定逻辑）、prefab/.meta（编辑器）
- 依赖：M3-32（运行时接线 + 选牌）；view-model `action-buttons`（`deriveActionButtons`）、`ai/hint`（M4-20 `hintSuggestions`/`nextHint`）均在 main

## 目标
玩家回合的三个操作按钮接入真实门面：**出牌 / 不要 / 提示**，可用态由 `action-buttons` VM 推导，点击经 `round-runtime.submitPlayerAction` 提交。

## 行为要求
1. 按钮可用态：`vm.actions = deriveActionButtons({ snapshot, selectedCards, viewerSeat: HERO })`（已在 `deriveScreenVM` 输出 `vm.actions{play,pass,hint}`）。仅 hero 回合且对应可用时点亮。
2. **出牌**：点击 → `await runtime.submitPlayerAction({ kind:'play', action:{ type:'play', seat:HERO, cards: this.selected } })`；`ok:false` 则提示原因（非法/NOT_PLAYER_TURN）不清选中；`ok:true` 清空 `this.selected`，render（facade 已自动驱动后续 AI，事件经 onEvent 回流渲染）。
3. **不要**：点击 → `submitPlayerAction({ kind:'play', action:{ type:'pass', seat:HERO } })`；首出（`top===null`）时 pass 非法→按钮置灰（VM 已挡）。
4. **提示**：点击 → `nextHint(hand, top, prevIndex)`（循环回绕，炸弹靠后）→ 将建议 `cards` 设为 `this.selected` 高亮上浮（不自动出牌，二次点「出牌」才提交）；无解则禁用。
5. 提交后按钮态随新快照刷新；非 hero 回合三按钮全灰。

## 验收
- hero 回合可出合法牌/过牌/循环提示；非法出牌有反馈且状态不变；一整局可由真人 hero 打到结算。
- 组件不被测试 import；纯逻辑/typecheck 不受影响。
- **390×844 截图**（按钮态 + 一次提示高亮）。
