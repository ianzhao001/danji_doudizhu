# T-THEME-TOKENS 实现报告

- 实现方标识：Cursor（执行者）
- 分支：`task/T-THEME-TOKENS`
- 状态：in-review

## 改了哪些文件
- 新 `assets/scripts/ui/theme.ts`（THEME 深冻结主题令牌）
- `assets/scripts/ui/index.ts`（追加一行 `export * from './theme'`）
- 新 `test/ui/theme.test.ts`（覆盖级自写测试）

## 盘点清单（现存色值 → 令牌）
| 原色值（来源） | 令牌 |
|---|---|
| `198,68,124` lobby/result PANEL_ACCENT | `palette.brand` |
| `108,46,76` lobby PANEL_TEXT / BRIGHT_PANEL_TEXT | `palette.brandDark` / `textPrimary` |
| `255,237,246,238` result PANEL_FALLBACK | `palette.surface` |
| `48,40,58,178` hud drawPanel | `palette.surfaceRaised` |
| `0,0,0,218` tween-helpers scrim | `palette.overlayScrim` |
| `142,88,108,235` lobby PANEL_MUTED | `palette.textSecondary` |
| `118,108,114,180` lobby BUTTON_DISABLED_TEXT | `palette.textDisabled` |
| `255,255,255` ui-helpers 白字 | `palette.textOnAccent` |
| `255,244,209` seats last-action 文案 | `palette.accentGold` |
| `255,250,228` hud memory 行 | `palette.accentCream` |
| `176,72,88` lobby PANEL_BAD | `palette.danger` |
| `77,126,88` lobby PANEL_GOOD | `palette.success` |
| `255,210,112` ui-runtime mid tone | `palette.warning` |
| `255,224,232,150` ui-helpers 选中底 | `palette.selectedTint` |
| `74,70,72` play-area TABLE_TEXT | `palette.tableFelt` |
| 按钮四态 α：`24/30/70/100/120/150/170` | `alpha.disabled/hover/pressed` + 各色内联 a |
| 圆角 `8` / `4` ui-helpers、hud | `radius.md` / `radius.sm` |
| 字号 `11/13/16/20/24/28` 横屏 UI 抽样 | `typography.xs→display` |
| 间距 `4/8/12/16/24` 横屏布局抽样 | `spacing.xs→xl` |

- 色彩令牌数：16（≤24）
- 桶导出 diff：`+export * from './theme';`（一行）

## 测试与类型检查输出
```
Test Files  152 passed (152)
Tests       807 passed (807)
npm --prefix test run typecheck → exit 0
```

## 工作树状态
```
仅声明文件域；`.meta` 未手写（待 P-THEME-APPLY 编辑器侧补）
```

## 与 spec 的偏差 / 关键决策
- 增补 `palette.tableFelt`（play-area 桌面色，归并而非新配色方向）。
- 本任务未接线任何 cc 消费方（留 P-THEME-APPLY）。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试
- [x] 未 import cc
