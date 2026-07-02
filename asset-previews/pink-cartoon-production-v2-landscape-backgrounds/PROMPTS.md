# ART-06 Landscape Background Prompts

Generated on 2026-07-02 with text-to-image for the v1.1 landscape polish pass.

Style target: continue the existing `pink-cartoon-production-v2` asset pack with polished 2D pastel paper-craft, puffy sticker-like edges, matte candy/velvet texture, strawberry pink, coral, warm cream, soft blue, lavender, and pastel yellow accents. All prompts explicitly exclude text, numbers, readable card ranks, suit symbols, watermarks, casino chips, cash, and betting imagery.

## gameTableBg

- Preview: `game-table-bg-landscape.png` (1844x853)
- Thumbnail: `thumbs/game-table-bg-landscape-thumb.png` (422x195)
- Source copy: `source/game-table-bg-landscape.generated.png`

Prompt:

> Create a wide 2.16:1 landscape mobile game background, target composition 844x390, for a cute single-player Dou Dizhu card game. Style: polished 2D pastel paper-craft, puffy sticker-like edges, matte candy velvet texture, sweet pink cartoon production style, warm cream, strawberry pink, coral, soft blue, lavender, pastel yellow accents. Scene: game table background with a soft green felt card-table surface blended into the pink candy stage, rounded pink curtains and cloud shapes at the edges, decorative fans, ribbons, small flowers and stars around borders. Leave clear functional UI spaces: clean top-left and top-right corners for two opponent avatars, a clean central play area, and a broad clean bottom band for the player's hand cards. No text, no numbers, no readable card ranks, no suit symbols, no watermark, no casino chips, no cash, no betting imagery.

## lobbyBg

- Preview: `lobby-bg-landscape.png` (1846x852)
- Thumbnail: `thumbs/lobby-bg-landscape-thumb.png` (422x195)
- Source copy: `source/lobby-bg-landscape.generated.png`

Prompt:

> Create a wide 2.16:1 landscape mobile game lobby background, target composition 844x390, matching a cute Dou Dizhu card game's existing pink cartoon paper-craft art. Style: polished 2D pastel paper-craft, puffy sticker-like edges, matte candy velvet texture, strawberry pink, coral, warm cream, soft blue, lavender, pastel yellow accents. Scene: whimsical pink stage with rounded curtains, cloud clusters, fans, ribbons, flowers, stars, and soft hanging lights around the outer edges. Keep the center and lower middle very clean and low-contrast so UI panels and buttons can sit on top. Decorative playing-card backs can appear near edges only, with no readable ranks or suits. No text, no numbers, no watermark, no casino chips, no cash, no betting imagery.

## settlementBg

- Preview: `settlement-bg-landscape.png` (1313x1198, RGBA alpha, aspect 1.096:1)
- Thumbnail: `thumbs/settlement-bg-landscape-thumb.png` (422x385)
- Source copy: `source/settlement-bg-landscape.generated.png`

Prompt:

> Create one ornate settlement result panel for a cute single-player Dou Dizhu card game, designed for a bounded landscape UI sprite with approximately 1.1:1 aspect ratio, not a full-screen background. The subject must be isolated on a perfectly flat solid #00ff00 chroma-key background for later background removal. Create a front-facing rounded popup panel frame with a warm cream empty center for result rows, pastel pink ribbon banner at the top with no text, rounded coral-pink border, small flowers, stars, clouds, and playing-card-back decorations near the corners only. Keep the center mostly empty and readable. Style: polished 2D pastel paper-craft, puffy sticker-like edges, matte candy velvet texture, matching the pink cartoon Dou Dizhu asset pack. Composition: centered full panel, generous padding, no cropped sides, no full-screen scene composition. No text, no numbers, no readable card ranks, no suit symbols, no watermark, no casino chips, no cash, no betting imagery, no black background, no black corners.

Postprocess:

```sh
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/remove_chroma_key.py" \
  --input asset-previews/pink-cartoon-production-v2-landscape-backgrounds/source/settlement-bg-landscape.generated.png \
  --out asset-previews/pink-cartoon-production-v2-landscape-backgrounds/settlement-bg-landscape.png \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 18 \
  --opaque-threshold 220 \
  --despill \
  --force
```
