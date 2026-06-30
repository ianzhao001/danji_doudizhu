# M3-67-game-scene-runtime-hygiene 实现报告

- 实现方标识：Codex
- 分支：`task/M6-editor`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `startGame()` 补 `this.submitting = false;`，暂停菜单重开新局时清掉旧提交锁。
  - `renderRuntimeSettings()` 改读 `this.settings`，不再从渲染路径同步读本地存储。
  - `playCue()` 改读 `this.settings`，不再从事件音效路径同步读本地存储；资源异步返回时再按当前 `this.settings` 复查 sound gate。
  - 删除 `reloadSettings()`，运行期设置以 `this.settings` 为权威，`toggleRuntimeSetting()` 直接基于当前缓存切换并持久化。
  - 短 cue 播放从 `audioSource.clip = clip; audioSource.play()` 改为 `audioSource.playOneShot(clip)`，避免连续 cue 覆写同一个 `clip`。
- `coordination/reports/M3-67-runtime-hygiene-390x844.png`
  - Cocos Creator Preview 390x844 截图证据。
- `coordination/reports/M3-67-game-scene-runtime-hygiene.report.md`
  - 本报告。

## 测试与类型检查输出
```
npm --prefix test run typecheck
tsc --noEmit

npm --prefix test test
Test Files  128 passed (128)
Tests       632 passed (632)

git diff --check
<no output>

node /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/Resources/app.asar.unpacked/node_modules/typescript/bin/tsc \
  --target ES2019 --lib ES2019,DOM --module ES2015 --strict --experimentalDecorators \
  --isolatedModules --moduleResolution node --noEmit --skipLibCheck \
  temp/declarations/cc.custom-macro.d.ts temp/declarations/cc.d.ts \
  temp/declarations/jsb.d.ts temp/declarations/cc.env.d.ts \
  assets/scripts/ui/components/game-scene-skeleton.ts
<no output>
```

## Creator 3.8.8 复核
- 打开方式：`env -u ELECTRON_RUN_AS_NODE open /Applications/Cocos/Creator/3.8.8/CocosCreator.app --args --project /Users/admin/Documents/Cocos/斗地主.worktrees/M6-editor`。
- Preview：`game.scene` (`76483838-c412-4de3-83ff-2ab3f683a1cd`)。
- 设备：Apple iPhone 12/13/14 预览，390x844，DPR2 截图归一化为 390x844 PNG。
- CDP / Playwright 复核：
  - `inner=[390,844]`，`devicePixelRatio=2`。
  - canvas client `390x796`，实际截图文件已归一化为 `390x844`。
  - `cc.game._paused=false`。
  - `console(error/assert)` 与 `pageerror`：`[]`。
- Creator 编译证据：
  - `temp/logs/project.log` 记录 `Cocos Creator v3.8.8`，无 Error 行。
  - `temp/programming/packer-driver/targets/preview/.../game-scene-skeleton` 对应 chunk 已在 01:48 重新生成。
  - 预览 chunk 中可见 `this.audioSource.playOneShot(clip)`，未见 `reloadSettings`。
- 截图：
  - `coordination/reports/M3-67-runtime-hygiene-390x844.png`
- scene/meta：未改 `.scene` / `.meta`；本任务仅运行时组件注入逻辑。
- worktree 残留：未提交范围中无 `package.json` / `settings/` / `profiles/`。验证过程中临时改过 `temp/profiles/packages/scene.json` 的 current-scene 以驱动 Preview，已恢复且不纳入提交。

## 与 spec 的偏差 / 关键决策
- 可选 #4（`addButton` 每帧重注册/重绘）评估后保持现状。
  - 原因：`addButton` 同时更新 label、enabled/interactable、按钮背景与 click 回调；`出牌/不要/提示`、暂停确认、设置开关均可能随状态变化。为低优先级优化跳过注册容易引入 stale 按钮风险。
  - 建议后续若要做，应先给按钮状态建立稳定签名缓存，并用 Creator 交互复核所有按钮态。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] `renderRuntimeSettings` / `playCue` 不再调用本地存储读取。
- [x] `toggleRuntimeSetting` 仍即时更新 `this.settings` 并持久化。
- [x] `startGame` 重置 `submitting`，暂停重开不会继承旧提交锁。
- [x] cue 播放改为 `AudioSource.playOneShot(clip)`。
- [x] Creator 3.8.8 Preview 编译通过，无 runtime / console error。
- [x] 390x844 截图已落盘。
- [x] 未改 scene/meta/root 配置。
- [x] typecheck / full test / diff check 通过。
