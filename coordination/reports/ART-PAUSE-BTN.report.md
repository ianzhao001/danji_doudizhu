# ART-PAUSE-BTN Report

任务：ART-PAUSE-BTN  
分支：task/ART-PAUSE-BTN  
日期：2026-07-06  
状态：待用户图审

## 范围

本分支只产出暂停面板按钮 preview：

- `asset-previews/v13-pause-buttons/`
- `coordination/reports/ART-PAUSE-BTN.report.md`

未修改 `assets/resources/**`、`.meta`、场景、产品代码。

## 产物

图审入口：

- `asset-previews/v13-pause-buttons/review-sheet.png`
- `asset-previews/v13-pause-buttons/PROMPTS.md`
- `asset-previews/v13-pause-buttons/manifest.json`

正式 preview 件：

- `asset-previews/v13-pause-buttons/ui/pause-btn-toggle.png`
- `asset-previews/v13-pause-buttons/ui/pause-btn-action.png`

拉伸模拟：

- `asset-previews/v13-pause-buttons/stretch/`
- 2 组皮肤 x 2 宽度 x 3 文案 = 12 张

## 生成与后处理

- 正式源图：内置 `image_gen` 文生图。
- 后处理脚本：`asset-previews/v13-pause-buttons/scripts/finalize_pause_buttons.py`
- Pillow 用途：chroma-key 去背、裁切、透明画布归一、九宫格拉伸模拟、review sheet 排版、sha256 计算。
- 未使用 CLI fallback。

## Hash

| 文件 | sha256 |
| --- | --- |
| `ui/pause-btn-toggle.png` | `dfc59c31cf9bae527c0fafbca9f0610360d88711577e4d3ba0f8d9c041c17a3e` |
| `ui/pause-btn-action.png` | `3ff4a24015bad8b45b3898a45b4d0a0b7611bece6ff780f2853650300be97675` |
| `review-sheet.png` | `dba738a752f5453dea1a5ed590d2afbb50edb39dfd0b8f926518407fa7678b88` |

## 自检

- [x] preview-only 文件域。
- [x] 两组按钮皮肤：设置切换组、动作组。
- [x] 64px / 176px 拉伸模拟齐全。
- [x] 源图记录、后处理脚本、manifest、PROMPTS 齐全。
- [x] 两个正式 PNG 为 RGBA，alpha extrema = `(0, 255)`。
- [x] 无第三方 IP/logo/text baked into skin。

## 验证

- `npm --prefix test test`：141 files / 739 tests passed
- `npm --prefix test run typecheck`：passed
- `git diff --check`：passed

## 用户图审记录

待用户逐件确认：

- `pause-btn-toggle`：pending
- `pause-btn-action`：pending

若通过，进入 `ART-IMPORT-PAUSE-BTN`；若打回，仅返工本 preview，不导入。
