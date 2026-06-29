# Pink Cartoon Production Preview v2 - Cards

Output is intentionally kept under `asset-previews/` and is not imported into Cocos `assets/`.

## Shared Art Direction

- Follows `backgrounds/PROMPTS.md` Shared Art Direction.
- No readable text, letters, numbers, rank marks, suit marks, logo, watermark, casino objects, coins, chips, cash, or metallic treasure imagery.

## Card Back

Built-in `image_gen` source:

`/Users/admin/.codex/generated_images/019f0f3b-9397-79f1-8a79-ce7df2dda61d/ig_0c8b4f812e91051f016a41614bcadc819a87653e60c0a2b1e4.png`

Prompt:

```text
Use case: stylized-concept
Asset type: opaque card-back texture for a casual offline Dou Dizhu mobile game preview pack
Primary request: Create one vertical 2.5:3.5 playing card back design. No text in the image.
Subject: rounded card-back with sweet pink cartoon pattern, small flowers, stars, clouds, paper fan accents, soft card-game motifs, low visual noise.
Style/medium: polished 2D mobile game asset, cute puffy sticker-like cartoon, soft rounded outlines, matte paper surface.
Composition/framing: single full card-back centered, 2.5:3.5 ratio, border visible, tile-like inner pattern, no text.
Color palette: warm cream, strawberry pink, coral pink, soft blue, lavender, small pastel yellow accents.
Constraints: no text, no letters, no numbers, no card rank symbols, no readable suit marks, no logo, no watermark, no casino mood, no betting mood, no coins, no chips, no cash, no ingots.
```

Post-processing:

- Copied source into `cards/source/card-back-source.png`.
- Center cover-cropped and resized to `400x560`.
- Saved final as opaque `cards/card-back.png`.

## Jokers

Reused v1 built-in `image_gen` sources because they already match the accepted style and constraints:

- `joker-small-source.png`: `/Users/admin/.codex/generated_images/019ef899-db99-7083-9e7e-c53b5190cf85/ig_010fa586dafafb21016a3cd04480a8819897f582ef71b7b2f8.png`
- `joker-big-source.png`: `/Users/admin/.codex/generated_images/019ef899-db99-7083-9e7e-c53b5190cf85/ig_010fa586dafafb21016a3cd0839cec8198b8f1cacca70963bb.png`

Post-processing:

- Removed `#00ff00` chroma-key background locally.
- Cropped visible alpha bounds, fit to `400x560`, and kept transparent outside edges.

## Deterministic Card Template

`card-template.png` was generated locally with Python and Pillow:

- `400x560`, transparent outside the rounded card.
- Cream card face, pink fine border, blank corner-label zones, and blank center area.
- No point values, letters, numbers, rank marks, or suit marks.
- `cards/source/card-template-source.png` is the same sprite over a flat `#00ff00` background.

