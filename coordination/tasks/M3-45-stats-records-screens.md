# M3-45 战绩/历史明细屏（编辑器·绑 L7/L8 · 第十一批·打磨）

- 状态：blocked（待 M6-L7/L8 + M3-40/41 视图模型入 main；编辑器串行）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8）· `task/M6-editor` 串行（C2/C3/C4 之后或单独编辑器分支，由架构按 .scene 单写者排期）
- 文件域：`assets/scene/lobby.scene`（加战绩/历史入口与子面板，或新 `assets/scene/stats.scene`）+ `assets/scripts/ui/components/*`（新 cc 组件）+ 对应 `.meta`（编辑器生成）
- 依赖：**M6-L7 `digestRecords` + M3-40 `deriveStatsDetailView` + M6-L8 `queryRecords` + M3-41 `deriveRecordsDetailView`**（全部入 main）

## 目标
把现有 lobby 的「战绩」入口接到真正的扩展战绩屏 + 历史明细屏（带过滤），消费 M3-40/M3-41 view-model（组件薄，不重算）。

## 行为要求
1. 战绩屏：调 `deriveStatsDetailView(digestRecords(records))` 渲染 StatsDetailRow 列表（records 来自 `loadRecords(cocosStorage())`）。
2. 历史屏：调 `deriveRecordsDetailView(records, query)` 渲染行 + 过滤按钮（全部/胜/负、地主/农民、最新/最早），点击切 query 重渲。
3. 守「不手写 scene/meta」铁律：复杂列表可运行时注入节点（同 C1 lobby 既有模式）或在编辑器内编排——执行者择一，report 说明。
4. 390×844 竖屏不溢出；返回 lobby 可用。

## 验收
- 战绩屏显示 L7 派生的连胜/最佳/分角色等；历史屏过滤生效。
- 编辑器编译零报错；纯逻辑/typecheck 不受影响（cc 仅在新组件）。
- **390×844 截图**：战绩屏 + 历史屏（含一种过滤态）。
