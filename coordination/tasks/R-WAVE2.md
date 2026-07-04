# R-WAVE2 — v1.2 Wave 2 审查任务书（审查者专用）

- 适用任务：T-AI-2 / P-G3（四阶段）/ P-L3（两阶段）/ ART-IMPORT-UIKIT
- 流程/能力边界/阻塞升级/全量回扫：同 [R-WAVE1.md](R-WAVE1.md) 通用核验 1-7 条（文件域、种子完整性、双绿、红线、非文字模态只审证据、blocked 转规划者、逐行细读 + `approved` 前全量回扫及三路分流）。
- 合并 lane：T-AI-2 随到随合；P-G3/P-L3 分阶段提审、**整分支合并**在各自末阶段 approved 后执行（两流水线共用单 lane 排队）。

---

## R:T-AI-2 检查单
- [ ] 种子全绿：`hard-timing`（pressing 领出/残局收割/不挥霍守卫）+ `hardening`（改后 pressing 领 K）+ `quality` Hard 门（组合率 ≥0.50 且 ≥Normal−5pp[同带不回落]；压队友 ≤0.08；胜率差 Hard−Normal ≥+0.03、Hard−Simple ≥+0.10）+ `difficulty-config` 文案契约。
- [ ] **零改动全绿**：`hard.test.ts`/`hard-depth`/`normal-combo`/`tie-breaker`/`simple`/`conservative-action-paths`/`hint*`。
- [ ] **红线**：`simple.ts`/`normal.ts`/`lead-score.ts`/`compareMoves` 未动（`git diff` 逐行核）；`_shared.ts` 只加不改；无 `rng.` 新调用（确定性）。
- [ ] difficultyConfig 仅 description 改动（label/thinkDelayMs 不动）。
- [ ] 自主判断：压制/收割启发式可解释（报告权重取舍）；收官路径无「为组合而组合」误伤（发现即打回）。
- [ ] **合并后在验收披露中确认**：BOARD 的「Normal>Hard 过渡态」登记由本任务关闭（胜率差门为证）。

## R:P-G3 检查单（分阶段）
**阶段①（move-only 拆分）**
- [ ] 拆前基线截图（四横屏×三相）在报告中；拆后逐屏对照视觉等价（审查者核证据链，不亲验图像）。
- [ ] `git diff --color-moved=zebra` 呈纯搬移；**零行为/坐标/文案改动**（发现顺手改=打回）。
- [ ] 新模块限 `ui/components/game-scene/` 4 文件；audio/振动/卡面/tween 未拆。
- [ ] 全量 vitest/typecheck 不回归。
**阶段②（消费新契约）**
- [ ] 取位全走 `tableZones`；actionBar **相位互斥**（叫抢期无出牌键组节点，不是 disabled 叠画——审 diff 确认不渲染）。
- [ ] 17 对重叠检查单在报告逐项核销 + 四横屏截图证据。
- [ ] 叫抢期：`biddingDeal()` 消费、17 张可见不可选、计数正确、发牌动画后才 enable 叫抢键、15s 计时。
- [ ] `bottomRevealed`：dock 牌背→翻面 3 张；per-seat 落点（top.seat → 对应 dropZone）。
- [ ] 结算遮罩清场（截图中底层 HUD 不可见）；chips 迁入暂停菜单；seed URL 覆写口存在（审 diff ~5 行）。
- [ ] `productErrors=[]`；vitest/typecheck 不回归。
**阶段③（美术接线）**
- [ ] 仅在 ART-IMPORT-UIKIT 落 main 后开始；33+新图接线对照 spec 清单齐全；按钮三态/面板窄宽两档无变形截图；强度条/计时条/遮罩仍代码绘制。
**阶段④（文案命名）**
- [ ] 文案检查单核销；节点命名语义化抽查。

## R:P-L3 检查单（分阶段）
**阶段①**
- [ ] `savedSlot` 接真存档（diff 核 `deriveLobbyView` 入参不再硬编码 null）；有档/无档两态截图；续局恢复截图（手牌/计数与退出前一致）。
- [ ] 未碰 game-scene/纯层；`STORAGE_KEYS` 复用（无新字面量键）。
- [ ] `productErrors=[]`；vitest/typecheck 不回归。
**阶段②**
- [ ] 同 P-G3③ 口径：接线齐全、三态/九宫格无变形、home+6 子屏截图。

## R:ART-IMPORT-UIKIT 检查单
- [ ] 文件域仅：`assets/resources/art/ui/*.png`(+`.meta` Creator 生成) + `ui/asset-keys.ts`(新 2 键) + report；**未碰两巨组件**（接线归 P-G3③/P-L3②）。
- [ ] 导入图与 main 上 `asset-previews/v12-uikit/` 对应 preview **逐字节一致**（sha256 对比：seat-nameplate / bottom-cards-dock / btn 三态重制版）。
- [ ] `panel-popup.png` **未被替换**（仅 `.meta` 配 border）。
- [ ] 九宫格 border 机械核验：btn-*×3 / panel-popup / seat-nameplate / bottom-cards-dock 的 `.meta` borderLeft/Right/Top/Bottom **全部 >0**（对照执行者报告的取值依据）。
- [ ] 种子键断言转绿（`seatNameplate: 'art/ui/seat-nameplate'`、`bottomCardsDock: 'art/ui/bottom-cards-dock'`）；全量 vitest/typecheck 不回归。
- [ ] `.meta` 由 Creator 生成（报告记 UUID 与 border 值），不手写。

---
验收披露/阻塞升级格式沿用 [R-WAVE1.md](R-WAVE1.md) 尾部模板。
