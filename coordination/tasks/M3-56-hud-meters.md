# M3-56 对局 HUD：强度条 + 已出牌（编辑器·绑 M3-51/54 · 第十二批·打磨）

- 状态：blocked（待 M3-51 + M3-54 + M4-30 + M4-31 入 main；编辑器串行）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·单写者）· 编辑器串行分支
- 文件域：`assets/scripts/ui/components/game-scene-skeleton.ts`（或新 HUD 组件）+ `.meta`、report
- 依赖：**M3-51 strength-meter-view + M3-54 card-memory-view**（及其 AI 依赖 M4-30/31）
- 验收按 BOARD「编辑器任务验收模板」

## 目标
游戏内加两个可选 HUD：① 手牌强度条（`deriveStrengthMeter(evaluateHand(hand))`）；② 已出牌/剩余面板（`deriveCardMemoryView(trackPlayed(events, hand))`）。组件薄、只渲染 VM。

## 行为要求
1. 强度条：用 `evaluateHand` + `deriveStrengthMeter` 渲染 pct 条 + 档位色调，每次手牌变化刷新。
2. 已出牌面板：用 `trackPlayed`（消费组件已维护的 `recentEvents`/全量事件）+ `deriveCardMemoryView` 渲染剩余张数行；可折叠。
3. 守 scene/meta 铁律；不遮挡手牌/按钮（与 C3a SafeArea 协调）。390×844 不溢出。

## 验收
- 强度条随手牌变化、已出牌面板随出牌递减；Creator 编译零报错；cc 仅在组件。
- **390×844 截图**（含 HUD）；report 按模板填全。
