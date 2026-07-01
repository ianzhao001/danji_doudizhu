# ART-IMPORT sprite-frame 返工报告

- 实现方标识：Codex
- 分支：`task/art-final-review-assets`
- 状态：ready-for-review
- 返工来源：审查第 7 项指出 22 个会作为场景内 Sprite 使用的新增 PNG 仍为 `texture`，缺少 `SpriteFrame` 子资源，后续 `resources.load(..., SpriteFrame)` 会无法加载。

## 处理方式
- 使用 Cocos Creator 3.8.8 打开 `/Users/admin/Documents/Cocos/斗地主.worktrees/art-final-review-assets`。
- 通过一次性项目扩展调用 Creator `asset-db` 消息：
  - `query-asset-meta`
  - `save-asset-meta`
  - `reimport-asset`
- 扩展只作为临时工具运行，完成后已从 worktree 删除，未纳入提交。
- 未手写 `.meta`；`f9941` SpriteFrame 子资源由 Creator 重导入生成。

## 已转换为 sprite-frame 的资源
- `assets/resources/art/avatars/avatar-frame.png`
- `assets/resources/art/avatars/farmer-role-badge.png`
- `assets/resources/art/avatars/landlord-role-badge.png`
- `assets/resources/art/ui/btn-primary.png`
- `assets/resources/art/ui/btn-secondary.png`
- `assets/resources/art/ui/btn-disabled.png`
- `assets/resources/art/ui/icon-play.png`
- `assets/resources/art/ui/icon-pass.png`
- `assets/resources/art/ui/icon-hint.png`
- `assets/resources/art/ui/icon-bid.png`
- `assets/resources/art/ui/icon-back.png`
- `assets/resources/art/ui/icon-settings.png`
- `assets/resources/art/ui/badge-multiplier.png`
- `assets/resources/art/ui/badge-turn.png`
- `assets/resources/art/ui/badge-countdown-ring.png`
- `assets/resources/art/ui/emphasis-bomb.png`
- `assets/resources/art/ui/emphasis-rocket.png`
- `assets/resources/art/ui/emphasis-spring.png`
- `assets/resources/art/ui/panel-popup.png`
- `assets/resources/art/misc/badge-win.png`
- `assets/resources/art/misc/badge-lose.png`
- `assets/resources/art/misc/empty-records.png`

## 保持 texture 的资源
- `assets/resources/art/misc/app-icon.png`
- `assets/resources/art/misc/splash.png`

## 验证
```
Creator meta check:
22 sprite-frame targets: userData.type == "sprite-frame"
22 sprite-frame targets: subMetas contains f9941 importer == "sprite-frame"
misc/app-icon.png and misc/splash.png remain userData.type == "texture"

UUID validation:
uuid_count 262
duplicate_count 0

Cocos Creator:
temp/logs/project.log contains Cocos Creator v3.8.8
rg -i "error|exception|failed" temp/logs/project.log
无错误命中

npm --prefix test test
Test Files  133 passed (133)
Tests       653 passed (653)

npm --prefix test run typecheck
tsc --noEmit

git diff --check
通过，无输出
```

## 自检
- [x] 22 个场景内 Sprite 资源均已生成 `@f9941` SpriteFrame 子资源
- [x] `app-icon` / `splash` 保持 `texture`
- [x] `.meta` 经 Cocos Creator 3.8.8 重导入产生
- [x] UUID 无重复
- [x] 未触碰 PNG、`asset-keys.ts`、测试或纯层代码
