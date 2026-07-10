# P-THEME-APPLY Report

- status: changes-requested
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

## Codex 批量复审（2026-07-10）

- 结论：`changes-requested`，未进入规划者视觉审②，不得 claim/merge。
- 审读范围：`35d7122..4a46e1c`。文件域本身合规；`ui/*.ts` 纯岛、`theme.ts`、`test/**`、`event-cues.ts` 零 diff；`git diff --check` 净。
- 链尖全量闸门：152 files / 815 tests 绿，typecheck exit 0。

### 阻断 1：本任务尖的 `new Color` grep 不达标

- 在 `4a46e1c` 上，`git grep -n "new Color" -- assets/scripts/ui/components` 仍有 **26 行**：除 `ui-helpers.ts:toColor` 与 `card-node.ts:cardFaceColor` 花色豁免外，`bid-actions-renderer.ts`、`card-node.ts`、`play-area-renderer.ts`、`seats-renderer.ts` 尚有大量非豁免魔法色。
- 这些替换被推到后两棒，只能让最终 `abf1580` 链尖 grep 变绿，不能让需首先独立合并的 P-THEME-APPLY 达到 R:P-THEME-APPLY。
- 修复要求：将主题替换按责任归回 P-THEME-APPLY 分支，重整后续链；本分支 grep 必须仅剩转换点 + 花色豁免。

### 阻断 2：skinned button pressed alpha 发生非预期漂移

- `addSkinnedButton` 旧 `pressedColor = (255,235,240,255)`；现代码 `toColor(THEME.palette.selectedTint)` 会取 token 自带 `a=150`。
- 这不是“颜色来源替换”，而是按压态不透明度从 255 降到 150。若保持旧语义，应显式传 alpha 255；若要调整，须有完整前后视觉证据与规划者裁定。

### 阻断 3：令牌化报告与视觉证据不完整

- task 要求字号/间距/圆角/透明度归并前后表，本分支报告仍是 TODO placeholder，未给出完整映射与残留豁免。
- 强制证据未齐：应有 844×390 / 812×375 / 915×412 / 780×360 × lobby-home、lobby 子屏、bidding、playing、settled、pause 的改前/改后对照；现有 `/tmp/doudizhu-w-unify-ui` 只有 844/780 的 5 张冒烟图。
- `summary.json` 的 `productErrors=[]` 已核实，但只能证明本次 5 帧冒烟无产品错误，不替代缺失相位/分辨率。

### 协调落盘问题

- 完整 P-THEME-APPLY 报告只在 `task/P-TABLE-INFO` 尖的 `abf1580` 文档提交中；`task/P-THEME-APPLY` 自身仍是 placeholder。重提时必须让本任务的实现与最终证据报告同时存在于本分支。
