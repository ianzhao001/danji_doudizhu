# M3-56 对局 HUD：强度条 + 已出牌（编辑器·绑 M3-51/54 · 第十二批·打磨）

- 状态：done（已并 main `87f3f56`；Creator 3.8.8 / 390×844 复核通过）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·单写者）· 编辑器串行分支
- 文件域：`assets/scripts/ui/components/game-scene-skeleton.ts`（或新 HUD 组件）+ `.meta`、report
- 依赖：**M3-51 strength-meter-view + M3-54 card-memory-view**（及其 AI 依赖 M4-30/31）
- 验收按 BOARD「编辑器任务验收模板」

## 目标
游戏内加两个可选 HUD：① 手牌强度条（`deriveStrengthMeter(evaluateHand(hand))`）；② 已出牌/剩余面板（`deriveCardMemoryView(trackPlayed(events, hand))`）。组件薄、只渲染 VM。

## 行为要求
1. 强度条：用 `evaluateHand` + `deriveStrengthMeter` 渲染 pct 条 + 档位色调，每次手牌变化刷新。
2. 已出牌面板：用 `trackPlayed(events, hand)` + `deriveCardMemoryView` 渲染剩余张数行；可折叠。
   - **⚠️ 必须喂全量对局事件，不能用 sliced `recentEvents`**（组件现有 `recentEvents` 截到最近 12 条，喂它会漏算→面板错）。组件须**单独维护一份全量 `GameEvent[]`**（从 FlowEvent 的 `round` 完整提取 game events 累积），或从 runtime 取完整事件流。
   - `ownHand` 传**当前手牌**（非初始 17 张）；`trackPlayed` 已对 events 里自己已出的牌扣减，**避免初始手牌 + 已出事件双重扣减**——即「当前手牌 + 公开已出」即为「已知去向」，未见 = 总量 − 二者。实现方按 M4-31 `trackPlayed` 语义核对：若它已从 events 扣自己出的牌，则 ownHand 只扣**当前**剩余手牌。
3. 守 scene/meta 铁律；不遮挡手牌/按钮（与 C3a SafeArea 协调）。390×844 不溢出。

## 验收
- 强度条随手牌变化；已出牌面板随出牌递减且**数字正确**（审查者须验：喂全量事件而非 recentEvents；无双重扣减——抽查某点数剩余 = 54 牌该点总量 − 当前手牌该点 − 公开已出该点）。
- Creator 编译零报错；cc 仅在组件。
- **390×844 截图**（含 HUD）；report 按模板填全 + 注明「事件源 = 全量 GameEvent」。
