# ART-IMPORT-GAME-REMAKE — v13 资源导入（新文件+新键·不同名覆盖）

- 状态：blocked（等 `ART-GAME-REMAKE` 用户图审通过）
- 任务模式：editor-evidence（Cocos Creator 3.8.8 实操）
- 文件域（只允许改这些）：
  - `assets/resources/art/backgrounds/game-table-bg-v13.png` + `.meta`
  - `assets/resources/art/avatars/{hero,left-ai,right-ai}-body-v13.png` + `.meta`
  - `assets/resources/art/ui/*-v13.png` + `.meta`
  - `assets/resources/art/cards/*-v13.png` + `.meta`
  - `assets/scripts/ui/asset-keys.ts`（**纯增 v13 键组**）
  - `coordination/reports/ART-IMPORT-GAME-REMAKE.report.md`
- 依赖：ART-GAME-REMAKE 用户图审通过
- 分支：`task/ART-IMPORT-GAME-REMAKE`

## 管线裁定（规划者 2026-07-05·覆盖原「同名替换」方案）

- **一律新文件 `-v13` 后缀 + `asset-keys.ts` 纯增新键**，不得同名覆盖任何既有资产——`btn-*`/`panel-popup` 等为大厅共用键，同名替换会静默重皮大厅（违反「不改大厅」约束）且不可回滚。**lobby 现有键与文件零改动。**
- 「lobby v13 风格统一」已登记设计债，后续独立任务处理。

## 行为要求

1. 只导入用户图审**通过**的件；打回件不得导入。
2. 逐字节拷贝（审查者 sha256 对照 preview）。
3. `.meta` 由 Creator 3.8.8 生成；`type: sprite-frame`；九宫格件（btn×4 / settlement-panel / nameplate / dock）在检视器配 border（依 preview corner-metrics），**不手写 `.meta`**。
4. asset-keys 新键组命名 `xxxV13`（如 `gameTableBgV13`、`heroBodyV13`、`btnPrimaryV13`、`settlementPanelV13`、`cardTemplateV13`…），既有键零改动。

## 验收

- 全量 vitest/typecheck 不回归；新键 typecheck 过。
- 报告：每件 sha256（与 preview 对照）、尺寸/alpha、`.meta` UUID、border 四值与取值依据、Creator 版本。
- 审查按 `tasks/R-UI-REMAKE.md` R:ART-IMPORT-GAME-REMAKE（修订版）。
