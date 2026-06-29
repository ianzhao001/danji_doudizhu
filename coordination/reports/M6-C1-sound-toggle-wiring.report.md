# M6-C1-sound-toggle-wiring 实现报告

- 实现方标识：Codex
- 分支：`task/M6-editor`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `playCue` 改为消费 `decideCuePlayback(settings, cue)`，分别控制 sound / effect / vibrate。
  - 每次 cue 前重读 `loadSettings(cocosStorage(), SETTINGS_KEY)`，设置变化对后续 cue 即时生效。
  - 新增游戏内 `音效/动效/震动` 三个运行时按钮，点击后 `saveSettings` 持久化并立即刷新。
  - 新增 vibration 降级实现：优先 `navigator.vibrate(30)`，否则尝试 `sys.vibrate()`，不支持时静默跳过。
- `assets/scripts/ui/components/lobby-scene.ts`
  - `defaultSettings()` 改为 `loadSettings(cocosStorage(), SETTINGS_KEY)`，大厅难度 label 读取真实存档。
  - 新增大厅运行时设置按钮：sound / vibration / animation 三开关 + simple / normal / hard 难度选择，点击后 `saveSettings` 持久化并刷新显示。
- `coordination/reports/M6-C1-sound-toggle-wiring.report.md`：本报告。

## 测试与类型检查输出
```text
npm --prefix test test
Test Files  90 passed (90)
Tests       462 passed (462)

npm --prefix test run typecheck
tsc --noEmit
exit 0

git diff --check
exit 0
```

补充尝试：
```text
./test/node_modules/.bin/tsc --noEmit -p tsconfig.json
exit 2
```
该命令在当前 worktree 缺少 Creator 生成的 `temp/cli`/`cc` 类型环境，且混有既有 target/moduleResolution 噪声，不作为本任务验收门。

## 与 spec 的偏差 / 关键决策
- 本地没有预建 `task/M6-editor` 分支；按任务板“需新建 worktree”的要求，从当前 `main` 新建 `../斗地主.worktrees/M6-editor` 与 `task/M6-editor` 执行。
- 未手写 `assets/scene/lobby.scene` / `assets/scene/lobby.scene.meta`。为遵守仓库“不手写 scene/meta”的 Cocos 规则，本实现由 `LobbyScene` 组件在运行时创建可交互按钮；功能落在 C1 文件域内，但场景资产本身未变。
- 未生成 390x844 截图：当前命令行无法可靠启动 Creator 非交互预览；请架构/编辑器复核时用 Cocos Creator 3.8.8 打开 `task/M6-editor` 分支补截图确认。
- 没有改 `audio-gate.ts` 纯函数；仅消费 M6-L1 已并入的 `decideCuePlayback`。

## 疑问（给架构）
- 若架构坚持设置控件必须持久存在于 `lobby.scene` 资产中，请在编辑器里生成 scene 节点后覆盖本运行时注入方案；我未手写 scene/meta 是出于仓库 guardrail。

## 自检（对照验收项）
- [x] `game-scene-skeleton` 改调 `decideCuePlayback`
- [x] sound / animation / vibration 均有门控
- [x] 设置存储热重载，游戏内切换后下一次 cue 生效
- [x] lobby 难度 label 读取真实存档
- [x] lobby 可切换 sound / vibration / animation / difficulty 并持久化
- [x] 测试全绿
- [x] typecheck 无错
- [x] 纯逻辑层未新增 `cc`
- [ ] 390x844 截图（需 Cocos Creator 预览复核）
