# P-GS-SPLIT2 Report

## Status

- Result: complete; continuing in the same batch to `P-BID-POLISH` before planner visual review handoff.
- Branch/worktree: `task/P-GS-SPLIT2` at `/Users/admin/Documents/Cocos/斗地主.worktrees/P-GS-SPLIT2`.
- Scope discipline: no test edits, no `strings.ts` edits, no behavior/coordinate/copy changes intended.

## Split Summary

- `assets/scripts/ui/components/game-scene-skeleton.ts`: 1775 lines -> 759 lines.
- Added extracted modules:
  - `game-scene/card-node.ts`: card node creation, card skin/suit helpers, press state.
  - `game-scene/play-area-renderer.ts`: bottom cards, play area, hand layout, deal animation lock.
  - `game-scene/pause-overlay-renderer.ts`: pause control, pause menu, quit confirm, resume/restart hooks.
  - `game-scene/top-bar-renderer.ts`: top bar, runtime settings, placeholder background, landscape check.
  - `game-scene/audio-vibration.ts`: cue/effect playback, emphasis render, runtime setting toggles, vibration.
  - `game-scene/tween-helpers.ts`: deal/play/scale/toast/dim overlay animation helpers.
  - `game-scene/runtime-feedback.ts`: toasts, termination feedback, turn timer key, AI-thinking view, seed resolution.
  - `game-scene/ui-runtime-helpers.ts`: shared skinned button/sprite/label/panel helpers, render diff pruning, geometry helpers.
- Cocos Creator generated matching `.ts.meta` files for the new script modules during build.

## Mechanical Evidence

- `git diff --cached --stat`: 17 files, 1587 insertions, 1203 deletions.
- `git diff --cached --color-moved=zebra ...`: skeleton bodies are replaced by `*Impl` delegates; extracted modules contain the moved `export function ...` bodies.
- `git diff --check`: pass.
- `wc -l`: `game-scene-skeleton.ts` is 759 lines.

## Invariants Checked

- Resume rebuild preserved: `rebuildRecentEvents(this.fullGameEvents)` remains in `startGame`.
- Live top bar state preserved: render still passes `vm.topBar` to `renderTopBar`.
- Termination feedback preserved: `update()` still calls `pollTerminationFeedback`; polling logic moved to `runtime-feedback.ts`.
- Pause/resume semantics preserved: `openPauseMenu` still calls `runtime.pause()`, `closePauseMenu` still calls `runtime.resume()`, restart still routes through `startGame(true)`.
- C-wave transient HUD pruning preserved for SPLIT2: `SETTLEMENT_TRANSIENT_HUD_NODE_NAMES` moved unchanged to `ui-runtime-helpers.ts`; dead `last-action-*` entries are intentionally left for `P-BID-POLISH`.
- T-UIHELPERS consumption preserved: new runtime helper module calls `addSkinnedButton`, `addSkinnedSprite`, `drawPanelSkin`, and shared `t(...)` strings; no new local `Button` wiring was introduced.

## Visual Evidence

- Before baseline: `/tmp/doudizhu-p-gs-split2-before/summary.json`.
- After run: `/tmp/doudizhu-p-gs-split2-after/summary.json`.
- Viewports: `844x390`, `812x375`, `915x412`, `780x360`.
- Captures: 11 per viewport before and after.
- After summary: all four viewports reached settled round 1 and settled round 2; `aiPlayCaptured=true`, `playerPlayCaptured=true`, `productErrors=[]`.
- Pixel diff: 44 before/after PNG pairs, missing=0, diffCount=0.

## Verification

- Cocos Creator 3.8.8 web-mobile build: pass (`build Task (web-mobile) Finished`; command exits with Creator's known `36` status).
- `npm --prefix test test`: pass, 149 files / 768 tests.
- `npm --prefix test run typecheck`: pass.
