# P-G5-UIFIX 实现报告

- 实现方标识：GPT-5.5 执行者
- 分支：`task/P-G5-UIFIX`
- 状态：ready-for-planner-visual-review-r3
- 记录时间：2026-07-05 19:10 CST

## 改了哪些文件

- `assets/scripts/ui/components/game-scene-skeleton.ts`
  - 删除卡面中心大号点数，仅保留角标与中心花色。
  - 装饰按钮高度统一兜底到 60px，文本下移到按钮主体区域，二级按钮文字改白色以提升对比。
  - 底牌托架增加 `lastBottomCardsSignature`，底牌 reveal 只在签名变化时播放一次动画。
  - 新增 v13 运行时贴图预加载，降低首局底牌/结算面板首帧白板或闪烁风险。
  - 手牌改用屏幕居中 frame 排列，不再以右侧 `heroHandLarge.x` 为起点。
  - 叫抢阶段不再额外渲染默认 `叫抢阶段`/`自由出牌` 文本，避免文字盖文字。
  - 顶部信息条拆开左右停靠，降低和底牌/人物/出牌区拥挤。
  - R1 返工：结算/暂停暗幕 alpha 加深，确保结算全屏压暗到底部手牌。
- `assets/scripts/ui/components/game-scene/bid-actions-renderer.ts`
  - 叫抢提示改为深色半透明底衬。
  - 叫抢/出牌按钮使用更高按钮盒并按 `tableActionBar` 可用宽度重新分配。
  - 建议开关避免使用小高度九宫格按钮。
- `assets/scripts/ui/components/game-scene/hud-renderer.ts`
  - 强度/记牌 HUD 适配 T-LAYOUT4 腾出的区域，修复窄宽下 bar 负宽/挤压。
  - 记牌收起按钮改为紧凑绘制按钮，避免 v13 九宫格在 28px 高度被压坏。
- `assets/scripts/ui/components/game-scene/result-overlay-renderer.ts`
  - 结算标题、胜负横幅、分数面板、按钮重新分层排布。
  - 面板暗幕加深；结算按钮使用 60px 高 v13 按钮。
- `assets/scripts/ui/components/game-scene/seats-renderer.ts`
  - 三个名字牌从人物节点中分离，按 T-LAYOUT4 nameplate zone 独立渲染。
  - 左上/右上人物在接线层轻微向桌心和桌面方向偏移，贴近参考关系。
  - AI 出牌反馈/思考条改停靠到 drop zone 附近，避免压人物。
  - R1 返工：按实际可视立绘矩形重新计算名字牌落点；hero 名字牌移到玩家外侧且让开手牌，左家名字牌强制清出底左 hero 区，右家名字牌跟随右侧立绘下方。
  - R2 返工：hero 名字牌压缩为小“你”牌，落在玩家立绘右侧外部、强度/记牌 HUD 左侧，四横屏几何 gap 均为 8px。

未改：`test/`、纯层、lobby、scene、`.meta`、`assets/resources/**`。

## 8 项整改对应

| 项 | 结论 | 证据 |
|---|---|---|
| 1. 卡面中心数字 | 已删 `card-face-rank` 渲染 | `rg card-face-rank` 无命中；截图中手牌仅角标 + 花色 |
| 2. 按钮包裹文字 + 对比 | 已改按钮高 >= 60；文字在按钮主体内；二级按钮白字 | 叫抢/出牌/结算 contact sheet |
| 3. 底牌消闪烁 | 已加底牌签名门控 + v13 贴图预加载 | 两轮结算/底牌截图稳定；无首帧白板 |
| 4. HUD 消费新区 | 已按 T-LAYOUT4 让开对家；修窄宽 bar | playing/selected/AI 出牌截图 |
| 5. 名字牌分离 | 已独立渲染 nameplate 节点 | 三座位 nameplate 计数=3，非 body 子布局 |
| 6. 结算整改 | 横幅/标题/分数/按钮分层；暗幕加深；transient 隐藏 | settlement 两轮 contact sheet |
| 7. 叫抢字对比 | 叫抢提示深色底衬 | bidding contact sheet |
| 8. 顶部信息条松绑 | 顶部 phase/地主/倍数/手牌分散停靠 | 四横屏全相位截图 |

