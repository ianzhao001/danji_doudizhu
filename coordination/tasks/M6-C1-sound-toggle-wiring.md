# M6-C1 音效开关写侧接线（消费 M6-L1 audio-gate）

- 状态：blocked（待 M6-L1 入 main；同 `task/M6-editor` 串行 #1，编辑器单写者）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·非 worktree·单写者保 scene 一致）
- 执行分支：`task/M6-editor`（C1→C2→C3→C4 同分支串行）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`（playCue 改调 audio-gate + vibration 接线 + 热重载）
  - `assets/scripts/ui/components/lobby-scene.ts`（defaultSettings→loadSettings + 设置控件接线）
  - `assets/scene/lobby.scene`（加可交互 Toggle/Button：sound/vibration/animation + 难度）
  - `assets/scene/lobby.scene.meta`（编辑器生成，勿手写）
- 依赖：**M6-L1**（audio-gate 纯函数须先入 main）；M5-06 settingsStorage（`saveSettings`）；M5-20 cocosStorage（runtime 桥）

## 目标
补齐音效开关的**写侧**：让用户能在 lobby 切换 sound/vibration/animation + 难度并持久化（当前 `saveSettings` 零调用、lobby 的 `settings-label` 是死 Label），并让对局中切换即时生效。

## 背景（侦察结论·必读）
- **读侧已接线，不是从零接**：`game-scene-skeleton.ts:420` `if (!this.settings.sound || !path || !this.audioSource) return;` 已尊重 sound；`:419` 已尊重 animation。所以本任务是「补写侧 UI + 持久化 + vibration + 抽出可测 audio-gate（L1 已做）+ 在组件改调它」。
- **vibration 完全未接线**：`Settings.vibration` 是死数据（`settings.ts:13` 定义、默认 true），运行时无任何 `sys.vibrate` 调用。本任务补 vibration 门控。
- **settings 只在 startGame 读一次**（`game-scene-skeleton.ts:148`），对局中切换不热生效。本任务补热重载。
- **lobby-scene.ts:34 bug**：用 `defaultSettings()` 而非 `loadSettings()`，难度 label 永远显示普通。本任务一并修为 `loadSettings(storage, SETTINGS_KEY)`。

## 行为要求
1. `game-scene-skeleton.playCue(cue)`：把内联 `if (!this.settings.sound...)` / `if (this.settings.animation...)` 改为调 M6-L1 的 `decideCuePlayback(settings, cue)` → `{ sound, effect, vibrate }`，按其结果分别走音效/动效/震动分支（动效仍委托 `playEffect`，音效仍走 `resources.load`+`AudioSource.play`）。
2. **vibration 接线**：`decideCuePlayback(...).vibrate === true` 时调震动 API（Cocos `sys.vibrate()` 或 web `navigator.vibrate`，跨平台降级——平台不支持时静默跳过，不报错）。
3. **热重载**：对局中切换 sound/vibration/animation 须即时生效。playCue 内重读 settings（或切换时刷新 `this.settings`），不再仅依赖 startGame 入口读一次。读取路径：`loadSettings(storage, SETTINGS_KEY)`（storage 来自 `cocosStorage()`）。
4. **lobby 写侧控件**：lobby.scene 加可交互 Toggle/Button（sound/vibration/animation 三开关 + 难度三档选择），点击调 `toggleSetting(settings, key)` / `setDifficulty(settings, level)` → `saveSettings(storage, SETTINGS_KEY, next)` 持久化，并刷新 lobby 显示。
5. **lobby-scene.ts:34 修**：`defaultSettings()` → `loadSettings(storage, SETTINGS_KEY)`（用 `cocosStorage()` 注入），难度 label 反映真实存档。
6. 音效缺资源/加载失败、震动平台不支持 → 静默跳过，不报错、不阻塞交互。

## 验收
- lobby 可切换 sound/vibration/animation + 难度并持久化（重开 lobby 仍记得）。
- 对局中切换 sound/animation 即时生效（开关后静默/无动效）；vibration 在支持平台触发、不支持时静默。
- lobby 难度 label 反映存档（不再永远「普通」）。
- `game-scene-skeleton` / `lobby-scene` 不被任何测试 import（cc 组件）；纯逻辑/typecheck 不受影响。
- `decideCuePlayback` 已由 M6-L1 测试覆盖（本任务只消费）。
- **390×844 截图**：lobby 设置控件 + 关 sound 后对局静默一帧。

## 测试命令
`npm --prefix test test`（须全绿——本任务不改测试，依赖 M6-L1 已转绿的 audio-gate 测试）
