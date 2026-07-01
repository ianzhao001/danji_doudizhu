# ART-06 横屏背景（执行者文生图）

- 状态：ready（可与 P-G/P-L 并行）
- 类型：美术 · **文生图（text-to-image）由执行者生成**
- 文件域（**只允许改这些**）：
  - `asset-previews/<本任务子目录>/`（生成的横版背景 preview + 说明）
  - `coordination/reports/ART-06.report.md`
  - **不改** `assets/resources/**`（导入属后续 ART-IMPORT-06，须用户视觉终审后）
- 依赖：E-0 ✅（横屏分辨率已定 844×390）
- 分支：`task/ART-06-landscape-backgrounds`

## 背景（关联规划书 §6 E-0/P-G/P-L 的「横图美术依赖」）

竖转横后，当前 3 张背景仍是竖图（390×844），P-G/P-L 暂用运行时纯色占位。本任务**由执行者文生图**生成横版 844×390 背景，经用户视觉终审后再导入替换。

## 需要生成（横版 844×390，安全区四周留边、主体内容居中不被 HUD 压盖）
1. **`gameTableBg`**：横屏牌桌背景（牌桌绿呢/斗地主氛围；上方左右角留 AI 座位空间、底部留手牌带、中心留出牌区）。
2. **`lobbyBg`**：横屏大厅背景（与游戏统一风格；避免中心过强，给面板/按钮让位）。
3. **`settlementBg`**：横屏结算弹层背景（可延用竖版风格改横版构图）。

## 要求
- 分辨率 844×390（或等比更高分辨率横版，导入时缩放），横屏构图。
- 风格延续现有美术基线（参考 `asset-previews/` 既有背景包与 `docs/ASSET_LIST.md`）。
- 每张附生成 prompt 与缩略预览，供用户视觉终审。
- **本任务只出 preview，不导入 `assets/resources`**（导入 + `.meta` 属 ART-IMPORT-06，须用户终审通过后）。

## 验收（用户视觉终审）
- `asset-previews/<子目录>/` 下 3 张横版背景 + prompt 说明齐全。
- 用户视觉终审通过后，方进入 ART-IMPORT-06（导入 + swap-in）。
- 报告 `coordination/reports/ART-06.report.md` 记生成方式（文生图）、prompt、预览路径、终审状态。

## 后续（不在本任务内）
- **ART-IMPORT-06**：终审通过后导入 `assets/resources/art/backgrounds/`（同资源键、横版）+ Creator 生成 `.meta`。
- **swap-in**：P-G/P-L 落 main 后，把运行时纯色占位换回 `loadSprite(gameTableBg/lobbyBg/settlementBg)`（P-G/P-L 域的小 scoped 收尾；若横图先就绪，P-G/P-L 阶段①可直接加载真图）。

## 交付物
- 分支提交 preview + 报告；获架构 `approved` 后 `claim → merge → release`。