补充响应用户最新反馈：
- 左上/右上人物：渲染层轻微向桌心和桌面方向偏移，保持不重做美术。
- 玩家手牌：改用左右等距的屏幕居中 frame，不再居右。

## 规划者视觉审 R1 打回记录

来源：`coordination/BOARD.md` UI-REMAKE 段「P-G5-UIFIX 规划者视觉审 R1」。

- 结论：`changes-requested`，不上交用户、不转审查者。
- 必修硬伤 1：底左名字牌压 hero 立绘，且左家名字牌疑似错位到底左；要求每名字牌落各自立绘下方/外侧，实测截图不压任何立绘 sprite。
- 必修硬伤 2：结算暗幕未盖底部手牌，面板下方底部手牌行仍全亮；要求暗幕全屏覆盖，守 T-FIX-SETTLE 口径。
- 软要求：左上/右上人物再向牌桌中心靠一点；确认手牌屏幕居中且不压牌；按钮顶部爱心九宫格失真可选处理。

## R1 返工实现

- 名字牌：
  - 不再直接使用 T-LAYOUT4 nameplate 原始 x/y 作为最终可视落点。
  - 先按实际渲染后的立绘尺寸和偏移计算 `seatBodyVisualRect`。
  - hero 名字牌放在玩家立绘右侧外部，并限制在手牌上方 12px 净空。
  - 左家名字牌放在左上立绘下方/外侧，并用 `heroBody.x + heroBody.width + 8` 作为最小 x，避免再次落到底左玩家区域。
  - 右家名字牌跟随右侧立绘下方/外侧。
- 立绘：
  - 左上/右上立绘继续向牌桌中心靠近，缩放为实际 zone 的 95%，向下轻贴桌面。
  - hero 立绘缩放为实际 zone 的 92%×90%，给外侧名字牌和手牌留净空。
- 结算暗幕：
  - `drawDimOverlay` alpha 由 176 加深到 218；R1 截图中底部手牌仍可辨但明显压暗，符合“牌桌可见但压暗、面板内无浮入”。

## 规划者视觉复审 R2 打回记录

来源：`coordination/BOARD.md` UI-REMAKE 段「P-G5-UIFIX 规划者视觉复审 R2」。

- 结论：`changes-requested`，仅 1 项残留重叠，仍不上交用户。
- R1 已清项（勿回退）：名字牌已移出立绘 sprite；结算暗幕已加深且底部手牌被压暗；立绘向桌心靠拢与缩放已接受。
- 唯一必修：playing 相位四档底左 hero「你 N张」名字牌压住「剩牌 大王...」记牌文本；要求清出记牌文本列，hero 名字牌 vs（记牌文本 + 强度条）实测 gap >= 8。
- 可选项：hero「你 N张」与顶部「手牌N」重复，允许简化。

## R2 返工实现

- hero 名字牌：
  - 不再渲染全宽「你 N张 / 角色」两行牌。
  - 在 `seatNameplateRect(0)` 中计算强度条与记牌器左边界，并把 hero 名字牌限制在该 HUD 列左侧。
  - 名字牌宽度按可用空间压缩，文案简化为单字「你」，清出 memoryDock 文本列。
  - 保持与 hero 可视立绘右边界 gap = 8，避免回退 R1 的“不压人物”结论。
- 未动项：
  - AI 名字牌、三家立绘、结算暗幕、按钮、卡面、顶部条、HUD 本身均未回退。

R2 几何核验（同渲染公式）：

| 横屏档 | hero 名字牌 | strength/memory 左边界 | vs HUD gap | vs hero body gap |
|---|---|---:|---:|---:|
| 844x390 | x=114,w=51 | 173 | 8 | 8 |
| 812x375 | x=110,w=48 | 166 | 8 | 8 |
| 915x412 | x=119,w=70 | 197 | 8 | 8 |
| 780x360 | x=106,w=46 | 160 | 8 | 8 |

## 执行者视觉自审勾销表

