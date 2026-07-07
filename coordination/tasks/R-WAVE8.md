# R-WAVE8 — v1.3 技术债清偿版审查任务书（审查者专用）

- 适用：T-MEMORY-REAL / T-RUNTIME-SPLIT / T-VIEW-SEAT / T-PROFILE-FOLLOWS / T-DOCS-SYNC / T-UIHELPERS / P-GS-SPLIT2 / P-BID-POLISH / V7
- 通用核验/能力边界/回扫/交接：同 R-WAVE1 1-7 条 + PROTOCOL（批次作业·双层视觉预审关·精确机器态）。审查者不判美观。
- lane：A 波（MEMORY-REAL→RUNTIME-SPLIT 串行；VIEW-SEAT/PROFILE/DOCS 随到随合）与 B 波（UIHELPERS→GS-SPLIT2→BID-POLISH 串行）双执行窗并行、共用单 lane 排队；V7 最后。

## R:T-MEMORY-REAL（**三闸·高风险 flow+ai**）
- [ ] 种子未改（`git diff main..task -- test/` 仅规划者 `3548ae8`）；7 用例全绿（2 红转绿）。
- [ ] 文件域仅 flow/{types,driver,round-runtime,policies}+ai/{strategy,levels/hard}+report；**game/、rules/ 零触碰**；`trackPlayed` 本体未改。
- [ ] `AiStrategy` 第三参**可选**：既有两参直调测试（hard/normal/simple/hint/conservative 全家）**零改动全绿**——逐一确认未被重跑豁免。
- [ ] 接管规则实现与 spec 钉死条件一致（跟牌/非 pressing/非队友/history 非空/仅 Single/最小绝对最大单/位置在 controlFollow 后 conservative 前）；评分常数逐字未动（diff 核 scoreLeadMove/penalty/bonus 数字）。
- [ ] runtime 调用点（decidePlayAction 处）传 `fullGameEvents`（diff 指认）；driver 传累积 gameEvents。
- [ ] **质量门重验**：quality.ts 三档门全绿；报告含前后指标对照表（回退即打回并转规划者）。确定性：无 rng 新消费。
- [ ] 置 `approved-pending-planner` 排队 → 规划者结构性把关认可改 `approved` → 合并。

## R:T-RUNTIME-SPLIT（常规·move-only 强化）
- [ ] 串行前置确认：基于含 T-MEMORY-REAL 的 main。
- [ ] `RoundRuntime` 公共接口零变化；新模块不入 flow/index 桶；`--color-moved=zebra` 纯搬移、发现顺手改=打回。
- [ ] runtime 全家测试（hardening/diagnostics/resume/bidding-visibility/exceptions）零改动全绿；全量零回归。

## R:T-VIEW-SEAT（常规·F3 扩域 2026-07-07）
- [ ] 种子未改（规划者种子 commit：ai-thinking 改种 `a89320f` + bidding-view 侧别改种 `9e8fb01`）；ai-thinking 5 + bidding-view 7 用例全绿（侧别 2 红转绿）。
- [ ] 文件域仅 `ai-thinking-view.ts` + `bidding-view.ts` + `game-scene/bid-actions-renderer.ts` + `game-scene/seat-display.ts` + report；与 `seatDisplayName` 真相源一致（1=右/2=左）。
- [ ] **F3 单轨化核**：bidding-view seatLabel 源头改正；bid-actions-renderer 去 `swapLegacySideText` 包装与 import；seat-display 删该函数（`seatDisplayName`/`visualSideForSeat`/`dropZoneForSeat` 零 diff）；全仓 `rg swapLegacySideText` **0 命中**。
- [ ] 报告含渲染字符串等价自证（swap(legacy)≡fixed 逐席对照·无需截图）；纯岛零 `cc`；全量+typecheck 零回归。

## R:T-PROFILE-FOLLOWS（常规）
- [ ] **产品代码零改动**；bench 不入 vitest 默认套件（跑套件时长不变）；数据可复现（命令/seed/环境记录）；报告只有数据无优化实现。

