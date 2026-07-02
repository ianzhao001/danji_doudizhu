# ART-IMPORT-06 Report — Landscape Background Import + Swap-In

## Status

Done for review.

## Scope

- Imported the 3 approved ART-06 landscape backgrounds by overwriting the existing resource keys:
  - `assets/resources/art/backgrounds/game-table-bg.png`
  - `assets/resources/art/backgrounds/lobby-bg.png`
  - `assets/resources/art/backgrounds/settlement-bg.png`
- Re-imported with Cocos Creator 3.8.8 CLI build flow so the existing `.png.meta` files were updated by Creator.
- Swapped runtime placeholder backgrounds back to real `loadSprite(...)` backgrounds:
  - `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `assets/scripts/ui/components/lobby-scene.ts`
- Did not modify `assets/scripts/ui/asset-keys.ts`.

## Import / Meta Evidence

| Asset | PNG size | Meta UUID | SpriteFrame | Alpha |
|---|---:|---|---:|---|
| `game-table-bg.png` | 1844x853 | `9a4dda78-3bee-413a-b79c-2a2eb0c45d45` | 1844x853 | `hasAlpha:false` |
| `lobby-bg.png` | 1846x852 | `f59295ac-8d95-4a75-80e1-697d5d6b2c6e` | 1846x852 | `hasAlpha:false` |
| `settlement-bg.png` | 1313x1198 | `6bfee5c5-a625-4578-b7a5-77b2ff0dc3e7` | raw 1313x1198, trimmed 1249x1119 | `hasAlpha:true` |

Creator build command used for reimport/build:

```sh
env -u ELECTRON_RUN_AS_NODE "/Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator" \
  --project "/Users/admin/Documents/Cocos/斗地主.worktrees/ART-IMPORT-06" \
  --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"
```

Note: the Cocos CLI exits with code `36` in this environment after metrics shutdown, but the log ends with `build Task(web-mobile) Finished in (4 s)`.

## Runtime Changes

- `game-scene-skeleton.ts`
  - `renderPlaceholderBackground` now uses `RESOURCE_PATHS.gameTableBg` through `loadSprite`.
  - Background node keeps the image aspect ratio with cover sizing, avoiding stretch distortion across all landscape viewports.
  - Settlement panel explicitly sets `Sprite.Type.SIMPLE` and `Sprite.SizeMode.CUSTOM` before loading `RESOURCE_PATHS.settlementBg`.
- `lobby-scene.ts`
  - `renderPlaceholderBackground` now uses `RESOURCE_PATHS.lobbyBg` through `loadSprite`.
  - Background node keeps the image aspect ratio with cover sizing.

## Validation

Commands:

```sh
npm --prefix test test
npm --prefix test run typecheck
git diff --check
node /tmp/doudizhu-art-import-smoke.mjs build/web-mobile /tmp/doudizhu-v11-visual-gate/ART-IMPORT-06
```

Results:

- `npm --prefix test test`: 134 files / 659 tests passed.
- `npm --prefix test run typecheck`: pass.
- `git diff --check`: pass.
- Cocos Creator 3.8.8 web-mobile build: completed; `build/web-mobile/src/settings.json` launches `db://assets/scene/lobby.scene`.
- CDP smoke: 4 landscape viewports × lobby/game/settlement = 12 screenshots, `productErrors=[]`.
- Settlement screenshot black-edge scan: pure black pixels `0`, near-black pixels `0` for all four settlement screenshots.

CDP summary:

- `/tmp/doudizhu-v11-visual-gate/ART-IMPORT-06/summary.json`

Screenshots:

- 844x390:
  - `/tmp/doudizhu-v11-visual-gate/ART-IMPORT-06/ART-IMPORT-06-844x390-lobby.png`
  - `/tmp/doudizhu-v11-visual-gate/ART-IMPORT-06/ART-IMPORT-06-844x390-game.png`
  - `/tmp/doudizhu-v11-visual-gate/ART-IMPORT-06/ART-IMPORT-06-844x390-settlement.png`
- 812x375:
  - `/tmp/doudizhu-v11-visual-gate/ART-IMPORT-06/ART-IMPORT-06-812x375-lobby.png`
  - `/tmp/doudizhu-v11-visual-gate/ART-IMPORT-06/ART-IMPORT-06-812x375-game.png`
  - `/tmp/doudizhu-v11-visual-gate/ART-IMPORT-06/ART-IMPORT-06-812x375-settlement.png`
- 915x412:
  - `/tmp/doudizhu-v11-visual-gate/ART-IMPORT-06/ART-IMPORT-06-915x412-lobby.png`
  - `/tmp/doudizhu-v11-visual-gate/ART-IMPORT-06/ART-IMPORT-06-915x412-game.png`
  - `/tmp/doudizhu-v11-visual-gate/ART-IMPORT-06/ART-IMPORT-06-915x412-settlement.png`
- 780x360:
  - `/tmp/doudizhu-v11-visual-gate/ART-IMPORT-06/ART-IMPORT-06-780x360-lobby.png`
  - `/tmp/doudizhu-v11-visual-gate/ART-IMPORT-06/ART-IMPORT-06-780x360-game.png`
  - `/tmp/doudizhu-v11-visual-gate/ART-IMPORT-06/ART-IMPORT-06-780x360-settlement.png`

## Review Notes

- The background resources retain their existing resource paths, so `RESOURCE_PATHS.gameTableBg`, `RESOURCE_PATHS.lobbyBg`, and `RESOURCE_PATHS.settlementBg` continue to resolve without asset-key changes.
- `gameTableBg` and `lobbyBg` load as full-screen cover images, with minor overflow instead of aspect-ratio stretching where viewport aspect differs.
- `settlementBg` loads through the existing settlement panel path, now with explicit simple/custom sprite mode and transparent outer area.
