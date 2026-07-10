# P-PLAY-FEEL — 出牌手感真实化（划选 / 要不起 / 降序理牌）

- **批次**：v1.4 第一波 W-UNIFY·UI 批第 2 棒（自 P-THEME-APPLY 尖链式续做）
- **类型**：UI/场景（`P-*`·双层视觉预审关适用）
- **执行者**：Cursor　**审查者**：Codex　**视觉审②**：规划者

## 背景与动机
对照真实斗地主的核心手感，三处交互差距（纯逻辑基座已由 T-INTERACT-VIEWS 备好）：
1. **划选**：真实游戏手指扫过手牌连续选中；当前只能逐张点。
2. **要不起**：无合法跟牌时真实游戏明确告知并只留一个动作；当前只是按钮静默变灰。
3. **理牌**：真实游戏手牌**大→小**从左到右；当前升序。

## 文件域
- `assets/scripts/ui/components/game-scene-skeleton.ts`（手牌触摸接线、按钮状态消费）
- `assets/scripts/ui/components/game-scene/**`（涉及手牌/操作行渲染的 renderer）
- `assets/scripts/ui/strings.ts`：**仅允许追加** `'action.mustPass': '要不起'` 一类新 key（不改既有 key 值）
- `coordination/reports/P-PLAY-FEEL.report.md`（+截图/录屏证据）

## 要求
1. **划选多张**：手牌区接 TOUCH_MOVE，用 `dragSelectCards(slots, fromX, toX)`（T-INTERACT-VIEWS）算扫过集合；扫过的牌**统一置为选中**（不是逐张 toggle 抖动），手指抬起结算一次；与既有单点 toggle 共存（点=切换，划=批量选）。选中弹起视觉沿用既有。
2. **要不起**：消费 `deriveFollowUx().mustPass`——为 true 时：出牌/提示禁用；「不要」钮文案切『要不起』并用 THEME 强调色突出；回合一开始即呈现（不等玩家点提示才发现）。**只是呈现层叠加**：按钮可用性真相源仍是 `deriveActionButtons`，两者不一致时以后者为准并在报告标记。
3. **降序理牌**：手牌渲染改用 `sortForDisplay`（大→小）；选中集合、hint 高亮、出牌校验等链路经回归确认不依赖升序（它们按 Card 身份比对，应天然兼容——报告给出验证说明）。
4. 以上三件都**不得**触碰「超时仅视觉、绝不自动出牌/过牌」契约——要不起状态下也**不自动过牌**，等玩家亲点。

## 验收与证据
- 全量 test + typecheck 绿。
- **录屏**：一段划选（扫 4+ 张一次选中）+ 一段要不起回合（AI 出大牌→hero 回合即时显『要不起』→点击过牌）。
- 四横屏截图：playing 相（降序手牌 + 要不起态各一张）。
- CDP `productErrors=[]`；视觉自审① → 规划者视觉审②。

## 红线
- 不改 `ui/*.ts` 纯岛与 `test/**`；`deriveActionButtons`/`deriveFollowUx` 只消费。
- 不动 AI/flow/game 层；不加自动过牌/自动出牌。
- 既有单点选牌、提示循环、出牌校验行为零回归。
