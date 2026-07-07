# P-BID-POLISH Report

## Status

- Result: complete; batch handoff should cover `P-GS-SPLIT2` + `P-BID-POLISH` together for planner visual review ②.
- Branch/worktree: `task/P-BID-POLISH` at `/Users/admin/Documents/Cocos/斗地主.worktrees/P-GS-SPLIT2`.
- Seed commit: `58ebc05 seed(P-BID-POLISH): relocate planner seed`.
- Implementation pending commit in this report's branch tip.

## Seed Relocation And Red Check

- `diff coordination/seeds/P-BID-POLISH-bidding-advisor.test.ts test/ai/bidding-advisor.test.ts`: empty (`SEED_DIFF_EXIT=0`).
- `npm --prefix test test -- bidding-advisor` after seed: expected red, 3 failed / 2 passed.
  - Simple/Hard assertions exposed the hard-coded threshold `2`.
  - Runtime import exposed `thresholdFor is not a function`.
- `npm --prefix test run typecheck` after seed: expected red.
  - `TS2459` for local-but-unexported `thresholdFor` (the same export-contract red the spec called out as TS2305-class).
  - Multiple `TS2554` for the missing third `AiLevel` argument.

## Implementation Summary

- `assets/scripts/ai/bidding-levels.ts`
  - Only change: `thresholdFor` gained `export`.
- `assets/scripts/ai/bidding-advisor.ts`
  - `adviseBid(hand, phase, level: AiLevel)` now uses `thresholdFor(level)`.
  - Normal behavior remains the former threshold-2 behavior; Simple/Hard now align with AI bidding levels.
- `assets/scripts/ui/components/game-scene/bid-actions-renderer.ts`
  - Bidding phase now renders a low-disruption advice toggle when it is the player's bidding turn.
  - Toggle on shows the light panel text, e.g. `建议：叫地主（手牌强）`.
  - UI consumes `adviseBid(hand, phase, ctx.settings.difficulty)` and does not recompute bidding rules.
- `assets/scripts/ui/components/game-scene-skeleton.ts` + `seats-renderer.ts`
  - Added independent `biddingAdvisorEnabled` state and `toggleBiddingAdvisor()`.
  - This keeps G4 play advice default off and prevents bidding-advice clicks from enabling the playing advisor.
- Visual polish:
  - Top-right hand badge/count moved left and narrowed slightly to avoid edge clipping.
  - Collapsed card-memory dock receives a small landscape downshift for left-column breathing.
  - `termination-feedback-*` buttons enter decorated rendering, moving text away from the button top ornament.
  - Removed dead `last-action-0/1/2` entries from `SETTLEMENT_TRANSIENT_HUD_NODE_NAMES`.

## Visual Evidence

- Full two-round e2e: `/tmp/doudizhu-p-bid-polish-e2e/summary.json`.
  - Viewports: `844x390`, `812x375`, `915x412`, `780x360`.
  - 11 captures per viewport; first and second rounds both reached `settled`.
  - `aiPlayCaptured=true`, `playerPlayCaptured=true`, `productErrors=[]` for all four viewports.
- P-BID targeted evidence: `/tmp/doudizhu-p-bid-polish-evidence/summary.json`.
  - 4 captures per viewport: `bidding-advice-off`, `bidding-advice-on`, `playing-left-top`, `termination-buttons`.
  - `productErrors=[]` for all four viewports.
  - `onPanelActive=true` for all four viewports.
  - `playingBidPanelActive=false` for all four viewports.
  - `termination-feedback-lobby/restart` active in termination screenshots for all four viewports.
- Contact sheets / zooms:
  - `/tmp/doudizhu-p-bid-polish-evidence/zooms/bidding-advice-contact.png`
  - `/tmp/doudizhu-p-bid-polish-evidence/zooms/playing-zooms-contact.png`
  - `/tmp/doudizhu-p-bid-polish-evidence/zooms/844x390-termination-buttons-zoom.png`
