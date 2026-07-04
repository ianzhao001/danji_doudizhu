# ART-IMPORT-GAME-REMAKE — v13 pink 游戏内 UI 重造资源导入

- 状态：todo（等待 `ART-GAME-REMAKE` 用户视觉终审通过）
- 类型：美术导入 · Cocos Creator 3.8.8 实操
- 文件域（只允许改这些）：
  - `assets/resources/art/backgrounds/game-table-bg.png` + `.meta`
  - `assets/resources/art/avatars/player-body-avatar.png`、`ai-left-body-avatar.png`、`ai-right-body-avatar.png` + `.meta`
  - `assets/resources/art/cards/*` 中被用户图审通过的同名替换项 + `.meta`
  - `assets/resources/art/ui/*` 中被用户图审通过的同名替换项 + `.meta`
  - `assets/scripts/ui/asset-keys.ts`
  - `coordination/reports/ART-IMPORT-GAME-REMAKE.report.md`
- 依赖：ART-GAME-REMAKE 用户视觉终审通过
- 分支建议：`task/ART-IMPORT-GAME-REMAKE`

## 行为要求

- 只导入用户图审通过的 v13 pink 资源；未通过项不得进入 `assets/resources`。
- 新增资源键：
  - `playerBodyAvatar: 'art/avatars/player-body-avatar'`
  - `aiLeftBodyAvatar: 'art/avatars/ai-left-body-avatar'`
  - `aiRightBodyAvatar: 'art/avatars/ai-right-body-avatar'`
- `.meta` 必须由 Cocos Creator 3.8.8 生成或更新，不手写。
- 不改功能逻辑、不改大厅、不改规则/AI/存档。

## 验收

- `asset-keys.ts` 新键 typecheck 通过。
- 记录每个导入文件与 preview 源文件的 sha256、尺寸、alpha 情况、Creator 版本、`.meta` UUID/border。
- `npm --prefix test test`、`npm --prefix test run typecheck`、`git diff --check` 全绿。
