# M3-59 难度选择面板 UI（编辑器·绑 M3-58 · 第十二批·打磨）

- 状态：blocked（待 M3-58 difficulty-picker-view 入 main；编辑器串行）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·单写者）· 编辑器串行分支
- 文件域：`assets/scripts/ui/components/lobby-scene.ts`（升级难度控件）+ `.meta`、report
- 依赖：**M3-58**（`deriveDifficultyPicker`）；复用 C1 已接的 `setDifficulty`+`saveSettings`
- 验收按 BOARD「编辑器任务验收模板」

## 目标
把 C1 现有的三个难度按钮升级为带**描述文案**的难度选择面板：用 `deriveDifficultyPicker(current)` 渲染 label+description+选中态，点击 `setDifficulty`→`saveSettings` 持久化（复用 C1 既有写侧）。

## 行为要求
1. 渲染三档：label + description + 选中高亮（消费 M3-58 VM，不重写配置）。
2. 点击切换调既有 `setDifficulty`+`saveSettings`（C1 已接线），刷新选中态。
3. 守 scene/meta 铁律。390×844 不溢出。

## 验收
- 三档显示描述、选中态正确、切换持久化（重开 lobby 记得）。
- Creator 编译零报错；cc 仅在组件；**390×844 截图**；report 按模板填全。
