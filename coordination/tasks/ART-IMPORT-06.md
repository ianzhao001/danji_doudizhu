# ART-IMPORT-06 横图导入 + 背景 swap-in

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/resources/art/backgrounds/game-table-bg.png`、`lobby-bg.png`、`settlement-bg.png`（**覆盖同名文件**为横版）+ 其 `.meta`（**Creator 生成，不手写**）
  - `assets/scripts/ui/components/game-scene-skeleton.ts`（占位背景换真图）
  - `assets/scripts/ui/components/lobby-scene.ts`（占位背景换真图）
  - `coordination/reports/ART-IMPORT-06.report.md`
- 依赖：ART-06 ✅（3 张终审通过）/ P-G ✅ / P-L ✅
- 分支：`task/ART-IMPORT-06`
- **worktree 测试环境**：新 worktree 若报缺 `./temp/cli/tsconfig.cocos.json`，`mkdir -p temp/cli && cp /Users/admin/Documents/Cocos/斗地主/temp/cli/tsconfig.cocos.json temp/cli/`。

## 背景（关联规划书 §6、ART-06）

ART-06 已产出 3 张过审横版背景（在 `asset-previews/pink-cartoon-production-v2-landscape-backgrounds/`）。P-G/P-L 当前用运行时纯色占位。本任务把横图导入 `assets/resources`，并把占位换回真图，让横屏呈现发布态背景。

## 行为要求

### 1. 导入（覆盖同键，不改 asset-keys 路径）
- 用过审横版覆盖：
  - `game-table-bg.png` ← `asset-previews/.../game-table-bg-landscape.png`（1844×853·满屏）
  - `lobby-bg.png` ← `.../lobby-bg-landscape.png`（1846×852·满屏）
  - `settlement-bg.png` ← `.../settlement-bg-landscape.png`（1313×1198·RGBA 弹层框）
- **在 Cocos Creator 3.8.8 里 re-import**，让编辑器更新 `.meta`/spriteFrame（保持文件名/资源路径不变，`RESOURCE_PATHS.gameTableBg/lobbyBg/settlementBg` 自动指向新图，不改 `asset-keys.ts`）。

### 2. swap-in（P-G / P-L 占位换真图）
- **P-G**：`renderPlaceholderBackground` 的纯色 Graphics 换成加载 `gameTableBg` 满屏铺满（`this.background` 或占位节点挂 Sprite `loadSprite(RESOURCE_PATHS.gameTableBg, ...)`），去掉纯色绘制；保持横屏 844×390 满屏、不变形。
- **P-L**：同上换 `lobbyBg` 满屏。
- **settlementBg**：结算面板已有 `loadSprite(RESOURCE_PATHS.settlementBg, ...)`；确认面板 Sprite 尺寸/类型正确展示新 RGBA 弹层框（面板 ~1.1:1，图 1.096:1，SIMPLE 填充即可；透明外区正常显示，不出黑边）。

## 验收（编辑器/运行时）
- `npm --prefix test test`（134/659 不回归）+ `npm --prefix test run typecheck` 净。
- **四横屏 CDP 截图**（844×390/812×375/915×412横/780×360）：game/lobby 满屏真背景不拉伸变形、settlement 弹层框透明外区无黑边、内容可读；`productErrors=[]`。
- `.meta` 由 Creator 生成（report 记 UUID 变化情况）。
- 证据落 `coordination/reports/ART-IMPORT-06.report.md`（截图路径 + CDP summary）。

## 交付物
- 分支 `task/ART-IMPORT-06` 提交（含 Creator 生成 `.meta`）；报告。
- 获架构 `approved` 后 `claim → merge → release` 自合。

## 测试命令
`npm --prefix test test`
