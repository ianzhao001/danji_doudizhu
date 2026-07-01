# M6-D1 release card/runtime hotfix report

## Context

User-run release artifact showed the game table and HUD, but player cards rendered as tiny text-like marks instead of normal card faces and art-backed sprites.

## Fixes

- Rebuilt runtime card rendering in `game-scene-skeleton.ts`:
  - normal cards now compose a card base, `card-template`, corner rank/suit, center rank, and suit icon;
  - jokers keep the joker/card-template path and corner label;
  - hand row is lifted so card faces are visible at 390x844;
  - stale `hand-title` no longer overlaps the rendered hand.
- Fixed Cocos web-mobile rule-module transform fallout:
  - replaced Map iterator spread in `rules/pattern.ts` and `rules/moves.ts` with `Array.from(...)`;
  - verified built `recognize([{ rank: 4, suit: 'C' }])` returns `mainRank: 4` and built `enumerateMoves([4C]).length === 1`.
- Added `build-templates/web-mobile/index.js.ejs`:
  - imports the runtime scene components before `game.run()`;
  - sanitizes generated scene JSON null component slots before deserialization;
  - attaches `LobbyScene` / `GameSceneSkeleton` after scene launch when the CLI build has dropped the serialized component slot.

## Build / smoke evidence

- Cocos Creator 3.8.8 web-mobile rebuild completed and emitted `build/web-mobile`.
- CLI process still exits `36` because the builder metrics pass sees the same source scene missing-class/null-component condition, but the generated web artifact is smoke-tested clean after the template sanitizer.
- CDP 390x844 smoke:
  - lobby loads with `sceneName: "lobby"`;
  - game reaches `phase: "playing"`;
  - `termination: null`;
  - generated hand nodes: `cardNodes: 17`, `cardFill: 18`, `cardBg: 18`, `faceRanks: 18`, `suitIcons: 18`;
  - `consoleEvents: []`;
  - `exceptionEvents: []`;
  - screenshot: `/tmp/doudizhu-card-hotfix-final-390x844.png`.

## Validation

- `npm --prefix test test` -> 133 files / 653 tests passed.
- `npm --prefix test run typecheck` -> passed.
- `git diff --check` -> clean.
- pure-layer `cc` grep across `rules/game/ai/flow/data` -> clean.

