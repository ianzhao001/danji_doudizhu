# M3-46 帮助屏 + 暂停叠加层（编辑器·绑 M3-42/L12 · 第十一批·打磨）

- 状态：blocked（待 M3-42 help-content + M6-L12 pause-menu 入 main；编辑器串行）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8）· 编辑器串行单写者
- 文件域：`assets/scene/{lobby,game}.scene`（加帮助入口 + 游戏内暂停按钮/叠加层）+ `assets/scripts/ui/components/*`（新 cc 组件）+ `.meta`（编辑器生成）
- 依赖：**M3-42 `helpSections()` + M6-L12 `PauseState` 状态机**（入 main）

## 目标
- 帮助/规则屏：lobby 加「帮助」入口，渲染 `helpSections()` 分节文本（离线、无网络）。
- 游戏内暂停叠加层：game 场景加暂停按钮 → 用 `pause-menu` 状态机驱动 menu/confirm-quit；「继续」关闭、「重开」调 round-runtime 重开、「退出」二次确认后返回 lobby。

## 行为要求
1. 帮助屏：遍历 `helpSections()` 渲染 title + lines；可滚动；返回可用。
2. 暂停叠加层：按钮 → `openMenu`；菜单含 继续/重开/退出；退出走 `askQuit`→`confirm-quit`→确认才返回 lobby（`cancelQuit` 回菜单）。状态切换走 L12 纯函数，组件只渲染 stage。
3. 守「不手写 scene/meta」铁律（运行时注入或编辑器编排，report 说明）。390×844 不溢出。

## 验收
- 帮助屏显示规则分节；暂停叠加层各转移正确、退出有二次确认。
- 编辑器编译零报错；cc 仅在新组件。
- **390×844 截图**：帮助屏 + 暂停菜单 + 退出确认。
