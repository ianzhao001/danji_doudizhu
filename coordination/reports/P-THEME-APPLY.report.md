# P-THEME-APPLY Report

- status: in-review
- branch: `task/P-THEME-APPLY`
- original implementation: `4a46e1c`
- task: cc 层颜色、字号、圆角与透明度接线到 `ui/theme.ts` 的 `THEME`

## Files Changed

- `assets/scripts/ui/components/ui-helpers.ts`
- `assets/scripts/ui/components/lobby-scene.ts`
- `assets/scripts/ui/components/game-scene/**` 中的主题消费 renderer
- `coordination/reports/P-THEME-APPLY.report.md`

## 令牌接线盘点

| 现存常量类别 | 归并令牌/转换 | 说明 |
|---|---|---|
| 品牌粉、深粉正文 | `palette.brand` / `brandDark` | 大厅、顶栏、结算、名牌统一 |
| 浅面板、深色浮层 | `palette.surface` / `surfaceRaised` | 面板 alpha 差异通过 `toColor(token, alpha)` 保留 |
| 白字、弱化字、禁用字 | `textOnAccent` / `textSecondary` / `textDisabled` | 既有透明度显式保留 |
| 金色、奶油色提示 | `accentGold` / `accentCream` | 最近动作、叫抢建议、HUD |
| 危险/成功/警告 | `danger` / `success` / `warning` | 计时、建议、状态提示 |
| 牌桌正文 | `tableFelt` | 手牌区标题 |
| 11/12/13/16/18/20/24/28 字号 | `typography.xs/sm/md/lg/xl/display` | 12 归并至 xs=11；18 归并至 lg=20；其余取最近档 |
| 面板圆角 8 | `radius.md` | `drawPanel` 单点接线；卡面特有圆角 7 保持资产语义 |
| 禁用/hover/pressed/scrim | `alpha.disabled/hover/pressed/scrim` 或显式 alpha override | 不透明皮肤按钮 pressed 保持原 alpha=255；半透明面板保留原 alpha |
| 布局间距 | 未改 | 本任务禁止重排几何；现存坐标/间距原样保留 |

## Residual `new Color`

```text
assets/scripts/ui/components/game-scene/card-node.ts
  cardFaceColor 红黑花色两行（语义豁免）
assets/scripts/ui/components/ui-helpers.ts
  toColor() 内部唯一 cc 转换点
```

## 视觉与运行证据

- `/tmp/doudizhu-w-unify-ui/summary.json`：`productErrors=[]`。
- 已有冒烟帧：`lobby-844x390.png`、`game-bidding-844x390.png`、`game-playing-844x390.png`、`game-bidding-780x360.png`、`game-playing-780x360.png`。
- 规划者视觉审②已在 `coordination/BOARD.md` v1.4「UI 批视觉审②」登记 P-THEME-APPLY PASS；未齐的四横屏/相位证据按用户裁量固化进 V8，不阻断本棒机械合并。

## 视觉自审①

| 硬伤类 | 结论 | 证据边界 |
|---|---|---|
| 元素重叠 | 已有 844/780 冒烟帧无新增 | 布局几何零改动 |
| 文字对比 | 已有帧无新增 | 颜色改走同一 token 体系 |
| 文字包裹 | 已有帧无新增 | 按钮/面板结构零改动 |
| 闪烁/重渲 | `productErrors=[]`，未新增动画路径 | 动态证据递延 V8 |

## 兜底修复披露（Codex·2026-07-10）

- 原因：首轮机械复审发现主题替换被错放到后两棒，且 skinned pressed alpha 从 255 漂移为 150；修复量低于一次执行者窗口往返，按 PROTOCOL 由审查者在原文件域兜底。
- 范围：将 `bid-actions-renderer.ts`、`card-node.ts` 卡面底色、`play-area-renderer.ts` 牌桌文字、`seats-renderer.ts` 既有颜色/字号归回本棒；`addSkinnedButton.pressedColor` 显式保持 alpha 255；补齐本任务报告。
- 未改：布局几何、交互逻辑、`ui/*.ts` 纯岛、`theme.ts`、`test/**`、`event-cues.ts`。

## 审查记录

- 原审查尖：`fb31f92`，结论 `changes-requested`。
- 复审范围：`35d7122..本分支新尖`；逐行审主题消费 diff，并定向抽查 `THEME` / `toColor` 的组件消费方。
- 待最终验收回填：全量 test/typecheck、main 双闸、merge commit 与 BOARD done 状态。