## R:T-DOCS-SYNC（常规·不虚标）
- [ ] 仅 docs/*+CLAUDE.md+report；逐改动点核 BOARD/report 依据（虚标=打回）；记牌条目与 T-MEMORY-REAL 实际状态一致。

## R:T-UIHELPERS（常规）
- [ ] 文件域仅 ui-helpers+两组件+strings.ts+report；`addUiButton` 2026-07-07 全仓 grep 已 0 命中（历次清理已删·本任务不含此项·执行者报告如实记录）；`drawPanel` 保留（5 处消费）。
- [ ] 组件侧机械替换（diff 核无逻辑改动）；**文案迁移零漂移**（grep：迁移清单字面前后逐字一致、组件内不再出现已迁移字面量）。
- [ ] 报告含改前/改后四横屏对照 + 执行者自审表 + **规划者视觉审结论（BOARD）**——缺一不合并；`productErrors=[]`；全量零回归。

## R:P-GS-SPLIT2（常规·move-only 强化·2026-07-07 基点期扩项）
- [ ] 拆前基线截图在案；`--color-moved=zebra` 纯搬移；skeleton 1775 → **<800 行**；strings rider 零漂移（T-UIHELPERS 已迁尽·预计 strings.ts 零改动·组件零汉字现状保持）。
- [ ] 不变量自证清单（settled 门控/相位互斥/逆时针/卡面/暂停两组按钮 + C 波新增：disposed 隐藏暂停入口/顶栏 live 值/暂停冻结）逐项核；四横屏对照 + `productErrors=[]`；规划者视觉审结论在案。
- [ ] **C 波接线原样搬迁核**：resume 重建调用/顶栏 live VM 消费/termination 轮询+去重 flag/`openPauseMenu→pause()`·`closePauseMenu→resume()`·重开与返回大厅不调 resume——语义零改（diff 内容只挪位置）；runtime-pause/advance-reentry/termination-feedback/resume-replay 测试全家零改动全绿。
- [ ] **共享件不回退核**：拆出模块消费 `addSkinnedButton`/`addSkinnedSprite`/`drawPanelSkin`/`t()`，无本地重实现（新模块 `\bButton\b` 装配仅经共享件）；`SETTLEMENT_TRANSIENT_HUD_NODE_NAMES` dead 条目原样在（不删·归 P-BID-POLISH）。

## R:P-BID-POLISH（常规·2026-07-08 批次连做扩项）
- [ ] **种子搬运逐字节核**：`diff coordination/seeds/P-BID-POLISH-bidding-advisor.test.ts test/ai/bidding-advisor.test.ts` 为空（规划者预写·执行者仅搬运·独立 seed commit）；按档断言全绿（Simple 阈3/Normal 阈2/Hard 阈1 + `strong ≡ isStrongHand(hand, thresholdFor(level))` 全对齐）。
- [ ] `bidding-levels.ts` diff **仅 `export` 一词**（thresholdFor 语义/数值/其余零改）；`bidding.ts` 零 diff；G4 `advisorEnabled=false` 未改（红线）。
- [ ] 建议面板仅叫抢期存在（相位互斥 diff 核）、默认低打扰、消费既有纯层（UI 无规则重算）；零新增重叠。
- [ ] 半裁徽标修复 + 左列密度微调 + termination 按钮 decorated 收编有 zoom/对照证据；T-LAYOUT4 契约不回归。
- [ ] dead 条目删除（若做）：`SETTLEMENT_TRANSIENT_HUD_NODE_NAMES` 仅删 `last-action-0/1/2` 三项 + settled 相四横屏行为零变化证据；未做则零 diff。
- [ ] **批次串行合并**：本分支含 P-GS-SPLIT2 提交——SPLIT2 先合后本分支序合；两任务一次批量审。
- [ ] 执行者自审表 + 规划者视觉审结论在案；四横屏 + `productErrors=[]`；全量零回归。

## R:V7（verify-only）
- [ ] diff 仅 reports/V7*；四横屏全相位 e2e + 不变量回归 + 新面证据；AI 新基线表对照 v1.2（回退即报；胜率差经 `difficulty.ts`/`levelPolicies` 真历史链路取数，`[quality]` 两参直调数值不作真记牌基线——见 V7 卡口径注记）；同屏验收页产出；用户轻签收项列明不代判。
- [ ] 合并后披露：V7 done + 用户轻签收 → 规划者 v1.3 版本终局裁定。

---
验收披露/阻塞升级沿 R-WAVE1 尾部模板；交接用 `templates/handoff.md`。
