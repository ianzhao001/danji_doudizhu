# M6-D1 resource runtime audit / card rendering fix

## Scope

- Fix target: Web Mobile release runtime did not render card faces / image resources correctly.
- Code changed:
  - `assets/scripts/ui/asset-keys.ts`
  - `assets/scripts/ui/components/game-scene-skeleton.ts`
  - `assets/scripts/ui/components/lobby-scene.ts`
  - `test/ui/asset-keys.test.ts`
- No `.scene`, `.prefab`, `.meta`, root config, or build artifact was committed.

## Root Cause

Cocos Creator 3.8.8 registers imported PNG SpriteFrame sub-assets under:

`<resource-path>/spriteFrame`

The previous UI loaders called:

`resources.load(<resource-path>, SpriteFrame, ...)`

In the Web Mobile build, that path addresses the PNG main asset / texture entry, not the SpriteFrame sub-asset. Runtime loads therefore missed the intended SpriteFrame entries, causing card faces and other images to fall back to text / placeholder presentation.

## Fix

- Added `spriteFrameResourcePath(path)` in `asset-keys.ts`.
- Updated the lobby and game runtime Sprite loaders to call:

`resources.load(spriteFrameResourcePath(path), SpriteFrame, ...)`

- Kept `RESOURCE_PATHS` as extensionless base resource paths so the existing asset-key contract remains stable.
- Added a unit test that locks the SpriteFrame sub-asset path convention.

## Static Resource Audit

Command summary:

- `assets/resources` resource files: 57
- PNG: 45
- WAV: 9
- OTF: 2
- TXT license: 1
- Missing `.meta`: 0
- Duplicate base UUID: 0
- PNG SpriteFrame metas: 43
- PNG texture metas: 2 (`app-icon`, `splash`)
- AudioClip metas: 9
- OTF generic asset metas: 2
- Text metas: 1

`RESOURCE_PATHS` maps all 56 binary runtime resources. The font license text is present and validated separately as `TextAsset`.

## Build / Runtime Audit

Rebuilt Web Mobile with Cocos Creator 3.8.8:

```bash
env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator \
  --project /Users/admin/Documents/Cocos/斗地主 \
  --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;startScene=dc62324b-10d4-4870-9518-1a34ce682067"
```

Notes:

- CLI returned the known Creator metrics exit code `36`, but generated `build/web-mobile`.
- `build/web-mobile/src/settings.json`:
  - `CocosEngine = 3.8.8`
  - `engine.platform = web-mobile`
  - `launch.launchScene = db://assets/scene/lobby.scene`
- Build output: 202 files / 47M.

Clean Chrome CDP audit (`390x844`, fresh profile, cleared storage):

- Console error/warning events: 0
- Runtime exceptions: 0
- Resource load audit: 56 / 56 passed
  - SpriteFrame: 43
  - Texture2D: 2
  - AudioClip: 9
  - Asset fonts: 2
- Font native URLs resolved:
  - `fontRegular` -> `assets/resources/native/dd/dd73f480-5323-45b3-9a18-0978a1603188.otf`
  - `fontHeavy` -> `assets/resources/native/9d/9d10f420-074c-462b-b311-a8874df979cb.otf`
- License text loaded as `TextAsset`.

End-to-end visual smoke:

- Lobby screenshot: `/tmp/doudizhu-resource-clean-lobby.png`
- Playing hand screenshot: `/tmp/doudizhu-resource-clean-playing.png`
- Flow: lobby -> game -> call landlord -> pass grab -> playing.
- Playing probe:
  - scene: `game`
  - phase: `playing`
  - viewer hand: 17
  - sprite count: 41
  - sprites with frame: 41
  - sprites without frame: 0
  - suit sprites: 17

## Validation

```bash
npm --prefix test test
npm --prefix test run typecheck
git diff --check
rg -n "from 'cc'|from \"cc\"|require\\(['\\\"]cc['\\\"]\\)" assets/scripts/rules assets/scripts/game assets/scripts/ai assets/scripts/flow assets/scripts/data test || true
```

Results:

- `npm --prefix test test`: 133 files / 654 tests passed.
- `npm --prefix test run typecheck`: passed.
- `git diff --check`: clean.
- Pure layers + tests `cc` grep: clean.
