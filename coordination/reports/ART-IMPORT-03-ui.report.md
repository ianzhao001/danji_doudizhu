# ART-IMPORT-03-ui 导入报告

- 实现方标识：Codex
- 分支：`task/art-final-review-assets`
- 状态：in-review
- 用户视觉批准来源：本对话中用户在查看 `/tmp/doudizhu-art-final-review-final/index.html` 后明确回复「视觉通过，继续导入」。

## 改了哪些文件
- 新增 UI sprite 到 `assets/resources/art/ui/`：
  - `btn-primary.png`、`btn-secondary.png`、`btn-disabled.png`
  - `icon-play.png`、`icon-pass.png`、`icon-hint.png`、`icon-bid.png`、`icon-back.png`、`icon-settings.png`
  - `badge-multiplier.png`、`badge-turn.png`、`badge-countdown-ring.png`
  - `emphasis-bomb.png`、`emphasis-rocket.png`、`emphasis-spring.png`
  - `panel-popup.png`
- Cocos Creator 3.8.8 自动生成上述 `.meta`。
- `assets/scripts/ui/asset-keys.ts`：新增对应独立 UI 键。
- `test/ui/asset-keys.test.ts`：补资源键断言。

## 导入清单与键映射
- `btn-primary.png` → `buttonPrimary` → `art/ui/btn-primary`
- `btn-secondary.png` → `buttonSecondary` → `art/ui/btn-secondary`
- `btn-disabled.png` → `buttonDisabled` → `art/ui/btn-disabled`
- `icon-play.png` → `iconPlay` → `art/ui/icon-play`
- `icon-pass.png` → `iconPass` → `art/ui/icon-pass`
- `icon-hint.png` → `iconHint` → `art/ui/icon-hint`
- `icon-bid.png` → `iconBid` → `art/ui/icon-bid`
- `icon-back.png` → `iconBack` → `art/ui/icon-back`
- `icon-settings.png` → `iconSettings` → `art/ui/icon-settings`
- `badge-multiplier.png` → `badgeMultiplier` → `art/ui/badge-multiplier`
- `badge-turn.png` → `badgeTurn` → `art/ui/badge-turn`
- `badge-countdown-ring.png` → `badgeCountdownRing` → `art/ui/badge-countdown-ring`
- `emphasis-bomb.png` → `emphasisBomb` → `art/ui/emphasis-bomb`
- `emphasis-rocket.png` → `emphasisRocket` → `art/ui/emphasis-rocket`
- `emphasis-spring.png` → `emphasisSpring` → `art/ui/emphasis-spring`
- `panel-popup.png` → `panelPopup` → `art/ui/panel-popup`

## 验证
```
PNG/meta validation:
16 UI PNGs exist, expected sizes pass, .meta exists, duplicate UUIDs []

Cocos Creator:
temp/logs/project.log contains Cocos Creator v3.8.8
rg -i "error|exception|failed" temp/logs/project.log
无命中

npm --prefix test test
Test Files  133 passed (133)
Tests       653 passed (653)

npm --prefix test run typecheck
tsc --noEmit

git diff --check
通过，无输出
```

## 自检
- [x] 用户视觉终审已通过
- [x] 资源导入 `assets/resources/art/ui/`
- [x] `.meta` 由 Creator 生成
- [x] `asset-keys` 路径无扩展名、无重复
- [x] 未手写 `.meta`
