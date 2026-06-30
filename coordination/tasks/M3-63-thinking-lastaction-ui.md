# M3-63 AI 思考指示 + 上一手动作 UI（编辑器·绑 M3-60/62 · 第十三批·打磨）

- 状态：**done `a817c98`**（M6-editor 收口；运行时注入，未改 scene/meta）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·单写者）· 编辑器串行分支
- 文件域：`assets/scripts/ui/components/game-scene-skeleton.ts`（或新组件）+ `.meta`、report
- 依赖：**M3-60 ai-thinking-view + M3-62 last-action-view**
- 验收按 BOARD「编辑器任务验收模板」

## 目标
游戏屏增强反馈：① AI 回合显示「思考中…」点动效（`deriveAiThinking`）；② 每个座位旁显示上一手动作（`deriveLastActions(recentEvents)`）。组件薄、只渲染 VM。

## 行为要求
1. 思考指示：AI 回合用 `deriveAiThinking(turn, heroSeat, phase, tickMs)` 渲染 active 座位 + 点数动效（动效受 `settings.animation` 门控）。
2. 上一手：用组件已维护的 `recentEvents` 调 `deriveLastActions` 渲染三座位短文案。
3. 守 scene/meta 铁律；不遮挡手牌/出牌区（与 C3a SafeArea 协调）。390×844 不溢出。

## 验收
- AI 回合显示思考、座位旁显示上一手；Creator 编译零报错；cc 仅在组件。
- **390×844 截图**（AI 思考 + 上一手）；report 按验收模板填全。
