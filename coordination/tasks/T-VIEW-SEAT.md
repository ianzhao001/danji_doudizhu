# T-VIEW-SEAT — 座位映射对齐逆时针（ai-thinking-view + F3 bidding 侧别两轨清账）

- 状态：ready（种子已验红 `a89320f`+`9e8fb01`：ai-thinking 2 红/3 绿 + bidding-view 侧别 2 红/5 绿——seat1 现「左家」断「右家」、seat2 现「右家」断「左家」两席镜像互反·恰证 legacy 全反；**F3 扩域·2026-07-07**）
- 任务模式：seeded-red（纯 view·禁 import `cc`）+ 一行接线（bid-actions-renderer 去包装）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/ai-thinking-view.ts`（offset 1=右家/下家、offset 2=左家/上家）
  - `assets/scripts/ui/bidding-view.ts`（**F3**：`seatLabel` 改 1=右家/2=左家，对齐 `seatDisplayName` 真相源）
  - `assets/scripts/ui/components/game-scene/bid-actions-renderer.ts`（**F3**：去 `swapLegacySideText(bidding.prompt)` 包装 → 直接用 `bidding.prompt`，并删该 import）
  - `assets/scripts/ui/components/game-scene/seat-display.ts`（**F3**：删 `swapLegacySideText` 导出——唯一消费点已去；`seatDisplayName`/`visualSideForSeat`/`dropZoneForSeat` 一字不动）
  - `coordination/reports/T-VIEW-SEAT.report.md`
  - **测试规划者已改种不可再改**：`test/ui/ai-thinking-view.test.ts` + `test/ui/bidding-view.test.ts`（侧别断言改种）
- 依赖：—（A 波随到随合；`game-scene/bid-actions-renderer.ts`/`seat-display.ts` 不在 P-GS-SPLIT2 新建名单，与 B 波 T-UIHELPERS 文件域零交叉；先于 P-BID-POLISH 合入即无通配域冲突）
- 分支：`task/T-VIEW-SEAT`（种子 `a89320f` + F3 补种 `9e8fb01`）

## 背景
v1.2 P-G7 逆时针座位映射（seat1=右/seat2=左）后遗留两处旧映射：① `ai-thinking-view.ts` label 旧映射（渲染层未消费·latent）；② **F3（C 波审查稿 CONFIRMED·2026-07-07）**：`bidding-view.ts:23-27` seatLabel 仍 1=左家，靠 `seat-display.ts:14-19 swapLegacySideText` 在 `bid-actions-renderer.ts:24` 做字符串互换纠偏——**两轨并存**（源头错 + 补丁翻转）。本任务清账：源头对齐真相源 `seatDisplayName`（1=右/2=左），删互换补丁，单轨化。

## F3 等价自证（报告必含）
`swapLegacySideText(legacyPrompt)` 与 `fixedPrompt` 逐字符串等价（seat1：legacy「左家」→swap→「右家」≡ 修后直出「右家」；seat2 对称）——渲染输出零变化，无需视觉截图；以改种 vitest + 全量回归 + 全仓 `swapLegacySideText` grep 0 命中收口。

## 验收
- 改种用例全绿（ai-thinking 5 + bidding-view 7，其中侧别 2 用例红转绿：seat1→`等待右家叫地主`、seat2→`等待左家叫地主`）；
- 全量 vitest/typecheck 零回归；纯岛（ai-thinking-view/bidding-view）零 `cc` import；
- `rg swapLegacySideText assets/ test/` **0 命中**（含 import 行）；
- 审查按 R-WAVE8 R:T-VIEW-SEAT（常规·F3 扩域项已同步）。
