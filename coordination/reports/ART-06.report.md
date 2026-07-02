# ART-06 Report — Landscape Background Previews

## Status

Done for re-review. This task only generates preview assets; it does not import or swap runtime resources.

Review update:

- `gameTableBg` and `lobbyBg` were already visually accepted.
- `settlementBg` was reworked after review feedback: the old 2.16:1 opaque black-backed banner was replaced with a bounded popup panel asset at 1.096:1 aspect ratio, with transparent RGBA outer area for the settlement panel use case.

## Scope

- Added `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/`.
- Added 3 landscape background previews and 3 thumbnails.
- Added prompt documentation in `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/PROMPTS.md`.
- Did not modify `assets/resources/**`.

## Outputs

| Resource key | Preview | Size | Thumbnail | Status |
|---|---|---:|---|---|
| `gameTableBg` | `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/game-table-bg-landscape.png` | 1844x853 | `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/thumbs/game-table-bg-landscape-thumb.png` | Visually accepted |
| `lobbyBg` | `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/lobby-bg-landscape.png` | 1846x852 | `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/thumbs/lobby-bg-landscape-thumb.png` | Visually accepted |
| `settlementBg` | `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/settlement-bg-landscape.png` | 1313x1198 RGBA | `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/thumbs/settlement-bg-landscape-thumb.png` | Ready for settlement re-review |

## Generation

- Method: text-to-image generation with built-in image generation.
- Original generated files were copied from `/Users/admin/.codex/generated_images/019f1e6d-1611-7833-9b14-84ecdda30840/`.
- `settlementBg` rework source: `/Users/admin/.codex/generated_images/019f1e6d-1611-7833-9b14-84ecdda30840/ig_07a31b4c6aa4be53016a4624991e8081979ea3a3aafb0a351e.png`.
- `settlementBg` was generated on a flat chroma-key background and locally postprocessed to RGBA alpha with `remove_chroma_key.py`.
- Prompts are recorded in `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/PROMPTS.md`.
- Source copies are preserved under `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/source/`.

## Validation

- Confirmed `gameTableBg` and `lobbyBg` are landscape and exceed the target 844x390 composition.
- Confirmed reworked `settlementBg` is a bounded panel sprite, not a full-screen 2.16:1 background: 1313x1198, aspect 1.096:1.
- Confirmed `settlementBg` has alpha transparency: alpha range `(0, 255)`, transparent corner `(0, 0, 0, 0)`, visible green-fringe count `0`.
- Confirmed thumbnails: game/lobby 422x195; settlement 422x385 to preserve the panel aspect ratio.
- Confirmed no `assets/resources/**` files were changed.

Commands:

```sh
python3 - <<'PY'
from PIL import Image
from pathlib import Path

for p in [
    Path('asset-previews/pink-cartoon-production-v2-landscape-backgrounds/source/settlement-bg-landscape.generated.png'),
    Path('asset-previews/pink-cartoon-production-v2-landscape-backgrounds/settlement-bg-landscape.png'),
    Path('asset-previews/pink-cartoon-production-v2-landscape-backgrounds/thumbs/settlement-bg-landscape-thumb.png'),
]:
    im = Image.open(p).convert('RGBA')
    alpha = im.getchannel('A')
    greenish = sum(1 for r, g, b, a in im.getdata() if a > 0 and g > max(r, b) + 35 and g > 160)
    print(p, im.size, 'aspect', round(im.width / im.height, 3), 'alpha', alpha.getextrema(), 'corner', im.getpixel((0, 0)), 'greenish', greenish)
PY

git diff --check
npm --prefix test test
npm --prefix test run typecheck
```

Results:

- `git diff --check`: pass.
- `npm --prefix test test`: 134 files / 659 tests passed.
- `npm --prefix test run typecheck`: pass.

## Review Notes

The generated previews intentionally keep UI areas clean:

- `gameTableBg`: top-left/top-right opponent spaces, central green table/play area, and lower hand band.
- `lobbyBg`: low-contrast center for panels/buttons.
- `settlementBg`: bounded cream popup panel for settlement rows, transparent outer area, no black corners, and panel aspect aligned with the runtime settlement sprite.

Next step after user visual approval: ART-IMPORT-06 imports selected images into `assets/resources/art/backgrounds/**` and performs the runtime swap-in.
