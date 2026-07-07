# T-VIEW-SEAT Report

## Status

- Result: complete
- Branch: `task/T-VIEW-SEAT`
- Worktree: `/Users/admin/Documents/Cocos/斗地主.worktrees/T-VIEW-SEAT`
- Scope: only touched declared UI file domain plus this report.
- Note: this task branch was first merged with latest `main` inside the worktree to pick up current batch context; `main` itself was not modified.

## Changes

- `assets/scripts/ui/ai-thinking-view.ts`
  - Corrected hero-relative offset wording: offset 1 is `AI 右家`, offset 2 is `AI 左家`.
- `assets/scripts/ui/bidding-view.ts`
  - Corrected bidding prompt source labels: seat 1 is `右家`, seat 2 is `左家`.
- `assets/scripts/ui/components/game-scene/bid-actions-renderer.ts`
  - Removed the legacy side-text swap at render time; prompt text now renders directly from the canonical source.
- `assets/scripts/ui/components/game-scene/seat-display.ts`
  - Deleted `swapLegacySideText`; retained `seatDisplayName`, `visualSideForSeat`, and `dropZoneForSeat` unchanged.

## F3 Equivalence Proof

Legacy path had two tracks:

- `bidding-view.ts`: seat 1 emitted `左家`; renderer then called `swapLegacySideText`, producing `右家`.
- `bidding-view.ts`: seat 2 emitted `右家`; renderer then called `swapLegacySideText`, producing `左家`.

Fixed path is single-track:

- `bidding-view.ts`: seat 1 emits `右家`; renderer displays it unchanged.
- `bidding-view.ts`: seat 2 emits `左家`; renderer displays it unchanged.

Therefore:

- `等待左家叫地主` + legacy swap = `等待右家叫地主` = fixed seat 1 direct output.
- `等待右家叫地主` + legacy swap = `等待左家叫地主` = fixed seat 2 direct output.
- The same equivalence holds for `抢地主` prompts because only the side words changed.

`visualSideForSeat` remains seat 1 = right and seat 2 = left, so prompt text now matches the table-seat visual mapping at the source.

## Verification

- `npm --prefix test install`: pass
- `npm --prefix test test -- ai-thinking-view bidding-view`: pass, 2 files / 12 tests
- `npm --prefix test test`: pass, 149 files / 770 tests
- `npm --prefix test run typecheck`: pass
- `git diff --check`: pass
- `rg -n "from 'cc'|from \"cc\"" assets/scripts/ui/ai-thinking-view.ts assets/scripts/ui/bidding-view.ts`: 0 hits
- `rg -n "swapLegacySideText" assets/scripts`: 0 hits

Planner note: the exact broader command `rg -n "swapLegacySideText" assets test` still has one hit in `test/ui/bidding-view.test.ts:5`, where the seed test comment names the legacy helper. Tests are outside the task's editable scope and were not modified; there are 0 product-code/import hits.

## Review (审查者·GLM-5.2·2026-07-08)

- Verdict: **approved**
- Branch: `task/T-VIEW-SEAT` @ `460904e`（merge-base `afe4a75`·executor commit `460904e`·planner seeds `a89320f`+`9e8fb01`）

### 文件域核销

- 执行者 commit `460904e` 仅触 4 产品文件 + 报告：`ai-thinking-view.ts` / `bidding-view.ts` / `game-scene/bid-actions-renderer.ts` / `game-scene/seat-display.ts` ✅
- 测试 diff 全来自规划者种子（`a89320f` ai-thinking 改种 + `9e8fb01` bidding-view 侧别改种），执行者零改测试 ✅

### F3 单轨化核

- `bidding-view.ts` seatLabel 源头改正：seat 1 = `右家`、seat 2 = `左家`（原 1=左/2=右 已翻转）✅
- `bid-actions-renderer.ts`：`swapLegacySideText` import 已删、包装已去、直用 `bidding.prompt`；该文件不再 import `seat-display`（grep 确认 0 命中）✅
- `seat-display.ts`：`swapLegacySideText` 函数体已删（7 行净删）；`seatDisplayName`/`visualSideForSeat`/`dropZoneForSeat` 零 diff ✅
- `seatDisplayName` 真相源：seat 1 = `右家`、seat 2 = `左家`，与 `visualSideForSeat`（1=right/2=left）一致 ✅
- `ai-thinking-view.ts`：offset 1 = `AI 右家`、offset 2 = `AI 左家`（原 offset 1=左家/offset 2=右家 已翻转）✅

### 等价自证核

- swap(legacy) ≡ fixed 逐席对照：seat1 legacy「左家」→swap→「右家」≡ fixed 直出「右家」；seat2 对称 ✅
- 渲染输出零变化，无需视觉截图 ✅

### 红线核

- `rg swapLegacySideText assets/`：0 命中（产品码全清）✅
- `rg swapLegacySideText test/`：1 命中于 `test/ui/bidding-view.test.ts:5` 注释行（规划者种子·执行者无权改·非 import/非调用）——**非阻断**，转规划者留意：checklist 措辞「全仓 0 命中」与种子注释并存，可顺手清理注释或订正措辞
- 纯岛（`ai-thinking-view.ts` + `bidding-view.ts`）零 `cc` import ✅

### 质量门

- `npm --prefix test test`：149 files / 770 tests 全绿 ✅
- `npm --prefix test run typecheck`：净 ✅
- `git diff --check`：净 ✅

### 全量回扫

- 覆盖全仓 + 本任务 diff（4 产品文件 + 2 种子测试 + 报告）
- 回扫结果：0 域内致命 · 0 域外致命 · 1 拿不准（上述 test 注释 swapLegacySideText 残留·非阻断·转规划者）
- 跨模块回归：`swapLegacySideText` 唯一消费点 `bid-actions-renderer.ts` 已去包装直用 prompt；无其他消费者（全仓 grep 确认）；`seat-display.ts` 其余导出未改，无下游影响
