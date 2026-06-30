# M3-67 对局屏运行时卫生：去每帧 I/O + 修 submitting 死锁 + 音频并发（编辑器·审查转化）

- 状态：blocked（待 M6-editor 第二批入 main；编辑器串行）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·单写者）· 编辑器串行分支
- 文件域：`assets/scripts/ui/components/game-scene-skeleton.ts` + `.meta`、report
- 依赖：M3-56/57/63/64/46b（本批编辑器特性）**入 main**
- 来源：M6-editor 第三轮审查 game-scene 四项（#4 每帧 I/O · #5 submitting · #7 音频 · #8 按钮重注册）
- 验收按 BOARD「编辑器任务验收模板」

## 背景（审查发现·已核实）
1. **每帧/每事件同步存储 I/O（MEDIUM）**：`render()`→`renderRuntimeSettings`（[L335](assets/scripts/ui/components/game-scene-skeleton.ts#L335)）与 `playCue`（[L1106](assets/scripts/ui/components/game-scene-skeleton.ts#L1106)）各调 `reloadSettings()`（[L1140-1142](assets/scripts/ui/components/game-scene-skeleton.ts#L1140-L1142)）→ `loadSettings(cocosStorage())` = `getItem` + JSON parse。活跃对局（事件 + `update(dt)` 180ms 双驱动）每秒 5–10 次同步读 + 解析，纯浪费。`this.settings` 已是权威（`startGame` [L224](assets/scripts/ui/components/game-scene-skeleton.ts#L224) + `toggleRuntimeSetting` 写入口维护），且多数渲染路径已直接读 `this.settings`。
2. **`startGame` 漏置 `submitting=false`（MEDIUM）**：`startGame`（[L201-265](assets/scripts/ui/components/game-scene-skeleton.ts#L201)）重置十余字段但漏 `submitting`。若在 `submitting===true` 时走 暂停→重开（`restartFromPause`→`startGame(true)`），新局以锁态启动，提交按钮短暂死锁（旧 async 最终 resolve 才解锁）。
3. **单 `AudioSource` 并发覆写（LOW）**：`playCue`（[L1093-1108](assets/scripts/ui/components/game-scene-skeleton.ts#L1093)）所有 cue 共享一个 `AudioSource`，`resources.load` 异步回调里 `audioSource.clip = clip; play()`；bomb→win 连发时后者覆写截断前者，快节奏残局丢音效。
4. **（可选·LOW）`addButton` 每帧重注册**：`addButton` 即使 `ensureNode` 复用也重跑 `off/on(CLICK)` + `drawButtonBackground` 重绘 + 重设 color 字段，高频渲染下无谓开销。

## 行为要求
1. **去热路径 I/O**（#1）：`renderRuntimeSettings` 与 `playCue` 改读 `this.settings`，删除其中的 `reloadSettings()` 调用。保持 `toggleRuntimeSetting` 为唯一写入口（它已 `saveSettings` + 更新 `this.settings`）。设置开关与 cue 门控行为**不得回归**（关音效/动效/震动仍即时生效）。
2. **修 submitting 死锁**（#2）：`startGame` 补 `this.submitting = false;`。
3. **音频并发**（#3）：短 cue 改用 `AudioSource.playOneShot(clip)`（或 2–3 槽轮转），使连发 cue 不互相截断；仍受 `decideCuePlayback` 的 sound 门控与既有音量约束。
4. **（可选）#4**：仅在**确证不回归**（按钮 label/可点态变化仍即时更新）前提下，跳过稳定按钮的冗余重注册/重绘；否则 report 注明「评估后保持现状·留待 profiling」。**不得**为此引入 stale 按钮。
5. 守 scene/meta 铁律（运行时注入·不手写 scene/meta）；纯运行时卫生，**不改布局/交互行为**。390×844 不溢出。

## 验收
- 设置三开关仍即时生效并持久化（重开记得）；cue 门控正确——但渲染/事件路径不再每帧读存储（report 说明如何确认，如日志/断点抽样）。
- 暂停→重开后提交按钮不被锁、可立即出牌。
- 连发 cue（炸弹+胜利）不互相截断（report 描述验证）。
- Creator 编译零报错；cc 仅在组件；行为无回归。
- **390×844 截图**：对局屏正常（与本批既有截图一致，证明无布局回归）。
- report 按编辑器验收模板填全（Creator 版本/分辨率+截图/scene·meta/worktree 残留/Console 零报错）。
