# M3-30 大厅场景（绑定 lobby/stats/records/settings view-model）

- 状态：blocked（待 M3-29 完成；同 `task/M3-editor-integration` 分支串行其后）
- 派发模式：**编辑器执行者**（非 worktree·Cocos Creator）
- 执行分支：`task/M3-editor-integration`
- 文件域：
  - Cocos 场景目录（编辑器约定，如 `assets/scene/`）：新建大厅 `.scene`
  - Cocos 预制体目录（如 `assets/prefab/`）：大厅控件预制体（如需）
  - `assets/scripts/ui/components/`（新·**Cocos 组件·import cc**·绑定既有 view-model；**任何 Vitest 不得 import**）
  - `.meta` 由编辑器生成
- 依赖：M3-29（资源）；既有 view-model（`ui/lobby-view`/`stats-view`/`records-view`/`settings-view` 均已并 main）。**不强依赖 M5-20**——绑定时再注入 runtime localStorage（`cocosStorage()`）可后接，缺则内存兜底。

## 目标
建大厅场景，组件薄、调用既有 view-model 派生 VM 渲染。入口：开始新局、继续游戏、设置、战绩。

## 行为要求
- 大厅组件（import cc）：onLoad 读 storage（M5-20 `cocosStorage()` 注入，缺则内存兜底）→ `loadSettings`/`loadSave`/stats/records → 调 `deriveLobbyView`/`deriveStatsView`/`deriveRecordsView`/`deriveSettingsView` → 绑 UI。
- 「继续游戏」按钮可用性 = `deriveLobbyView` 的续局标签（有存档槽才亮）。
- 组件**不重判规则、不内联派生逻辑**——全部走 view-model（组件变薄）。
- 纯逻辑零改；组件层 import cc 但**不被任何测试 import**（不进 Vitest 编译图）。

## 验收
- 场景在 Cocos Creator 打开**无报错**，控件可见，资源实际显示（lobby-bg / 头像 / 按钮）。
- **390×844 预览截图**一张。
- 既有测试与 typecheck 不受影响。
