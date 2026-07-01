# ART-IMPORT-02-avatars 导入报告

- 实现方标识：Codex
- 分支：`task/art-final-review-assets`
- 状态：in-review
- 用户视觉批准来源：本对话中用户在查看 `/tmp/doudizhu-art-final-review-final/index.html` 后明确回复「视觉通过，继续导入」。

## 改了哪些文件
- 替换既有头像 PNG：
  - `assets/resources/art/avatars/player-avatar.png`
  - `assets/resources/art/avatars/ai-cheerful-avatar.png`
  - `assets/resources/art/avatars/ai-calm-avatar.png`
- 新增头像相关 sprite：
  - `assets/resources/art/avatars/landlord-role-badge.png`
  - `assets/resources/art/avatars/farmer-role-badge.png`
  - `assets/resources/art/avatars/avatar-frame.png`
- Cocos Creator 3.8.8 自动生成/更新上述 `.meta`。
- `assets/scripts/ui/asset-keys.ts`：新增 `landlordRoleBadge`、`farmerRoleBadge`、`avatarFrame`。
- `test/ui/asset-keys.test.ts`：补资源键断言。

## 导入清单与键映射
- `player-avatar.png` → `playerAvatar` → `art/avatars/player-avatar`
- `ai-cheerful-avatar.png` → `aiCheerfulAvatar` → `art/avatars/ai-cheerful-avatar`
- `ai-calm-avatar.png` → `aiCalmAvatar` → `art/avatars/ai-calm-avatar`
- `landlord-role-badge.png` → `landlordRoleBadge` → `art/avatars/landlord-role-badge`
- `farmer-role-badge.png` → `farmerRoleBadge` → `art/avatars/farmer-role-badge`
- `avatar-frame.png` → `avatarFrame` → `art/avatars/avatar-frame`

## 验证
```
PNG/meta validation:
6 avatar PNGs exist, expected sizes pass, .meta exists, duplicate UUIDs []

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
- [x] 资源导入 `assets/resources/art/avatars/`
- [x] `.meta` 由 Creator 生成/更新
- [x] `asset-keys` 路径无扩展名、无重复
- [x] 未手写 `.meta`
