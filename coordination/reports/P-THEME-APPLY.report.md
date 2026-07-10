# P-THEME-APPLY Report

- status: in-review
- task: Wire cc layer colors to THEME tokens via `toColor()` in `ui-helpers.ts`

## Files Changed

- `assets/scripts/ui/components/ui-helpers.ts`
- `assets/scripts/ui/components/lobby-scene.ts`
- `assets/scripts/ui/components/game-scene/ui-runtime-helpers.ts`
- `assets/scripts/ui/components/game-scene/tween-helpers.ts`
- `assets/scripts/ui/components/game-scene/top-bar-renderer.ts`
- `assets/scripts/ui/components/game-scene/seats-renderer.ts`
- `assets/scripts/ui/components/game-scene/runtime-feedback.ts`
- `assets/scripts/ui/components/game-scene/result-overlay-renderer.ts`
- `assets/scripts/ui/components/game-scene/play-area-renderer.ts`
- `assets/scripts/ui/components/game-scene/pause-overlay-renderer.ts`
- `assets/scripts/ui/components/game-scene/hud-renderer.ts`
- `assets/scripts/ui/components/game-scene/bid-actions-renderer.ts`
- `assets/scripts/ui/components/game-scene/card-node.ts`

## Residual `new Color` grep (`assets/scripts/ui/components`)

```text
assets/scripts/ui/components/game-scene/card-node.ts
  ? new Color(204, 65, 92, 255)
  : new Color(54, 55, 66, 255)

assets/scripts/ui/components/ui-helpers.ts
  return new Color(token.r, token.g, token.b, alpha ?? token.a)
```

## Visual Self-Review (placeholder)

| Scenario | Expected | Result | Notes |
|---|---|---|---|
| Lobby 首页 | 品牌/正文/弱化文本颜色均来自 THEME | TODO |  |
| 对局 HUD | 面板、提示、计时条统一主题色 | TODO |  |
| 结算弹层 | 面板/标题/分数区主题化 | TODO |  |
| 暂停菜单 | 标题与弱化文案主题化 | TODO |  |
| 出牌/叫分建议 | 建议条与状态条主题化 | TODO |  |
