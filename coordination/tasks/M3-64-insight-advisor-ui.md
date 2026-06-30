# M3-64 出牌建议 advisor UI（编辑器·绑 M3-61 · 第十三批·打磨）

- 状态：**done `a817c98`**（M6-editor 收口；运行时注入，未改 scene/meta）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·单写者）· 编辑器串行分支
- 文件域：`assets/scripts/ui/components/game-scene-skeleton.ts`（或新组件）+ `.meta`、report
- 依赖：**M3-61 insight-view**（→ M4-40 adviseAction）；可与「提示」按钮（M3-33）并存或合并
- 验收按 BOARD「编辑器任务验收模板」

## 目标
玩家回合可选显示「智能建议」浮条：用 `deriveInsightView(adviseAction(hand, top))` 给出推荐出牌/过牌文案。**默认可关**（避免打扰高手），由设置或按钮切换。

## 行为要求
1. 玩家回合时，按当前手牌 + top 调 `adviseAction`→`deriveInsightView` 渲染建议文案（强手 emphasize）。
2. advisor 开关：可由一个按钮/设置控制显隐（关闭则完全不显示，不影响出牌）。
3. 守 scene/meta 铁律；不遮挡手牌/按钮。390×844 不溢出。

## 验收
- 建议浮条按手牌更新、可开关、关闭无残留；Creator 编译零报错；cc 仅在组件。
- **390×844 截图**（建议浮条开/关）；report 按验收模板填全。
