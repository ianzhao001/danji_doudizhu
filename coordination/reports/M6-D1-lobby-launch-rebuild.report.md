# M6-D1 Lobby Launch Rebuild Report

Date: 2026-07-01

## Scope

- Closed the release-packaging gate from M6-D1 review: release build now starts from `lobby.scene` instead of `game.scene`.
- Added runtime navigation from the existing lobby entry labels (`开始新局` / `新对局`) to `game.scene`.
- No `.scene`, `.meta`, root config, package, or build artifact files were committed.

## Code Change

- `assets/scripts/ui/components/lobby-scene.ts`
  - `onLoad()` wires the existing `continueLabel` and `start-label` nodes.
  - Touching either label calls `globalThis.cc?.director?.loadScene('game')`.
  - No new visible lobby button is rendered, so the M3-65 home-density layout stays unchanged.

## Build

Command:

```bash
env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator \
  --project /Users/admin/Documents/Cocos/斗地主 \
  --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"
```

Result:

- Creator log: `build Task (web-mobile) Finished in (3 s)`.
- Build output: `build/web-mobile/` = 47M / 202 files.
- `build/web-mobile/src/settings.json`:
  - `CocosEngine`: `3.8.8`
  - `engine.platform`: `web-mobile`
  - `engine.debug`: `false`
  - `launch.launchScene`: `db://assets/scene/lobby.scene`
  - `screen.designResolution`: `390x844`

## Web Mobile Smoke

Local server: `http://127.0.0.1:7461/index.html`.

CDP summary:

- `/tmp/doudizhu-d1-lobby-launch-smoke/summary.json`

Screenshots:

- `/tmp/doudizhu-d1-lobby-launch-smoke/lobby-390x844.png`
- `/tmp/doudizhu-d1-lobby-launch-smoke/lobby-412x915.png`
- `/tmp/doudizhu-d1-lobby-launch-smoke/lobby-360x780.png`
- `/tmp/doudizhu-d1-lobby-launch-smoke/lobby-390x844-after-new-game.png`
- `/tmp/doudizhu-d1-lobby-launch-smoke/lobby-390x844-pause.png`
- `/tmp/doudizhu-d1-lobby-launch-smoke/lobby-390x844-pause-confirm.png`
- `/tmp/doudizhu-d1-lobby-launch-smoke/lobby-390x844-back-lobby.png`

Verified:

- 390x844 / 412x915 / 360x780 all load `sceneName: "lobby"`.
- Three viewports all have `errorEvents: []`.
- 390x844 flow: lobby -> tap existing `新对局` label -> `game.scene` -> pause -> quit confirmation -> lobby.
- Final visual pass: lobby home has no added button overlap; existing settings/difficulty/entry layout remains readable.

Note: headless Chrome required SwiftShader WebGL flags (`--use-angle=swiftshader --enable-unsafe-swiftshader`). A first no-GL diagnostic run failed before scene load with Cocos WebGL context errors; the final SwiftShader run is the recorded pass.

## Validation

```bash
npm --prefix test test
npm --prefix test run typecheck
git diff --check
rg -n "from ['\"]cc['\"]|from ['\"]cc/" assets/scripts/rules assets/scripts/game assets/scripts/ai assets/scripts/flow assets/scripts/data || true
```

Results:

- `npm --prefix test test`: 133 files / 653 tests passed.
- `npm --prefix test run typecheck`: passed.
- `git diff --check`: clean.
- Pure layers `rules/game/ai/flow/data`: no `cc` imports.
