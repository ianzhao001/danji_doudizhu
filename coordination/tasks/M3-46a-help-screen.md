# M3-46a 帮助/规则屏（编辑器·绑 M3-42 · 拆自 M3-46·采纳建议#5）

- 状态：**done `a817c98`**（M6-editor 收口；运行时注入，未改 scene/meta）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·单写者）· 编辑器串行分支
- 文件域：`assets/scene/lobby.scene`（加帮助入口）+ `assets/scripts/ui/components/*`（新 cc 组件）+ `.meta`、report
- 依赖：**M3-42 `helpSections()`**（已在 main）
- 验收按 BOARD「编辑器任务验收模板」

## 目标
lobby 加「帮助」入口，渲染 `helpSections()` 分节规则文本（离线、无网络），可滚动、返回。组件薄、只渲染。

## 行为要求
1. 遍历 `helpSections()` 渲染 title + lines；长内容可滚动；返回 lobby 可用。
2. 守「不手写 scene/meta」铁律（运行时注入或编辑器编排·report 说明）。390×844 不溢出。

## 验收
- 帮助屏分节展示规则；Creator 编译零报错；cc 仅在新组件。
- **390×844 截图**（帮助屏）；report 按验收模板填全（Creator 版本/截图/scene·meta/Console/worktree 残留）。
