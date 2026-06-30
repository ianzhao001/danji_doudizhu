# M3-46b 对局暂停叠加层报告

## 范围
- 任务：M3-46b-pause-overlay
- 分支：task/M6-editor
- 文件域：`assets/scripts/ui/components/game-scene-skeleton.ts` + 本报告 + 390x844 截图
- 未手写 `assets/scene/game.scene` / `.meta`

## 实现
- 在 `game-scene-skeleton.ts` 运行时创建暂停按钮、全屏暗色遮罩、菜单面板和退出确认面板。
- 暂停状态全部通过 `pause-menu.ts` 的 `openMenu` / `closeMenu` / `askQuit` / `cancelQuit` 转移。
- 继续关闭菜单；重开关闭菜单并 `startGame(true)`；退出进入二次确认；确认退出调用 `director.loadScene('lobby')`。
- 遮罩节点挂 `BlockInputEvents`，用于阻断暂停层下方的手牌和操作按钮误触。
- 面板缩放动效仅在 `settings.animation` 开启且 stage 变化时触发。

## Cocos Creator 3.8.8 复核
- Project：`/Users/admin/Documents/Cocos/斗地主.worktrees/M6-editor`
- Preview：`game.scene` (`76483838-c412-4de3-83ff-2ab3f683a1cd`)
- 设备：Apple iPhone 12/13/14 预览，390x844，DPR 2
- CDP runtime errors：`[]`
- Creator `temp/logs/project.log` 最新段未见 Error / failed / exception

## 交互验证
- 初始 game 场景可见 `暂停` 按钮。
- 点击 `暂停` 后 stage=`menu`，显示 `继续` / `重开` / `退出`。
- 暂停层打开时点击底部手牌区，`selected` 从 0 保持 0，stage 仍为 `menu`。
- 点击 `退出` 后 stage=`confirm-quit`，显示 `退出对局？` / `确认` / `取消`。
- 点击 `取消` 回到 stage=`menu`。
- 点击 `继续` 回到 stage=`closed`。
- 再次打开后点击 `重开`，stage 关闭并回到新局 bidding。
- 再次打开并二次确认 `确认`，场景切到 lobby。

## 截图
- `coordination/reports/M3-46b-pause-menu-390x844.png`
- `coordination/reports/M3-46b-pause-confirm-390x844.png`

## 验证命令
- `npm --prefix test run typecheck`
- `npm --prefix test test -- ui/pause-menu.test.ts ui/action-buttons.test.ts ui/screen-view.test.ts`
- `npm --prefix test test`（128 files / 632 tests passed）
- `git diff --check`
- `rg -n "from 'cc'|from \"cc\"" assets/scripts/{rules,game,ai,flow,data} assets/scripts/ui/{audio-gate,animation-params,table-layout,screen-view,event-cues,strength-meter-view,card-memory-view,turn-timer,ai-thinking-view,last-action-view,insight-view,pause-menu}.ts`（无命中）
