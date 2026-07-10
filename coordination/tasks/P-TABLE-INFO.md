# P-TABLE-INFO — 桌面信息真实化（最近出牌亮牌面 / 报单报双警示）

- **批次**：v1.4 第一波 W-UNIFY·UI 批第 3 棒（自 P-PLAY-FEEL 尖链式续做·批末一次交接）
- **类型**：UI/场景（`P-*`·双层视觉预审关适用）
- **执行者**：Cursor　**审查者**：Codex　**视觉审②**：规划者

## 背景与动机
真实斗地主桌面上，各家最近一手以**真实迷你牌面**摆在席位旁（读牌型一眼即得），某家剩 1/2 张时全桌**报单/报双**警示。当前实现最近出牌是文字药丸（v1.3 T-LASTACT-LEGIBILITY 的深色药丸），无报单报双。纯逻辑基座已备好：`deriveLastPlays`（T-LASTPLAY-CARDS·含 cards/emphasis）与 `deriveFollowUx().alerts`（T-INTERACT-VIEWS）。

## 文件域
- `assets/scripts/ui/components/game-scene/seats-renderer.ts`（最近出牌区改造 + 席位警示徽标）
- `assets/scripts/ui/components/game-scene/play-area-renderer.ts`（如迷你牌面落中央出牌区一侧更合适，二选一或分工，报告说明取舍）
- `assets/scripts/ui/components/game-scene-skeleton.ts`（仅接线新派生数据，量级小）
- `assets/scripts/ui/strings.ts`：仅允许追加新 key（如 `'seat.lastOne': '报单'`）
- `coordination/reports/P-TABLE-INFO.report.md`（+截图证据）

## 要求
1. **最近出牌亮牌面**：`kind==='play'` 的席位用**迷你卡面**渲染 `cards`（复用既有卡面渲染件/`card-node` 资产路径，缩小版；点数花色可辨）；`emphasis` 为 bomb/rocket 时叠既有强调底（`emphasis-{bomb,rocket}` 资产在 `art/ui/`）。`kind==='pass'` 维持文字『不要』药丸。**宽度自适应**：≤5 张常规间距；>5 张（顺子/连对/飞机，最长 12 张）压缩叠距，保证最窄档 780×360 不越席位区、不压中央出牌区。恢复局（resume）经既有 `resume-rebuild` 链路同样呈现（deriveLastPlays 吃同一事件流，理应自然成立——截图证实）。
2. **报单/报双**：消费 `alerts`——对应席位挂警示徽标（『报单』/『报双』+ THEME danger/warning 色），**状态驱动**（每次 render 按 alerts 全量重算，不做一次性动画依赖）；首次触发时可复用既有音效 cue 通道（若无现成合适 cue 则只做视觉，**不新增 CueId**——那是契约面，留待后续任务）。
3. 文字药丸链路（`deriveLastActions`）**保留**为 pass 文案与可达性兜底，不删。

## 验收与证据
- 全量 test + typecheck 绿。
- 四横屏截图 × 相位：playing（单张/对子/长顺子 12 张/炸弹强调各一景）、某席报单+另席报双同框、resume 恢复局牌面重建对照。
- CDP `productErrors=[]`；视觉自审①（重点：长顺子不重叠溢出、迷你牌可辨、徽标不与药丸/头像相交）→ 规划者视觉审②。
- 批末（THEME-APPLY + PLAY-FEEL + TABLE-INFO 三任务）用 handoff 模板做**一次**交接给审查者。

## 红线
- 不改 `ui/*.ts` 纯岛与 `test/**`；不动 game/flow 事件形状；**不新增 CueId**（M6-G17 编译期穷尽断言域）。
- v1.2/v1.3 成果零回归：settled 覆盖层遮盖、逆时针席位映射、last-action 可读性（T-LASTACT-LEGIBILITY）不得倒退——迷你牌面就位后若与药丸样式冲突，以牌面为主、药丸只剩 pass。
- 布局越界即打回项：最窄 780×360 任何新元素与既有面板相交。