证据目录：
- 全量截图：`/tmp/doudizhu-pg5-uifix-evidence-r2-fix/`
- 汇总：`/tmp/doudizhu-pg5-uifix-evidence-r2-fix/summary.json`
- contact sheets：
  - `/tmp/doudizhu-pg5-uifix-evidence-r2-fix/contact-sheets/round1-bidding.jpg`
  - `/tmp/doudizhu-pg5-uifix-evidence-r2-fix/contact-sheets/round1-playing.jpg`
  - `/tmp/doudizhu-pg5-uifix-evidence-r2-fix/contact-sheets/round1-player-selected.jpg`
  - `/tmp/doudizhu-pg5-uifix-evidence-r2-fix/contact-sheets/round1-ai-play.jpg`
  - `/tmp/doudizhu-pg5-uifix-evidence-r2-fix/contact-sheets/round1-settlement.jpg`
  - `/tmp/doudizhu-pg5-uifix-evidence-r2-fix/contact-sheets/round2-settlement.jpg`
  - `/tmp/doudizhu-pg5-uifix-evidence-r2-fix/contact-sheets/r2-playing-bottom-left-zoom.jpg`

| 横屏档 | 叫抢 | 出牌 | 选牌 | AI 出牌 | 结算 | 自审结论 |
|---|---|---|---|---|---|---|
| 844x390 | 重叠/对比/包裹/闪烁已核 | 已核 | 已核 | 已核 | 已核 | 通过执行者自审 |
| 812x375 | 重叠/对比/包裹/闪烁已核 | 已核 | 已核 | 已核 | 已核 | 通过执行者自审 |
| 915x412 | 重叠/对比/包裹/闪烁已核 | 已核 | 已核 | 已核 | 已核 | 通过执行者自审 |
| 780x360 | 重叠/对比/包裹/闪烁已核 | 已核 | 已核 | 已核 | 已核 | 通过执行者自审 |

自审要点：
- 重叠：叫抢不再出现多层状态字；AI 出牌态移除 `已出牌` 文本压牌，思考条不压右侧人物；R1 后三名字牌均在各自立绘外侧/下方，不压 hero/left/right 立绘；R2 后 playing 底左 hero 小“你”牌与强度/记牌 HUD 左边界四档均保持 8px gap。
- 对比：叫抢提示有深色底；按钮文字与按钮底色形成反差。
- 包裹：叫抢/出牌/结算按钮均由 v13 背景完整包裹文字。
- 闪烁：底牌托架以签名门控动画，v13 贴图预加载后首局/第二局结算面板一致；结算暗幕全屏覆盖并压暗底部手牌。
- 手牌：四档均保持居中牌列，不再贴右；R1/R2 后 hero 名字牌不压选中/未选手牌。

## CDP 截图链汇总

固定 seed：`20260705`。脚本文件名仍带 `P-G4` 前缀，这是沿用既有 v13 e2e 脚本的命名，不代表任务号。R2 返工后证据目录为 `/tmp/doudizhu-pg5-uifix-evidence-r2-fix/`。

| 分辨率 | 截图数 | productErrors | failedResponses | 首局 | 第二局 | AI 出牌捕获 | 玩家出牌捕获 |
|---|---:|---|---|---|---|---|---|
| 844x390 | 11 | `[]` | `[]` | settled | settled | true | true |
| 812x375 | 11 | `[]` | `[]` | settled | settled | true | true |
| 915x412 | 11 | `[]` | `[]` | settled | settled | true | true |
| 780x360 | 11 | `[]` | `[]` | settled | settled | true | true |

覆盖：lobby、round1-bidding、round1-playing、round1-player-selected、round1-ai-play、round1-player-play、round1-settlement、round2-bidding、round2-settlement、round2-after-new-game、return-lobby。

## 构建与测试

```text
npm --prefix test test

Test Files  141 passed (141)
Tests  739 passed (739)
```

```text
npm --prefix test run typecheck

> doudizhu-rules-tests@0.0.0 typecheck
> tsc --noEmit
```

```text
git diff --check

<no output>
```

```text
Cocos Creator 3.8.8 web-mobile build
COCOS_EXIT=36
... build Task (web-mobile) Finished in (4 s)ms ...
```

