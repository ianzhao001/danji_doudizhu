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
