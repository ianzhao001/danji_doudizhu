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