说明：Cocos CLI 本机仍输出已知 `build-script` SIGTERM 调试行并返回 36；日志存在 `build Task (web-mobile) Finished` 且后续 CDP 截图链成功。

## 工作树状态

R2 提交前（相对上一提交 `3dfa09c`）：

```text
 M assets/scripts/ui/components/game-scene/seats-renderer.ts
 M coordination/reports/P-G5-UIFIX.report.md
```

提交后：

```text
git status --short --untracked-files=all

<no output>
```

## 规划者视觉审结论

- 状态：R2 返工后待规划者（Opus）R3 逐张视觉复审。
- 执行者不替规划者/用户做最终主观判断。
- 规划者视觉审通过后，再交审查者 `R-WAVE5 R:P-G5-UIFIX` 做结构/证据审；不直接交用户、不直接交审查者。

## 偏差 / 风险

- 无越域代码改动。
- 未重做任何美术资源；只消费既有 v13 资源。
- 截图证据暂存 `/tmp/doudizhu-pg5-uifix-evidence-r2-fix/`，未纳入 git。
- `P-G4` 文件名前缀为脚本历史命名偏差，报告已披露。

## 下一步

- 下一步找：规划者（Opus）。
- 原因：P-G5 是双层视觉预审任务，执行者自审已完成，必须先由规划者逐张视觉审。

给下一窗口的可粘贴提示词：

```text
你是本仓库 斗地主 的规划者（Opus）。本任务：P-G5-UIFIX 规划者视觉审。
先读：coordination/PROTOCOL.md（双层视觉预审关）、coordination/tasks/P-G5-UIFIX.md、coordination/reports/P-G5-UIFIX.report.md、coordination/BOARD.md UI-REMAKE 段最新裁定。
请逐张查看报告中的 /tmp/doudizhu-pg5-uifix-evidence-r2-fix/ 四横屏截图、contact sheets 和 r2-playing-bottom-left-zoom，重点核 R2 唯一必修项是否已清：playing 相位底左 hero 小“你”名字牌不再压「剩牌/展开/大王...」记牌文本列，且与 strength/memory HUD 左边界四档 gap 均为 8px。请同时确认 R1 已 accepted 项未回退：名字牌不压立绘、结算暗幕全屏压暗底部手牌、立绘靠拢、按钮/卡面/顶部条稳定。
若达标，请在报告「规划者视觉审结论」段追加结论并转审查者 R-WAVE5 R:P-G5-UIFIX；若不达标，请列出具体截图/问题打回执行者返工。
```

## 自检

