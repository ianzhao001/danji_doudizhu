# M3-57 瞬时提示 + 回合计时接线（编辑器·绑 M3-52/53 · 第十二批·打磨）

- 状态：blocked（待 M3-52 turn-timer + M3-53 toast-queue 入 main；编辑器串行）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·单写者）· 编辑器串行分支
- 文件域：`assets/scripts/ui/components/game-scene-skeleton.ts`（或新组件）+ `.meta`、report
- 依赖：**M3-52 turn-timer + M3-53 toast-queue**
- 验收按 BOARD「编辑器任务验收模板」

## 目标
- 瞬时提示：关键事件（炸弹/火箭/春天/不要）经 `pushToast` 入队、组件 `update(dt)` 调 `tickToasts` 过期，渲染浮层文字。
- 回合计时：玩家回合用 `deriveTurnTimer(remaining,total)` 渲染倒计时条（urgent 变色）；**单机仅提示、超时不强制**（不自动代打，避免改 round-runtime 契约）。

## 行为要求
1. toast：组件持 `ToastQueue` 状态，事件 push、`update` tick、渲染当前 items；动效受 `settings.animation` 门控。
2. timer：组件用自己的计时驱动 remaining，调纯 VM 渲染；超时仅视觉提示，不提交动作。
3. 守 scene/meta 铁律；不遮挡核心交互。390×844 不溢出。

## 验收
- toast 出现并自动消失；倒计时条递减、最后 5s urgent；关 animation 无浮层动效。
- Creator 编译零报错；cc 仅在组件；**390×844 截图**（含 toast + 计时）；report 按模板填全。
