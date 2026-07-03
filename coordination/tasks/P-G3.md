# P-G3 — game-scene 四阶段流水线：拆分 → 消费新契约/修重叠 → 美术接线 → 文案

- 状态：ready（阶段①②可开工；③依赖 ART-IMPORT-UIKIT）
- 类型：编辑器/运行时（单写者流水线，分阶段 commit + 分段提审）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/components/game-scene-skeleton.ts`
  - 新 `assets/scripts/ui/components/game-scene/`（4 个渲染器模块，阶段①创建）
  - `coordination/reports/P-G3.report.md`
- 依赖：T-DEDUP ✅ / T-LAYOUT2 ✅ / T-FLOW-BID ✅（均已 main）；阶段③另需 ART-IMPORT-UIKIT
- 分支：`task/P-G3`
- worktree 缺 tsconfig 照例拷贝。**涉及 CDP 截图/构建实操：执行者代验取证**（PROTOCOL 铁律 6）。

## 阶段①：move-only 拆 4 热区渲染器（服务目标5·先拆后改）

把以下渲染器**原样搬**入 `ui/components/game-scene/`（签名收敛为 `(ctx, …)`，`ensureNode`/`liveRenderNodes`/回调 owner 经 ctx 透传，有 v1.1 T-0 先例）：
- `seats-renderer.ts`：renderSeats / renderSeatFeedback / lastActionPosition / aiThinkingPosition
- `bid-actions-renderer.ts`：renderBidding / renderActions / renderStatus / renderTurnTimer / renderAdvisor（y∈209-298 窄带全部住户）
- `hud-renderer.ts`：renderHud(强度) / renderCardMemory
- `result-overlay-renderer.ts`：renderResult + 结算遮罩

**纪律**：①阶段**禁止任何行为/坐标/文案改动**——拆前先交四横屏×三相基线截图（commit 附产物），拆后逐屏对照「视觉等价」；`git diff --color-moved=zebra` 应呈纯搬移；audio/振动/卡面/tween **不拆**（纠缠最深收益最低，留 v1.3）。

## 阶段②：消费新契约 + 修 17 对重叠 + 流程门控

1. **布局消费**：全部取位改走 `tableZones(w,h)`（T-LAYOUT2 已合）：infoStrip（地主/倍数/手牌数徽标带，修 地主∩左家、手牌数∩右家）、statusLine、actionBar（**相位互斥**：叫抢期只渲染叫抢键组、playing 只渲染出牌键组——不再 disabled 同帧叠画）、strengthMeter/turnTimer 分列两翼、memoryDock/advisorDock 左右半屏、dropZone×3、bottomCardsDock。
2. **17 对重叠检查单逐项核销**（V 报告 + 规划书取证清单），四横屏截图佐证。
3. **叫抢期可见手牌**（T-FLOW-BID 已合）：render 循环在 bidding 相取 `runtime.biddingDeal()`，经 `deriveScreenVM({ biddingHand })` 铺 17 张（不可交互选牌）；手牌数/对手计数用 biddingDeal 的 handCounts；发牌动画在 deal 事件后播、**叫抢按钮在发牌动画完成后才 enable**。
4. **亮底牌**：消费 `bottomRevealed` 事件——bottomCardsDock 先牌背 ×3，事件到达翻面展示 3 张并入地主手（简单缩放动画即可）；叫抢期 dock 显示牌背。
5. **per-seat 出牌落点**：`snapshot.top` 按 `top.seat` 渲染进 dropZoneLeft/Right/Hero（谁出的牌落谁区），中央不再共用。
6. **结算遮罩清场**：renderResult 前显式 dim + 隐藏底层 HUD（endRenderDiff 只裁未触达节点，需显式处理）。
7. **音效/动效/震动 chips 迁入暂停菜单**（离开牌桌中央）。
8. **叫抢期计时**：复用 turn-timer（15s，手牌可见后玩家会思考更久）。
9. **seed 注入口**：`seed: Date.now()>>>0`（现 :255 附近）支持 URL query 覆写（~5 行，V2 可复现 e2e 的前提）。
10. optional：接线 `bidding-advisor`+`bidding-advice-view`（纯层全套已存在有测试，叫抢建议面板）。

验收：四横屏 ×｛叫抢（17 张可见+牌背 dock+bid 键独占）、亮底牌瞬间、出牌（三区落点+检查单）、结算（清场）｝截图 + `productErrors=[]` + 全量 vitest/typecheck 不回归。

## 阶段③：美术接线（依赖 ART-IMPORT-UIKIT 落 main；与④可交换）

33 张已导入美术 + 新 uikit 接线：面板皮(panel-popup 九宫格)换 drawPanel、按钮三态皮换 drawButtonBackground、icon 贴键、座位头像+avatar-frame、landlord/farmer badge、badge-multiplier/turn/countdown、名字牌底板、bottom-cards-dock 底板、card-back 牌背、结算 badge-win/lose、emphasis-bomb/rocket/spring 特效贴图、empty-records 空态。强度条/计时进度条/遮罩保留代码绘制。
验收：按钮三态/面板九宫格无变形（窄宽两档）/头像徽标牌背到位，四横屏截图。

## 阶段④：命名/文案收尾（可与③交换）

运行时节点语义命名清理；可见文案检查单（无开发味）。

## 红线
不碰 test/**；不碰 flow/ai/data 层；`.scene`/`.meta` 不手写；阶段①严格 move-only。

## 交付物
分支分阶段提交 + 报告（每阶段附证据）；每阶段提审 → 审查者按 `tasks/R-WAVE2.md` 评审（可分段 approved，整分支合并在④后或③④完成后一次执行）。
