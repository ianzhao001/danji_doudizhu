# P-G7-UIFIX3 — v13 游戏内三轮视觉/交互整改（V5 用户签收 4 否点）

- 状态：ready（阶段①可开工；阶段②依赖 ART-IMPORT-PAUSE-BTN）
- 任务模式：editor-evidence（Cocos Creator 3.8.8 + CDP·**双层视觉预审前置·从严**）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `assets/scripts/ui/components/game-scene/*.ts`（seats / bid-actions / hud / result-overlay）
  - `coordination/reports/P-G7-UIFIX3.report.md`
- 依赖：P-G6-UIFIX2 ✅`1951f88`；阶段②另需 ART-IMPORT-PAUSE-BTN
- 分支：`task/P-G7-UIFIX3`
- 红线：不碰 test/纯层/lobby/scene/meta/resources；**不改 game 层出牌轮转逻辑**（`nextSeat` 不动·#3 是 UI 映射）；保 T-FIX-SETTLE settled 门控 + 相位互斥 + T-LAYOUT4 无重叠 + 卡面无中心数字不回归。

## 背景

V5 用户签收 4 否点（`reports/V5-user-review.md`）。**#3 经查是 UI 座位映射问题非 game 逻辑**：`game/seat.ts nextSeat=(seat+1)%3` 抽象轮转正确；但 UI 把 seat 1 渲染到左（左家）→ 视觉呈顺时针；标准斗地主逆时针（下家在右）。

## 阶段①（无美术依赖·可即开工）

1. **出牌顺序改逆时针（#3·UI 座位映射·不动 game 逻辑）**：seat 1（下家，hero 后先出）渲染到**右侧**、seat 2 到**左侧**——一致翻转所有 seat 1/2 → 左右映射：`seats-renderer.ts` `seatName`(现 1=左家/2=右家 → **1=右家/2=左家**)、body(`opponentLeftBody`/`RightBody` 消费)、nameplate、思考条、last-action、**及 `game-scene-skeleton.ts renderPlayArea`(:578) 的 `top.seat===1?dropZoneLeft:dropZoneRight` 落点翻转**。核验：hero 出后牌落**右**家区、右家先出、再左家（逆时针）。**全处一致**（人物/名字牌/落点/思考同侧），无左右错配。
2. **出牌区多牌不重叠（#2·右家/任意家出顺子等）**：`renderPlayArea`(:578-608)——多张牌（顺子 5+/连对/飞机）在 dropZone 内**按可用宽等距铺开或整体缩放**至不互压；**牌型标签**（如「顺子」/已出牌）置于牌**上方或下方净空**、不压牌面；多张牌角标不互相遮盖。四横屏 × {单/对/顺子/飞机} 出牌截图佐证。
3. **左右家文字/btn 显示异常（#4）**：复现并修（右家侧 nameplate 文字/角色行/任何 btn 显示异常——疑与座位映射或 nameplate 渲染相关）；执行者报告须附**问题复现前后对比截图**。

阶段①验收：四横屏全相位 + 出牌牌型多档 CDP 截图 + `productErrors=[]` + 逆时针出牌链证据；双层视觉预审（执行者自审→规划者视觉审）→ 审查 R:P-G7-UIFIX3 阶段① → 合并。

## 阶段②（依赖 ART-IMPORT-PAUSE-BTN 落 main）

4. **暂停面板 6 按钮（#1·用户裁决另生美术）**：`renderPauseMenu`(:770+)——① 消费新 pause 按钮皮肤键（ART-IMPORT-PAUSE-BTN 提供）；② **btn 背景完整包裹文字**（现 音效/动效/震动 72×30 太小 9-slice 压变形 → 加高容 border + label 内）；③ **两组各同色高对比**：音效/动效/震动（组1）同一文字色、继续/重开/退出（组2）同一文字色，各与底皮反差；④ 面板整体不丑、无重叠。四横屏暂停面板（menu + confirm）截图。

阶段②验收：暂停面板四横屏截图 + 双层视觉预审 → 审查阶段② → 整分支合并。

## 交付物

分支分阶段提交 + 报告（自审勾销表 + 针对性 zoom：逆时针出牌/出牌区多牌/左右家/暂停面板）→ 双层视觉预审 → 审查按 `tasks/R-WAVE7.md` → approved 合并 → V6 收口 → 用户再签收。
