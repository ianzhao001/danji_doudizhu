# ART-IMPORT-PAUSE-BTN — 暂停按钮美术导入（新文件+纯增键）

- 状态：blocked（等 ART-PAUSE-BTN 用户图审通过）
- 任务模式：editor-evidence（Cocos Creator 3.8.8 实操）
- 文件域（只允许改这些）：
  - `assets/resources/art/ui/pause-btn-*.png` + `.meta`（**新文件**）
  - `assets/scripts/ui/asset-keys.ts`（**纯增**键，如 `pauseBtnToggle`/`pauseBtnAction`）
  - `coordination/reports/ART-IMPORT-PAUSE-BTN.report.md`
- 依赖：ART-PAUSE-BTN 用户图审通过
- 分支：`task/ART-IMPORT-PAUSE-BTN`

## 行为要求

1. 只导入图审通过件；逐字节拷贝（审查者 sha256 对照 preview）。
2. `.meta` 由 Creator 3.8.8 生成、`sprite-frame`、九宫格 border 检视器配置（≥24），**不手写**。
3. asset-keys **纯增**新键（既有键零改动、不同名覆盖·lobby/其它零影响）。

## 验收

- 新键 typecheck 过；全量 vitest/typecheck 不回归（141/739）。
- 报告：每件 sha256、`.meta` UUID/border、Creator 版本。
- 审查按 `tasks/R-WAVE7.md` R:ART-IMPORT-PAUSE-BTN。
