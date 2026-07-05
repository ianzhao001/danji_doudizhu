# P-G5-UIFIX — v13 游戏内视觉硬伤整改（彻底整改·双层视觉预审前置）

- 状态：blocked（等 T-LAYOUT4 落 main）
- 任务模式：editor-evidence（Cocos Creator 3.8.8 实操 + CDP 截图）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `assets/scripts/ui/components/game-scene/*.ts`（bid-actions / hud / result-overlay / seats 四渲染器）
  - `coordination/reports/P-G5-UIFIX.report.md`
- 依赖：T-LAYOUT4 done（消费其新 zone）
- 分支：`task/P-G5-UIFIX`
- 红线：不碰 test/纯层/lobby/`.meta`/scene；**不重做美术**（btn-*-v13 现有美术合格，纯渲染问题）；保 T-FIX-SETTLE settled 门控 + 相位互斥 + per-seat 落点不回归。

## 背景

V3 用户视觉终审 7 项全否。规划者亲验 844×390 四相位截图定位全部代码级根因（下表）。本任务彻底整改（7 项 + 亲验同类硬伤）。**交付前置：双层视觉预审**（PROTOCOL 能力校准段）——执行者先自审四类硬伤（报告填自审勾销表）→ 规划者逐张视觉审达标 → 才交用户。

## 行为要求（逐条·file:line 根因）

1. **删卡面中心数字**（`game-scene-skeleton.ts:889-891` `card-face-rank`）：手牌/展示牌**中心不再画大号点数**；保留左上角标 `card-rank-label`(875-886) + 中心花色图标 `card-suit-icon`(894-900，居中即可)。用户：手牌中间不要再出现数字。
2. **按钮包裹文字 + 对比**（`addButton` 980-1029）：btn-*-v13 是 border 24 的 9-slice + 顶部爱心装饰；当前按钮高 46/26/30px < 48（2×border）致九宫格挤压变形、爱心横向拉伸。改：按钮高 **≥60px**（容 border 24 + 爱心装饰不失真），标签置**爱心下方药体中心**并确保背景完整包住文字，`buttonTextColor`(1047-1053) 与药体色高对比（校验四态：出牌/不要/提示/禁用 + 叫地主/不叫 + 再来一局/返回大厅）。tableActionBar 高度已由 T-LAYOUT/尺寸给足（≥44，按需在渲染侧放大按钮盒）。
3. **底牌消闪烁**（`renderBottomCardsDock` 499-525 + `addDisplayCard` animate 路径）：周期 render 不再重触发发牌 tween/重载 sprite——仅底牌 reveal 转场 animate 一次，稳定态幂等（参照 T-FIX-SETTLE 的 live-node 保活 + 签名比对，如 `lastPlayAreaSignature` 同款）。用户：头部底牌三张闪烁严重 bug。
4. **HUD 消费新区**（`hud-renderer.ts` strengthMeter/memoryDock + `bid-actions-renderer.ts` advisorDock）：强度/剩牌/建议按 T-LAYOUT4 新落点渲染，不再压对家立绘。
5. **名字牌分离渲染**（`seats-renderer.ts`）：三名字牌按 T-LAYOUT4 分离 zone 渲染，不贴人物。
6. **结算整改**（`result-overlay-renderer.ts`）：胜负横幅（`settlement-banner-*-v13`）与「本局结算」标题**不切叠**（去顶部被切的重复标题/让出横幅高度）；暗幕**加深**至底层手牌不透亮——守 T-FIX-SETTLE 口径（面板外暗幕牌桌可见但明显压暗、面板内无底层浮入、transient 全隐）。
7. **叫抢字提对比**（`bid-actions-renderer.ts:20` renderBidding prompt / `renderStatus`）：「轮到你抢地主」等状态字加半透明深色底衬或深色描边，浅桌面上可读。
8. **顶部信息条松绑**（`game-scene-skeleton.ts:440-490` top bar）：地主/倍数/手牌 徽标带不拥挤、不与出牌区/顶部叠压。

## 验收（双层视觉预审 + 客观门）

- **执行者自审**：报告填「执行者视觉自审勾销表」——四横屏×各相位逐张核 重叠/对比/包裹/闪烁 四类，达标才交规划者。
- **规划者视觉审**：规划者逐张看四横屏截图判达标（不达标打回执行者）；结论回填 R-WAVE5。
- **客观门**：四横屏（844×390/812×375/915×412/780×360）× {叫抢/出牌/选牌/AI出牌/结算/再来一局链/返回大厅} CDP 截图 + `productErrors=[]`；全量 vitest/typecheck 不回归（141/727）；settled 门控 + 相位互斥 + per-seat 落点不回归（diff + 截图佐证）。
- Cocos web-mobile 构建可出产物（CLI 退出 36 时日志含 `build Task (web-mobile) Finished`）。

## 交付物

分支提交 + 报告（含自审勾销表 + 证据目录）→ 双层视觉预审 → 审查者按 `tasks/R-WAVE5.md` R:P-G5-UIFIX 结构审 → approved 后整分支合并（lane 排队）。
