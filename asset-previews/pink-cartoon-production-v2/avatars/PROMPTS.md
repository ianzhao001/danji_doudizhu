# Pink Cartoon Production Preview v2 - Avatars

Output is intentionally kept under `asset-previews/` and is not imported into Cocos `assets/`.

## Shared Art Direction

- Follows `backgrounds/PROMPTS.md` Shared Art Direction: sweet cartoon pink, warm cream, strawberry pink, coral pink, soft blue, lavender, small pastel yellow accents.
- Soft rounded outlines, puffy sticker-like shapes, playful but non-casino mood.
- No text, letters, numbers, logo, watermark, casino, coins, chips, cash, ingots, or metallic treasure imagery.

## Generated Avatar Sources

Built-in `image_gen` source files:

- `player-avatar-source.png`: `/Users/admin/.codex/generated_images/019f0f3b-9397-79f1-8a79-ce7df2dda61d/ig_023047d38c331c41016a41605ad1ec8199921588796c80bad3.png`
- `ai-cheerful-avatar-source.png`: `/Users/admin/.codex/generated_images/019f0f3b-9397-79f1-8a79-ce7df2dda61d/ig_0c8b4f812e91051f016a4160d73368819ab7079d798d1b1679.png`
- `ai-calm-avatar-source.png`: `/Users/admin/.codex/generated_images/019f0f3b-9397-79f1-8a79-ce7df2dda61d/ig_0c8b4f812e91051f016a41610f94e0819abdc9d890fae5e1c6.png`

Prompt template used for the three generated avatars:

```text
Use case: stylized-concept
Asset type: transparent PNG source for a <player / cheerful AI / calm AI> avatar sprite in a casual offline Dou Dizhu mobile game preview pack
Primary request: Create one <friendly neutral / cheerful / calm> mascot head-and-shoulders avatar, intended for chroma-key background removal. No text in the image.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background only. The background must be one uniform color with no shadows, gradients, texture, floor plane, or lighting variation. Do not use #00ff00 anywhere in the mascot.
Subject: a single cute mascot face / head-and-shoulders avatar, centered, clear silhouette, readable at 64x64.
Style/medium: polished 2D mobile game asset, sweet cartoon pink casual style, puffy sticker-like shape, soft rounded outlines, matte paper-candy surface.
Composition/framing: one avatar only, fully visible, centered, generous padding, no frame, no extra characters.
Lighting/mood: gentle, friendly, relaxed, strongly casual, not competitive.
Color palette: warm cream, strawberry pink, coral pink, soft blue, lavender, small pastel yellow accents.
Constraints: no text, no letters, no numbers, no logo, no watermark, no casino mood, no betting mood, no coins, no chips, no cash, no ingots, no metallic treasure imagery, no cast shadow, no contact shadow.
```

Post-processing:

- Copied each source into `avatars/source/`.
- Removed the `#00ff00` chroma-key background locally.
- Cropped visible alpha bounds, fit to `256x256`, and kept transparent padding.

## Deterministic Badge / Frame Sources

The following simpler overlay sprites were generated locally with Python and Pillow to keep them crisp at small sizes:

- `landlord-role-badge.png` / `farmer-role-badge.png`: `128x128`, transparent badge icons.
- `avatar-frame.png`: `256x256`, transparent circular frame.

For each file, the source copy in `avatars/source/` is the same sprite rendered over a flat `#00ff00` chroma-key background.