- [x] 文件域仅 game-scene-skeleton + game-scene/* + report
- [x] 未改 `test/`、纯层、lobby、scene、`.meta`、`assets/resources/**`
- [x] 未重做美术
- [x] T-FIX-SETTLE settled transient 隐藏口径保留
- [x] 相位互斥未回归
- [x] per-seat 落点保留并避开人物
- [x] 执行者视觉自审已填
- [ ] 规划者视觉审待填

## 审查者验收披露（GLM-5.2 · 2026-07-05）

### 评审结论

**approved** — 打回轮次 0（执行者三轮视觉返工由规划者视觉审 R1/R2/R3 拦截，审查者不重复视觉判断）。

### 文件域核验

- 改动文件（`git diff --name-only main..task/P-G5-UIFIX`）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`（+154−34）
  - `assets/scripts/ui/components/game-scene/bid-actions-renderer.ts`（+36−18）
  - `assets/scripts/ui/components/game-scene/hud-renderer.ts`（+29−16）
  - `assets/scripts/ui/components/game-scene/result-overlay-renderer.ts`（+18−13）
  - `assets/scripts/ui/components/game-scene/seats-renderer.ts`（+103−55）
  - `coordination/reports/P-G5-UIFIX.report.md`（新增）
- 红线核：`test/` 零改动；纯层（`rules/game/ai/flow/data`）零改动；`ui/` 纯岛（非 `components/`）零改动；`lobby-scene.ts` 零改动；`.meta`/`.scene`/`assets/resources/` 零改动；`asset-keys.ts` 零改动；无新美术资源；无新 `.meta`。
- `coordination/BOARD.md` 在 `git diff main..task` 显示 6 行差，系规划者在 main 上追加的 R1/R2/R3 视觉审 note（task 分支早于这些 note 创建）——执行者未触 BOARD，合并将干净保留 main 的 R1/R2/R3 段（dry-run 验证无冲突）。

### spec 8 项逐条对应

1. **卡面中心数字删** ✅：`game-scene-skeleton.ts` 删 `card-face-rank` label 块（原 889-891），保留角标 `card-rank-label` + 中心花色 `card-suit-icon`（位置 -17→-7 居中）。
2. **按钮盒高≥60+标签包裹+对比** ✅：`addButton` 新增 `isDecoratedButton` 判定（`action-`/`bid-`/`result-`/`advisor-toggle`），`renderHeight = Math.max(height, 60)`；标签 `labelY = decorated ? -7 : 0` 落药体中心；`BUTTON_SECONDARY_TEXT` 改白色 (255,255,255) 提对比。
3. **底牌幂等消闪烁** ✅：`renderBottomCardsDock` 新增 `lastBottomCardsSignature` 字段 + `cardsSignature(cards)` 签名比对；`animateReveal = Boolean(cards) && settings.animation && signature !== lastBottomCardsSignature`；`deal`/`redeal` 事件重置签名为 ''；稳定态周期 render 不再重触发 tween。
4. **HUD 消费 T-LAYOUT4 新区** ✅：`hud-renderer.ts` strengthMeter `barWidth = Math.max(24, width-92)`、`barX=24` 适配窄宽；memoryDock toggle 改 `addCompactHudButton`（不用九宫格 btn 避免 28px 压坏）；`seats-renderer.ts` `lastActionPosition`/`aiThinkingPosition` 从 `opponentLeftBody`/`opponentRightBody` 改用 `dropZoneLeft`/`dropZoneRight`（不再压对家立绘）。
5. **名字牌分离渲染** ✅：`seats-renderer.ts` 拆 `renderSeatCard`（只画 body）与 `renderSeatNameplate`（独立节点）；三名字牌按 `seatNameplateRect` 落点：hero 在 body 右侧 + HUD 左侧（gap=8，compactWidth）；left 在 body 下方 + 清出 hero 区；right 在 body 下方；R2 返工后 hero 压缩为单字「你」牌。
6. **结算横幅不切叠+暗幕加深** ✅：`result-overlay-renderer.ts` 重排——`titleY = panelHeight/2-24`（标题）、`bannerY = panelHeight/2-78`（横幅）、multiplier/spring 在横幅下方分层；按钮 `buttonY = -panelHeight/2+34`、高 60、宽 124；`drawDimOverlay` alpha 132→218 全屏压暗。
7. **叫抢字底衬** ✅：`bid-actions-renderer.ts` 新增 `renderStatusPill`——`STATUS_BACKDROP = Color(64,38,60,186)` 深色半透明底衬 + `STATUS_TEXT = Color(255,247,226,255)` 浅色字；bidding prompt 与 status 均走 pill。
8. **顶部信息条松绑** ✅：`renderTopBar` 改左右停靠——`phasePos = screenPoint(canvas, 70, topY)`、`landlordPos = screenPoint(canvas, 178, topY)`、`multiplierPos = screenPoint(canvas, canvas.width-182, topY)`、`handPos = screenPoint(canvas, canvas.width-82, topY)`；不再拥挤居中。

### T-FIX-SETTLE settled 门控 + 相位互斥 + per-seat 落点核验

- `SETTLEMENT_TRANSIENT_HUD_NODE_NAMES` 数组保留（line 105）。
- `showTransientHud = phase !== 'settled'`（line 415）保留。
- `if (!showTransientHud) this.hideSettledTransientHud()`（line 418）保留。
- `if (event.type === 'settled')`（line 1232）保留。
- `if (phase === 'settled') return deriveAiThinking(HERO_SEAT, HERO_SEAT, 'settled', 0)`（line 1295）保留。
- `hideLiveSubtree` 遍历 `SETTLEMENT_TRANSIENT_HUD_NODE_NAMES`（line 1438）保留。
- 相位互斥：`if (phase === 'bidding') renderBidding` / `if (phase === 'playing') renderActions` / `if (showTransientHud && phase !== 'bidding') renderStatus`——叫抢期无出牌键组节点、出牌期无叫抢按钮。
- per-seat 落点：`dropZone = top?.seat === 1 ? layout.dropZoneLeft : top?.seat === 2 ? layout.dropZoneRight : layout.dropZoneHero`（line 581-585）保留；`lastActionPosition`/`aiThinkingPosition` 按 `seat === 1 ? dropZoneLeft : dropZoneRight` 落点。
- `bottomRevealed` 事件处理：`if (event.type === 'bottomRevealed') this.revealedBottomCards = event.cards.slice()`（line 371）保留；`renderBottomCardsDock(phase === 'bidding' ? null : this.revealedBottomCards, ...)` 保留。
- 再来一局/返回大厅：`result-overlay-renderer.ts` 按钮 `ctx.startGame(true)` / `director.loadScene('lobby')` 保留。

### 双层视觉预审核验

- **执行者视觉自审勾销表**：报告含四横屏×四类硬伤（重叠/对比/包裹/闪烁）勾销表，逐横屏勾销 + 自审结论「通过执行者自审」。
- **规划者视觉审结论**：BOARD.md UI-REMAKE 段记 R1（2 硬伤打回）→ R2（1 残留打回）→ **R3 = 达标·PASS**（`36c5703`），双层预审三轮拦下全部硬伤才放行——这正是双层预审关的设计目的（防第三次用户翻车）。
- 审查者 GLM 不感知图像，不替用户下主观结论；只核结构/契约/证据链/可复现。视觉达标由双层预审担保，用户做最终审美签收。

### 客观门

- **vitest**：`npm --prefix test test` → 141 文件 / 739 用例全绿（26.76s）。
- **typecheck**：`npm --prefix test run typecheck` → 通过（tsc --noEmit 净）。
- **git diff --check**：净（exit 0）。
- **CDP 截图链**：`/tmp/doudizhu-pg5-uifix-evidence-r2-fix/summary.json` → 4 横屏（844×390/812×375/915×412/780×360）× 11 captures，全部 `productErrors=[]`、`failedResponses=[]`；覆盖 lobby/bidding/playing/selected/ai-play/player-play/settlement/round2-bidding/round2-settlement/after-new-game/return-lobby；contact sheets 含 `r2-playing-bottom-left-zoom.jpg`（R2 必修项证据）。
- **构建**：Cocos Creator 3.8.8 web-mobile build，COCOS_EXIT=36（已知 SIGTERM 调试行），日志含 `build Task (web-mobile) Finished`。

### 全量回扫范围与分流结果

- **回扫范围**：本任务 diff 5 源文件 + report；跨模块检查所有 callers（`renderPlayArea`/`renderSeats`/`lastActionPosition`/`aiThinkingPosition`/`handLayoutFrame`/`seatBodyVisualRect`/`seatNameplateRect`）——均为文件域内私有/同模块调用，无外部消费者；纯层 grep `cc` 零命中；`asset-keys.ts`/`lobby-scene.ts`/`.meta`/`.scene`/`resources/` 零改动。
- **域内致命**：0。
- **域外致命**：0。
- **拿不准（非阻断）**：0（双层视觉预审已由规划者三轮把关，审查者不重复视觉判断）。
- **签名变化风险**：`renderPlayArea` 去掉 `showLabel` 参数——caller 仅 skeleton 内 `this.renderPlayArea(...)`（已同步去参）；`renderSeatCard` 签名重构——caller 仅 `renderSeats` 内部（已同步）。无外部 breakage。

### 合并

- merge base：`0f74067`（task 自此分叉）。
- dry-run `git merge --no-commit --no-ff task/P-G5-UIFIX`：Automatic merge went well，无冲突（BOARD.md 保留 main 的 R1/R2/R3 note）。
- `cocos.config.json` 工作树噪声（Cocos 编辑器 gizmo 设置）已 `git checkout` 恢复，不入库。
