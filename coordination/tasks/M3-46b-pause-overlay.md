# M3-46b 对局暂停叠加层（编辑器·绑 M6-L12 · 拆自 M3-46·采纳建议#5）

- 状态：blocked（待 M6-L12 pause-menu 已在 main ✓ + 编辑器档期；编辑器串行·建议在 C3a/C3b 之后做，避免叠在旧布局上）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·单写者）· 编辑器串行分支
- 文件域：`assets/scene/game.scene`（加暂停按钮 + 叠加层）+ `assets/scripts/ui/components/*`（新 cc 组件）+ `.meta`、report
- 依赖：**M6-L12 `PauseState` 状态机**（已在 main）
- 验收按 BOARD「编辑器任务验收模板」

## 目标
game 场景加暂停按钮 → 用 `pause-menu` 状态机驱动 menu / confirm-quit 叠加层：继续 / 重开 / 退出（二次确认）。状态切换走 L12 纯函数，组件只渲染 stage。

## 行为要求
1. 暂停按钮 → `openMenu`；菜单含 继续(closeMenu)/重开(round-runtime 重开)/退出(askQuit→confirm-quit→确认才 `director.loadScene('lobby')`，cancelQuit 回菜单)。
2. 状态全部走 L12 纯函数（组件不自造状态机）；动效受 `settings.animation` 门控。
3. 守「不手写 scene/meta」铁律。390×844 不溢出。

## 验收
- 各转移正确（含退出二次确认）、暂停时不误触底层手牌；Creator 编译零报错；cc 仅在新组件。
- **390×844 截图**（暂停菜单 + 退出确认）；report 按验收模板填全。
