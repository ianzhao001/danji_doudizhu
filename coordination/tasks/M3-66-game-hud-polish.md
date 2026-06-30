# M3-66 对局 HUD 叠压消除 + 暂停冻结计时（编辑器·审查转化·M3-56/57/64 打磨）

- 状态：blocked（待本批 M3-56/M3-57/M3-64/M3-46b 入 main；编辑器串行）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·单写者）· 编辑器串行分支
- 文件域：`assets/scripts/ui/components/game-scene-skeleton.ts` + `.meta`、report
- 依赖：M3-56（剩牌 HUD）+ M3-64（advisor）+ M3-57（toast/timer）+ M3-46b（暂停叠加层）**全部入 main**
- 来源：M6-editor 第二批审查（通过）非阻塞项 #2、#4
- 验收按 BOARD「编辑器任务验收模板」

## 背景（审查发现）
对局屏多 HUD 共存的两处边缘问题，核心操作不受影响，本任务收口。

1. **advisor × 展开剩牌叠压**：advisor 浮条锚 `centerY = layout.playArea.y + layout.playArea.height + 56`（[game-scene-skeleton.ts:616](assets/scripts/ui/components/game-scene-skeleton.ts#L616)，≈屏 441–471），与 M3-56 展开态剩牌面板 `actionButtons.y - 98`（[game-scene-skeleton.ts:482](assets/scripts/ui/components/game-scene-skeleton.ts#L482)，≈屏 450–562）顶部约 20px 交叠。默认紧凑态无叠压；仅「手动展开剩牌 + 开 advisor」同屏触发。
2. **暂停时计时仍在后台递减**：`update(dt)` 在玩家回合 `timerActive` 为真时持续累加 `turnTimerElapsedMs`，暂停叠加层打开时计时条仍在遮罩后走（恢复后可能直接显示 0s）。因只提示不强制故无害，但观感不佳。

## 行为要求
1. **消除 advisor × 展开剩牌叠压**：在「advisor 开 + 剩牌展开」任意组合下两面板不交叠（上移 advisor / 下沉或避让剩牌 / 或二者互斥显示，择一·report 说明）。紧凑态与默认态不得回归。
2. **暂停冻结计时**：`pauseState.stage !== 'closed'` 期间不推进 `turnTimerElapsedMs`（计时条停在暂停瞬时值；恢复后继续，不跳 0）。仍保持「超时仅视觉、绝不自动出牌/过牌」契约不变。
3. 守 scene/meta 铁律（运行时注入·不手写 scene/meta）；不遮挡 `出牌/不要/提示` 与手牌。390×844 不溢出。

## 验收
- advisor 开 + 剩牌展开同屏无交叠；关 advisor / 收起剩牌 / 默认态均无回归。
- 暂停打开时计时条停住、恢复后从停住值继续；超时仍仅视觉、无自动提交。
- Creator 编译零报错；cc 仅在组件。
- **390×844 截图**：① advisor 开 + 剩牌展开同屏（无叠压）；② 暂停叠加层打开（计时条停住，可与恢复后对比）。
- report 按编辑器验收模板填全（Creator 版本/分辨率+截图路径/scene·meta 改动/worktree 残留/Console 零报错）。
