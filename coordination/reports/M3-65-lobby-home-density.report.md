# M3-65 lobby home density 实现报告

- 实现方标识：Codex
- 分支：`task/M6-editor`
- 状态：implemented（待审查）
- 文件域：`assets/scripts/ui/components/lobby-scene.ts` + 本报告 + 390x844 截图

## 实现

- Home 底部重排为三层：
  - 四入口按钮：`y = -164`
  - 音效/震动/动效开关：`y = -210`
  - 难度面板：`centerY = -320`、高度 `154`
- 难度面板改为更紧凑的 3 行，并保留面板内「当前」标记。
- 隐藏冗余的 scene 常驻 `difficultyLabel`；同时隐藏空战绩摘要 `latestRecordLabel`，避免底部重新变挤。
- 教程/帮助/战绩/历史子屏面板改为不透明底色 `alpha = 255`。
- 进入子屏时隐藏 home 数据 label：局数、胜率、净分、难度、最新战绩均 inactive。

## Creator 3.8.8 复核

- Project：`/Users/admin/Documents/Cocos/斗地主.worktrees/M6-editor`
- Preview：`lobby.scene` (`dc62324b-10d4-4870-9518-1a34ce682067`)
- 设备：Apple iPhone 12/13/14 预览，390x844，DPR2 截图归一化为 390x844 PNG。
- CDP runtime / console error：`[]`
- 重启 Creator 后确认 preview packer 使用最新 `lobby-scene.ts`。

## 交互验证

- Home 状态：
  - `difficultyLabel=false`
  - `latestRecordLabel=false`
  - `rounds/winRate/netScore=true`
- 子屏状态：
  - `screen="stats"`
  - `continue/rounds/winRate/netScore/difficulty/latestRecord` 全部 inactive。
- 运行时按钮回调：
  - 对 `button-战绩-42--164` 发 `Button.EventType.CLICK` 后进入 `stats`。
  - 对 `button-返回-72--214` 发 `Button.EventType.CLICK` 后回到 `home`。

## 截图

- `coordination/reports/M3-65-home-density-390x844.png`
- `coordination/reports/M3-65-subscreen-opaque-390x844.png`

## 验证命令

- `npm --prefix test run typecheck`
- `npm --prefix test test`（128 files / 632 tests passed）
- `git diff --check`
- 纯层 `cc` grep：无命中

## 护栏

- 未手写 `.scene` / `.prefab` / `.meta`。
- 未修改 root `package.json`、`tsconfig.json`、`cocos.config.json`。
- 本任务只触碰 `assets/scripts/ui/components/lobby-scene.ts` 与报告/截图。