- Note: abnormal termination screenshots use CDP to place runtime into `disposed + error`, matching the existing T-TERM-FEEDBACK evidence method for this rare state. The final script avoids Cocos `UITransform` probing noise and reports `productErrors=[]`.

## Visual Self-Review

- Overlap: no observed overlap in four bidding on/off screenshots, four playing left/top zooms, or termination button zoom.
- Contrast: bidding advice panel and termination buttons remain readable on the table background.
- Fit/clipping: top-right hand count no longer sits on the screen edge; bidding advice text fits in the panel at `780x360`.
- Flicker/regression: full e2e and targeted toggling both complete with `productErrors=[]`; bid advice panel disappears after leaving bidding.

## Verification

- Cocos Creator 3.8.8 web-mobile build: pass (`build Task (web-mobile) Finished`; command exits with Creator's known `36` status).
- `npm --prefix test test -- bidding-advisor`: pass, 5 tests.
- `npm --prefix test test`: pass, 149 files / 769 tests.
- `npm --prefix test run typecheck`: pass.
- `git diff --check`: pass.

## Review (Reviewer · GLM-5.2)

- Result: **approved** (0 打回轮次 · 0 域内致命 · 0 域外致命 · 0 拿不准)
- Branch: `task/P-BID-POLISH`（seed `58ebc05` + impl `a87dd67`）
- 基点: main `c4d1156`

### 逐项核销

1. **bidding-levels.ts 仅 export 一词**: diff 仅 `function thresholdFor` → `export function thresholdFor`，chooseBidByLevel 逻辑/阈值数值零改 ✅
2. **bidding.ts 零改动**: `isStrongHand(hand, 2)` at line 17 未触 ✅
3. **adviseBid 签名向后兼容**: `adviseBid(hand, phase, level: AiLevel)` 无默认值，但所有调用点已更新为三参（bid-actions-renderer.ts:202 传 `ctx.settings.difficulty`；test 文件全三参）✅
4. **独立开关**: `biddingAdvisorEnabled` (skeleton:234) 与 `advisorEnabled` (skeleton:233) 互不干扰；`toggleBiddingAdvisor` (skeleton:645) 独立于 `toggleAdvisor` (skeleton:641)；startGame 中两者分别重置 (skeleton:317-318)；G4 出牌建议默认关 ✅
5. **bid-actions-renderer 消费 rules 层**: `adviseBid(hand, state.phase, ctx.settings.difficulty)` + `deriveBiddingAdviceView` 从 `bidding-advice-view.ts` 导入，UI 不重算规则 ✅
6. **SETTLEMENT_TRANSIENT_HUD_NODE_NAMES**: 删除 dead `last-action-0/1/2`，新增 `bid-advisor-toggle`/`bid-advisor-panel` ✅
7. **termination-feedback-* 加入 isDecoratedButton**: `name.startsWith('termination-feedback-')` 加入名单 ✅
8. **种子测试**: `diff coordination/seeds/P-BID-POLISH-bidding-advisor.test.ts test/ai/bidding-advisor.test.ts` 为空 ✅
9. **观感微调**: hud-renderer memory dock 横屏下移 -8px + 缩进修正；top-bar hand 徽章左移 (canvas.width-86 vs -68) + 宽度收窄 (58 vs 62)；seats-renderer 仅扩接口 ✅

### 全量回扫

- 覆盖全仓 + 整批 diff（P-GS-SPLIT2 + P-BID-POLISH 合计 25 文件）
- 回扫结果: 0 域内致命 · 0 域外致命 · 0 拿不准
- `thresholdFor` 导出: 仅 bidding-advisor.ts + test 消费，无其他消费者受影响
- `adviseBid` 签名变更: barrel-exports/view-model-immutability 仅 type-only 导入，不受影响
- 视觉证据链: 四类硬伤全零（规划者视觉审②PASS）·productErrors=[]（四档 e2e + 四档 targeted）
