# ART-UIKIT v12 Prompts

## Built-In Image Generation Reference

Mode: built-in `image_gen`

Saved reference:

- `source/uikit-reference.generated.png`

Prompt:

```text
Use case: ui-mockup
Asset type: mobile game UI skin bitmap reference for a pink cartoon Dou Dizhu card game.
Primary request: Create a clean reference sheet showing two exact UI asset concepts: a rounded seat nameplate base and a rounded bottom-cards dock for three cards. Cute polished pink cartoon style, soft candy highlights, subtle cream accents, no text, no characters, no playing-card numbers, no watermark.
Composition: asset sheet on a plain light neutral background, each asset centered with generous padding. Corners must be visually simple and suitable for 9-slice scaling, with no decorative motifs or gradients crossing the outer 24px corner zones. Decorations, if any, stay near the center or inner side areas.
Style: match a cozy pink cartoon mobile card game, glossy but not noisy, soft bevels, clean edges, production-ready UI sprite direction.
```

## Exact-Size Finalization Prompts

The final deliverables below were finalized as deterministic exact-size PNGs from the reference direction so the dimensions, transparent bounds, and 24px 9-slice zones are controlled.

### `seat-nameplate.png`

```text
Create a 320x120 transparent PNG seat nameplate base for a pink cartoon mobile Dou Dizhu table UI. Rounded capsule panel, soft candy pink bevel, pale inner name area, no text, no characters, no card ranks, no watermark. Keep the outer 24px corner zones free of motifs and complex texture. Decorative accents may sit inside the right inner body only, away from the 24px corner borders. The asset must remain readable after 9-slice width scaling.
```

### `bottom-cards-dock.png`

```text
Create a 480x160 transparent PNG bottom-card dock base for three hidden landlord bottom cards. Pink cartoon game UI, rounded capsule panel, inner tray with three simple card wells, no text, no card ranks, no watermark. Keep all decorative content away from the outer 24px corner zones. The dock should remain readable after 9-slice width scaling to 214px and 360px.
```

### `btn-primary.png`

```text
Create a 240x96 transparent PNG primary action button skin for a pink cartoon mobile card game. Rounded pill, candy pink bevel, white soft highlight, no text, no icon, no flowers, no motifs in the stretchable center or outer 24px corner zones. Must scale cleanly as a 9-slice button to 64px and 176px widths.
```

### `btn-secondary.png`

```text
Create a 240x96 transparent PNG secondary action button skin for a pink cartoon mobile card game. Rounded pill, light blue bevel, white soft highlight, no text, no icon, no flowers, no motifs in the stretchable center or outer 24px corner zones. Must scale cleanly as a 9-slice button to 64px and 176px widths.
```

### `btn-disabled.png`

```text
Create a 240x96 transparent PNG disabled action button skin for a pink cartoon mobile card game. Rounded pill, muted gray-lilac bevel, low-contrast highlight, no text, no icon, no flowers, no motifs in the stretchable center or outer 24px corner zones. Must scale cleanly as a 9-slice button to 64px and 176px widths.
```

## Existing Asset Decisions

- Existing `panel-popup.png`: keep. 24px corner samples are fully transparent and 214px/360px 9-slice width simulations do not show corner motif stretching.
- Existing `btn-primary.png`, `btn-secondary.png`, `btn-disabled.png`: preview-only v12 replacements generated. Corner samples are acceptable, but the 64px simulation of the existing button art squeezes side flower decorations into the center; the v12 replacements remove those motifs.

## Deprecated Atlas Registration

These atlas-style files are registered as deprecated for the v12 UI review path. They have no slicing configuration in this task and duplicate single-image assets, so they are not regenerated here.

- `assets/resources/art/avatars/avatar-frame-set.png`
- `assets/resources/art/ui/button-set.png`
- `assets/resources/art/ui/panel-set.png`
- `assets/resources/art/ui/status-badges.png`
- `assets/resources/art/ui/action-icons.png`
