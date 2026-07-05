# P-G6-UIFIX2 — v13 游戏内二轮视觉整改（V4 用户签收 5 项不通过）

- 状态：ready
- 任务模式：editor-evidence（Cocos Creator 3.8.8 + CDP 截图·**双层视觉预审前置·本轮 gate 从严**）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `assets/scripts/ui/components/game-scene/*.ts`（seats / bid-actions / hud / result-overlay 四渲染器）
  - `coordination/reports/P-G6-UIFIX2.report.md`
- 依赖：P-G5-UIFIX ✅`b13896c`（本任务在其上继续调 render）
- 分支：`task/P-G6-UIFIX2`
- 红线：不碰 test/纯层/lobby/scene/meta/resources；不重做美术；保 T-FIX-SETTLE settled 门控 + 相位互斥 + per-seat 落点 + T-LAYOUT4 无重叠不回归（zone gap≥8 仍在，render 偏移不得视觉重叠）。

## 背景

V4 用户审美签收 5 项不通过（`reports/V4-user-review.md`）。**含两项复发**（按钮、人物位置）——规划者前轮视觉预审漏判，本轮 gate 从严。逐条按用户原文 + 代码根因整改。

## 行为要求（逐条·file:line 根因）

1. **人物更外移+上移（用户2·复发）**：`seats-renderer.ts` 左上/右上立绘再向左/右屏缘 + 上移（现 render 偏移不足）；hero 亦可微调。**保持三立绘互不重叠 + 不压手牌/按钮/名字牌**。幅度交规划者视觉审把关。
2. **名字牌角色信息清晰 + 不深入牌桌（用户3）**：① 名字牌须清晰显示 **地主/农民 角色**（现 地主农民信息不清）；② 左家/右家名字牌**过于深入牌桌felt** → 移到靠近各自立绘/屏缘（不再飘在牌桌中部），**仍不压立绘 sprite**（T-LAYOUT4 无重叠不回归）。人物上移后其下方近屏缘正好容名字牌。
3. **出牌区点数可见 + 手牌数字增大（用户4·通过带增强）**：① 三家出牌落到牌桌（dropZone）的牌，**点数/角标须清晰可见**（现出牌牌面缩放 0.74 + 仅小角标 → 桌面看不清）——放大出牌区牌面或角标、确保 rank 可读；② 手牌角标数字（`card-rank-label`）适度增大提可读。
4. **按钮包裹文字 + 反差对比（用户5·复发·本轮务必彻底）**：`addButton`（game-scene-skeleton.ts:980-1029）——① btn 背景（btn-*-v13 九宫格）**必须完整包裹文字**（文字不得溢出药体/被爱心帽挤压；按需增大按钮盒或缩字或调 9-slice 使药体容下 label）；② btn 底色与文字色**高反差**（校验四态 + 各皮肤）。规划者视觉审将逐颗按钮核包裹+对比。
5. **结算 5 子项（用户6）**：`result-overlay-renderer.ts`——
   - a. 修文字重叠：结算面板内任何文字（鼓励语/分数/按钮）**互不重叠**（找出「继续加油」类文本与结算信息重合处并分层）；
   - b. **「失败/胜利」横幅文字不超出横幅底图**（现 banner 文字过大溢出 `settlement-banner-*-v13`——按 bannerWidth/Height 约束字号或加内边距）；
   - c. 顶部**「本局结算」标题与底纹不重叠、加对比**（加深色底衬/描边，勿铺在花纹上低对比）；
   - d. **「返回大厅」去掉冗余返回箭头图标**（`buttonIconPath` result-lobby→iconBack 删除，文字已表意）；
   - e. **同层级按钮文字颜色一致**：再来一局(primary)/返回大厅(secondary) 文字色现为 `BUTTON_PRIMARY_TEXT(116,36,82)` vs `BUTTON_SECONDARY_TEXT(白)` 不一致 → 结算同层两键文字色统一（择一高对比色）。
6. **整体零重叠（用户7）**：全相位四横屏**任何视觉元素两两不重叠**（含 HUD/名字牌/立绘/按钮/文字）——这是硬门。

## 验收（双层视觉预审·本轮从严 + 客观门）

- **执行者自审**：报告填自审勾销表（重叠/对比/包裹/闪烁 + 本轮追加：出牌点数可见/结算 5 子项/按钮逐颗包裹）。
- **规划者视觉审**：逐张四横屏 + 针对性 zoom（按钮特写、结算特写、出牌区特写、人物+名字牌特写）；**逐项对照用户 5 条否点**达标才放行用户。不达标打回。
- **客观门**：四横屏全相位 CDP 截图 + `productErrors=[]`；vitest/typecheck 不回归（141/739）；settled 门控 + 相位互斥 + T-LAYOUT4 无重叠不回归。

## 交付物

分支提交 + 报告（自审勾销表 + 针对性 zoom 证据）→ 双层视觉预审 → 审查者按 `tasks/R-WAVE6.md` R:P-G6-UIFIX2 结构审 → approved 合并 → V5 收口 → 用户再签收。
