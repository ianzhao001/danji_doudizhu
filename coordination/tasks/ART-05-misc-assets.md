# ART-05 杂项美术：加载屏 + 应用图标 + 占位补全（第十二批·打磨·gated）

- 状态：**blocked（待用户对 ART-01~04 风格锚整体认可后再排）**——保持粉卡通方向一致
- 派发模式：Codex 文生图执行者（`image_gen`/chroma-key·串行 `task/art-gen-v2`）
- 文件域（**只写**）：`asset-previews/pink-cartoon-production-v2/misc/`（**不进 `assets/`**·导入另开任务）+ `PROMPTS.md` + `coordination/reports/ART-05.report.md`
- **验收特殊**：架构只验技术规格（尺寸/透明/命名/无字），**视觉终审归用户**，过技术门后置 `in-review`

## 目标
补齐发布所需杂项美术（沿用 v1/v2 粉卡通方向）：
- **加载屏**（启动 splash，1080×2340 不透明）
- **应用图标**（1024×1024 方形 + 圆角安全区）
- **空状态插画**（如「暂无战绩」配图，透明）
- 可选：**结算胜/负角标**（透明）

## 行为要求
1. 输出到 `…v2/misc/`，命名清晰（`splash.png`/`app-icon.png`/`empty-records.png`/`badge-win.png`/`badge-lose.png`），分辨率/透明按上列。
2. 沿用 `…v2/backgrounds/PROMPTS.md` 的 Shared Art Direction（粉卡通），`PROMPTS.md` 记可复现 prompt + no-text 约束。
3. **完成后 `git add -f asset-previews/...v2/misc/ coordination/reports/ART-05.report.md`**（`.gitignore` 忽略 asset-previews）。
4. 不进 `assets/`、零脚本、零测试影响。

## 验收
- 技术门：尺寸/透明/命名/无字符合；PROMPTS 可复现；report 列清单 + 技术规格。
- 置 `in-review` 待用户视觉终审；视觉终审通过后另开 ART-IMPORT-05 导入任务。
