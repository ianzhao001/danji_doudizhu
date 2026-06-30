# M3-55 新手教程屏（编辑器·绑 M3-50 · 第十二批·打磨）

- 状态：**done `a817c98`**（M6-editor 收口；运行时注入，未改 scene/meta）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·单写者）· 编辑器串行分支
- 文件域：`assets/scene/lobby.scene`（加教程入口）+ `assets/scripts/ui/components/*`（新 cc 组件）+ `.meta`、report
- 依赖：**M3-50**（`tutorialSteps()`）
- 验收按 BOARD「编辑器任务验收模板」

## 目标
lobby 加「教程」入口，渲染 `tutorialSteps()` 分步引导（上一步/下一步/跳过），消费 M3-50 view-model（组件薄）。

## 行为要求
1. 遍历 `tutorialSteps()` 逐步展示 title+body；`nextStep` 驱动翻页；可跳过返回 lobby。
2. 守「不手写 scene/meta」铁律（运行时注入或编辑器编排·report 说明）。390×844 不溢出。

## 验收
- 教程屏分步展示、翻页/跳过可用；Creator 编译零报错；cc 仅在新组件。
- **390×844 截图**（首步 + 中间步）；report 含 Creator 版本/截图路径/scene·meta 改动/worktree 无本地残留。
