# ART-06 Report — Landscape Background Previews

## Status

Done for review. This task only generates preview assets; it does not import or swap runtime resources.

## Scope

- Added `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/`.
- Added 3 landscape background previews and 3 thumbnails.
- Added prompt documentation in `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/PROMPTS.md`.
- Did not modify `assets/resources/**`.

## Outputs

| Resource key | Preview | Size | Thumbnail | Status |
|---|---|---:|---|---|
| `gameTableBg` | `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/game-table-bg-landscape.png` | 1844x853 | `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/thumbs/game-table-bg-landscape-thumb.png` | Pending user visual review |
| `lobbyBg` | `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/lobby-bg-landscape.png` | 1846x852 | `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/thumbs/lobby-bg-landscape-thumb.png` | Pending user visual review |
| `settlementBg` | `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/settlement-bg-landscape.png` | 1844x853 | `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/thumbs/settlement-bg-landscape-thumb.png` | Pending user visual review |

## Generation

- Method: text-to-image generation with built-in image generation.
- Original generated files were copied from `/Users/admin/.codex/generated_images/019f1e6d-1611-7833-9b14-84ecdda30840/`.
- Prompts are recorded in `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/PROMPTS.md`.
- Source copies are preserved under `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/source/`.

## Validation

- Confirmed all 3 preview images are landscape and exceed the target 844x390 composition.
- Confirmed thumbnails are 422x195.
- Confirmed no `assets/resources/**` files were changed.

Commands:

```sh
for f in asset-previews/pink-cartoon-production-v2-landscape-backgrounds/*.png \
  asset-previews/pink-cartoon-production-v2-landscape-backgrounds/thumbs/*.png; do
  sips -g pixelWidth -g pixelHeight "$f"
done
```

## Review Notes

The generated previews intentionally keep UI areas clean:

- `gameTableBg`: top-left/top-right opponent spaces, central green table/play area, and lower hand band.
- `lobbyBg`: low-contrast center for panels/buttons.
- `settlementBg`: wide cream panel area for settlement rows.

Next step after user visual approval: ART-IMPORT-06 imports selected images into `assets/resources/art/backgrounds/**` and performs the runtime swap-in.
