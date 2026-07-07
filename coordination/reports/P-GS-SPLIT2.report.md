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

## Review (Reviewer · GLM-5.2)

- Result: **approved** (0 打回轮次 · 0 域内致命 · 0 域外致命 · 0 拿不准)
- Branch: `task/P-BID-POLISH`（批次合并·SPLIT2 commit `6343846`）
- 基点: main `c4d1156`

### 逐项核销

1. **Move-only 验证**: `git diff --color-moved=zebra c4d1156..6343846` 确认 skeleton 函数体替换为 `*Impl` 委托，8 个新模块含搬移的 `export function` 体；17 文件 +1639/-1203，skeleton 1390 行变更全为删除+委托替换
2. **skeleton 行数**: 768 行 (≤ 800 ✅)
3. **C 波接线原样搬迁**:
   - Resume rebuild: `rebuildRecentEvents(this.fullGameEvents)` skeleton:366 ✅
   - 顶栏 live: `renderTopBar(phase, vm.topBar, handCount, layout, canvas)` skeleton:421 ✅
   - 暂停接线: `openPauseMenu` → `this.runtime?.pause()` / `closePauseMenu` → `this.runtime?.resume()` pause-overlay-renderer:103/109 ✅
   - 终止反馈: `pollTerminationFeedback()` skeleton:286 → runtime-feedback.ts ✅
4. **T-UIHELPERS 共享化消费**: ui-runtime-helpers.ts 从 `../ui-helpers` 导入 `addSkinnedButton`/`addSkinnedSprite`/`drawPanelSkin`；新模块零本地 `new Button` 重实现（hud-renderer.ts:110 `button.transition` 系 C 波存量，SPLIT2 未触）
5. **SETTLEMENT_TRANSIENT_HUD_NODE_NAMES**: 3 个 dead `last-action-0/1/2` 原样搬入 ui-runtime-helpers.ts，未删 ✅
6. **import 方向**: 纯层 (ai/game/rules/flow/data) 零 `cc` 导入 ✅；ui 模块仅依赖同层 + game/rules/ai/flow
7. **strings.ts / asset-keys.ts / lobby-scene.ts**: 零改动 ✅

### 全量回扫

- 覆盖全仓 + 整批 diff（P-GS-SPLIT2 + P-BID-POLISH 合计 25 文件）
- 回扫结果: 0 域内致命 · 0 域外致命 · 0 拿不准
- 视觉证据链: 44 对 PNG diff=0（规划者视觉审②PASS）·productErrors=[]（四档）

## 验收披露

- 合并 commit: `7a1b022`（merge task/P-BID-POLISH·批次合并含 P-GS-SPLIT2 + P-BID-POLISH）
- 最终基线: main `bd45b7f`·149 files / 769 tests 绿·typecheck 净
- 打回轮次: 0
- 全量回扫: 0 域内致命 / 0 域外致命 / 0 拿不准
- 批次合并说明: P-GS-SPLIT2 与 P-BID-POLISH 共享分支 `task/P-BID-POLISH`·SPLIT2 commit `6343846`·merge commit 同为 `7a1b022`·BOARD 两行均置 `done 7a1b022`
