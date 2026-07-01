# Pink Cartoon Production Preview v2 - Misc

Output is intentionally kept under `asset-previews/` and is not imported into Cocos `assets/`.

## Shared Art Direction

- Follows `backgrounds/PROMPTS.md` Shared Art Direction.
- Sweet cartoon pink, warm cream, coral pink, soft blue, lavender, and pastel yellow accents.
- No readable text, letters, numbers, rank marks, suit marks, logo, watermark, casino objects, coins, chips, cash, or metallic treasure imagery.

## Splash

Built-in `image_gen` source:

`/Users/admin/.codex/generated_images/019f1729-473e-7943-9830-d3ba7270eb12/ig_0ac0b57f3e95ea33016a44b9e212f48190996ad8133740224c.png`

Prompt:

```text
Use case: stylized-concept
Asset type: full-screen splash background for a casual offline Dou Dizhu mobile game preview pack
Primary request: Create a portrait mobile splash screen background. No text in the image.
Scene/backdrop: sweet cartoon pink welcome scene with soft clouds, flowers, stars, ribbons, paper fan accents, and a gentle card-table/lobby feeling, but no readable card ranks or suit marks.
Subject: full-bleed vertical background, central area intentionally clean for a title rendered later in Cocos, decorative top and bottom, cheerful but relaxed.
Style/medium: polished 2D mobile game splash art, cute puffy sticker-like cartoon, soft rounded outlines, matte paper craft feeling.
Composition/framing: portrait 9:19.5, full-screen, decorative frame edges, clean central vertical lane, no UI text.
Lighting/mood: gentle, cozy, relaxed, strongly casual, not competitive.
Color palette: warm cream, strawberry pink, coral pink, soft blue, lavender, small pastel yellow accents.
Constraints: no text, no letters, no numbers, no card rank symbols, no readable suit marks, no logo, no watermark, no casino mood, no betting mood, no coins, no chips, no cash, no ingots, no metallic treasure imagery.
```

Post-processing:

- Copied source into `misc/source/splash-source.png`.
- Center cover-cropped and resized to `1080x2340`.
- Saved final as opaque `misc/splash.png`.

## App Icon

Built-in `image_gen` source:

`/Users/admin/.codex/generated_images/019f1729-473e-7943-9830-d3ba7270eb12/ig_0ac0b57f3e95ea33016a44ba28b41081908d57b11939851919.png`

Prompt:

```text
Use case: stylized-concept
Asset type: square app icon for a casual offline Dou Dizhu mobile game preview pack
Primary request: Create a square mobile app icon image. No text in the image.
Subject: cute pink cartoon app icon featuring a soft paper fan, small flower, cloud, and a simple rounded playing-card silhouette without ranks or suit marks; cheerful casual card-game feeling.
Style/medium: polished 2D mobile game icon, puffy sticker-like cartoon, soft rounded outlines, matte paper and candy-like surfaces.
Composition/framing: centered emblem, square composition, generous rounded-icon safe area, strong silhouette readable at small sizes, no text.
Lighting/mood: gentle, playful, relaxed, not casino-like.
Color palette: strawberry pink, coral pink, warm cream, soft blue, lavender, pastel yellow accents.
Constraints: no text, no letters, no numbers, no card rank symbols, no readable suit marks, no logo, no watermark, no casino mood, no betting mood, no coins, no chips, no cash, no ingots, no metallic treasure imagery. Avoid dark outlines and clutter.
```

Post-processing:

- Copied source into `misc/source/app-icon-source.png`.
- Removed only the connected black outer background from the generated icon source.
- Centered the icon on an opaque pastel pink square safe-area plate.
- Saved final as opaque `misc/app-icon.png` at `1024x1024`.

## Empty Records

Built-in `image_gen` source:

`/Users/admin/.codex/generated_images/019f1729-473e-7943-9830-d3ba7270eb12/ig_0ac0b57f3e95ea33016a44ba560f94819087d25415182e0c45.png`

Prompt:

```text
Use case: stylized-concept
Asset type: transparent empty-state illustration for records screen in a casual offline Dou Dizhu mobile game
Primary request: Create a cute empty-records illustration with no text.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background only, one uniform color with no shadow, gradient, floor, texture, or lighting variation. Do not use #00ff00 anywhere in the subject.
Subject: small friendly blank notebook or soft cloud tray with a paper fan, flowers, and stars, communicating 'no records yet' without words; no readable card ranks or suit marks.
Style/medium: polished 2D mobile game sticker, sweet pink cartoon, soft rounded outlines, puffy matte paper shapes.
Composition/framing: centered single sticker-like object, generous padding, clear silhouette at 160px, no text.
Color palette: warm cream, strawberry pink, coral pink, soft blue, lavender, pastel yellow accents.
Constraints: no text, no letters, no numbers, no card rank symbols, no readable suit marks, no logo, no watermark, no casino mood, no betting mood, no coins, no chips, no cash, no ingots, no cast shadow, no contact shadow. Keep the subject fully separated from the green background with crisp edges.
```

Post-processing:

- Copied source into `misc/source/empty-records-source.png`.
- Removed chroma-key with `$CODEX_HOME/skills/.system/imagegen/scripts/remove_chroma_key.py`.
- Cropped visible alpha bounds, fit inside `512x512`, and centered on a transparent canvas as `misc/empty-records.png`.

## Win / Lose Badges

Built-in `image_gen` sources:

- `badge-win-source.png`: `/Users/admin/.codex/generated_images/019f1729-473e-7943-9830-d3ba7270eb12/ig_0ac0b57f3e95ea33016a44ba75c5588190a75f472e4cebec35.png`
- `badge-lose-source.png`: `/Users/admin/.codex/generated_images/019f1729-473e-7943-9830-d3ba7270eb12/ig_0ac0b57f3e95ea33016a44bac1145c8190b9583bf1347351f1.png`

Post-processing:

- Copied sources into `misc/source/`.
- Removed chroma-key with `$CODEX_HOME/skills/.system/imagegen/scripts/remove_chroma_key.py`.
- Cropped visible alpha bounds, fit inside `512x512`, and centered on transparent canvases.
- Saved finals as `misc/badge-win.png` and `misc/badge-lose.png`.
