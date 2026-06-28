# Pink Cartoon Production Preview v2 - UI Elements

Output is intentionally kept under `asset-previews/` and is not imported into Cocos `assets/`.

## Shared Art Direction

- Follows `backgrounds/PROMPTS.md` Shared Art Direction: sweet cartoon pink, warm cream, strawberry pink, coral pink, soft blue, lavender, and pastel yellow accents.
- Buttons and badges use soft candy-like rounded surfaces; icons are simple and readable at small sizes.
- No text, letters, numbers, logo, watermark, casino, coins, chips, cash, or metallic treasure imagery.

## Production Method

These UI sprites are deterministic Pillow outputs, because they are small functional UI controls that need exact dimensions, transparent edges, and consistent nine-slice-friendly geometry.

For each asset:

- `ui/source/<name>-source.png` is the sprite rendered over a flat `#00ff00` chroma-key background for source inspection.
- `ui/<name>.png` is the final transparent PNG.

## Asset Notes

- Buttons: `btn-primary.png`, `btn-secondary.png`, `btn-disabled.png` are `240x96`, transparent, rounded, no text, with a quiet center stretch area.
- Action icons: `icon-play.png`, `icon-pass.png`, `icon-hint.png`, `icon-bid.png`, `icon-back.png`, `icon-settings.png` are `96x96`, transparent, readable at 32px.
- Status/effect badges: `badge-multiplier.png`, `badge-turn.png`, `badge-countdown-ring.png`, `emphasis-bomb.png`, `emphasis-rocket.png`, `emphasis-spring.png` are `128x128`, transparent.
- Popup panel: `panel-popup.png` is `900x1100`, transparent outside the rounded panel.

Prompt/design intent used for deterministic drawing:

```text
Use case: stylized-concept
Asset type: transparent PNG UI sprite for a casual offline Dou Dizhu mobile game preview pack
Primary request: Create one clean, text-free, sweet cartoon pink UI sprite with exact transparent edges and game-friendly readability.
Style/medium: polished 2D mobile game UI, puffy sticker-like rounded shapes, matte candy-paper surface.
Color palette: warm cream, strawberry pink, coral pink, soft blue, lavender, small pastel yellow accents.
Constraints: no text, no letters, no numbers, no rank symbols, no readable suit marks, no logo, no watermark, no casino mood, no betting mood, no coins, no chips, no cash, no ingots.
```

