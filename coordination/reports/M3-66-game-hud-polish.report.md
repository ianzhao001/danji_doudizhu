# M3-66 game HUD polish 实现报告

- 实现方标识：Codex
- 分支：`task/M6-editor`
- 状态：implemented（待审查）
- 文件域：`assets/scripts/ui/components/game-scene-skeleton.ts` + 本报告 + 390x844 截图

## 实现

- advisor 与展开剩牌同屏时，advisor 从默认 `playArea.bottom + 56` 上移到 `playArea.bottom + 24`。
  - 390x844 下 advisor 约落在 `409..439`，展开剩牌面板约从 `450` 开始，保留约 11px 间距。
  - 默认紧凑态、advisor 关闭态仍保持原布局。
- 新增 `isTurnTimerFrozen()`，当 `pauseState.stage !== "closed"` 时停止推进 `turnTimerElapsedMs`。
  - 仍保留“超时仅视觉提示”契约，不提交出牌/不要。

## Creator 3.8.8 复核

- Project：`/Users/admin/Documents/Cocos/斗地主.worktrees/M6-editor`
- Preview：`game.scene` (`76483838-c412-4de3-83ff-2ab3f683a1cd`)
- 设备：Apple iPhone 12/13/14 预览，390x844，DPR2 截图归一化为 390x844 PNG。
- CDP runtime / console error：`[]`

## 交互验证

- CDP 驱动进入玩家 `playing` 回合。
- 对 `hud-memory-toggle` 发 `Button.EventType.CLICK`：`memoryExpanded=true`。
- 对 `advisor-toggle` 发 `Button.EventType.CLICK`：`advisorEnabled=true`，`advisor-label` 可见。
- 对 `pause-open-button` 发 `Button.EventType.CLICK`：`pauseState.stage="menu"`。
- 计时冻结证据：
  - 正常运行：`2342ms -> 3134ms`
  - 暂停后等待 1.6s：`3151ms -> 3151ms`

## 截图

- `coordination/reports/M3-66-advisor-memory-390x844.png`
- `coordination/reports/M3-66-pause-timer-390x844.png`

## 验证命令

- `npm --prefix test run typecheck`
- `npm --prefix test test`（128 files / 632 tests passed）
- `git diff --check`
- 纯层 `cc` grep：无命中

## 护栏

- 未手写 `.scene` / `.prefab` / `.meta`。
- 未修改 root `package.json`、`tsconfig.json`、`cocos.config.json`。
- 本任务只触碰 `assets/scripts/ui/components/game-scene-skeleton.ts` 与报告/截图。
