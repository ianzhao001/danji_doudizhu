# M3-59 难度选择面板 UI 报告

## 范围
- 任务：M3-59-difficulty-picker-ui
- 分支：task/M6-editor
- 文件域：`assets/scripts/ui/components/lobby-scene.ts` + 本报告 + 390x844 截图
- 未手写 scene / meta

## 实现
- 用 `deriveDifficultyPicker(current)` 渲染三档难度 label、description 与当前态。
- 点击难度行仍复用既有 `setDifficulty(loadSettings(...), level)` + `saveSettings` 写侧。
- 底部改为统一半透明设置面板，教程/帮助、音效/震动/动效开关、三档难度说明都在同一区域内，避免 390x844 下挤压到底部边缘。
- 当前难度摘要从 picker VM 的 selected option 推导，不再维护组件内重复 label 表。

## Cocos Creator 3.8.8 复核
- Project：`/Users/admin/Documents/Cocos/斗地主.worktrees/M6-editor`
- Preview：`lobby.scene` (`dc62324b-10d4-4870-9518-1a34ce682067`)
- 设备：Apple iPhone 12/13/14 预览，390x844，DPR 2
- CDP runtime errors：`[]`
- Creator packer 日志重新 resolve `assets/scripts/ui/components/lobby-scene.ts`，最新段未见 Error / failed / exception

## 交互验证
- 初始渲染包含：
  - `difficulty-label-simple` / `difficulty-label-normal` / `difficulty-label-hard`
  - 三档 description，其中普通档按宽度拆为两行
  - 默认 `difficulty-current-normal`
- 点击困难行后：
  - 静态摘要更新为 `难度 困难`
  - `difficulty-current-hard` 出现
  - `localStorage["doudizhu.settings"]` 写入 `"difficulty":"hard"`
- 重新导航 lobby 后仍为困难档，持久化有效。

## 截图
- `coordination/reports/M3-59-difficulty-picker-390x844.png`

## 验证命令
- `npm --prefix test run typecheck`
- `npm --prefix test test -- ui/difficulty-picker-view.test.ts ui/settings-view.test.ts ui/lobby-view.test.ts`
- `npm --prefix test test`（128 files / 632 tests passed）
- `git diff --check`
