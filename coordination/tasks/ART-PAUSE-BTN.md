# ART-PAUSE-BTN — 暂停面板专用按钮美术 preview（用户裁决另生·2026-07-06）

- 状态：ready（preview-only·用户图审 gate）
- 任务模式：editor-evidence（image_gen 文生图 + 用户图审）
- 文件域（只允许改这些）：
  - `asset-previews/v13-pause-buttons/`
  - `coordination/reports/ART-PAUSE-BTN.report.md`
  - 不碰 `assets/resources/**`、`.meta`、场景、产品代码
- 依赖：—
- 分支：`task/ART-PAUSE-BTN`

## 目标

为暂停面板 6 按钮（两组：**组1 设置切换** 音效/动效/震动；**组2 动作** 继续/重开/退出）生成**专用按钮皮肤**，粉色卡通风格延续 v13（对齐方向稿 `asset-previews/v13-pink-game-remake/source/ai-direction-sheet.png`），但更适配暂停面板的紧凑双列布局。

## 产出（image_gen 正式件·非 Pillow）

- 建议 **2 个九宫格按钮皮肤**（`pause-btn-toggle` 组1 / `pause-btn-action` 组2），各含 default 态；**九宫格四角平坦区 ≥24px**、中部可拉伸容多字；每皮肤附 **64px/176px 两档拉伸模拟**证明背景包裹文字不变形。
- 若用户图审要求 6 个视觉各异，则扩为 6 件（图审时定）。
- `review-sheet.png` 一屏对照 + `PROMPTS.md`（生成方式/约束/sha256）。

## 硬约束

- 不复刻第三方 IP/logo；风格与 v13 现有 btn 皮肤协调（同族粉色）。
- 两组皮肤须支持「文字完整包裹 + 与文字高对比」（图审看拉伸模拟里放中文字样如「音效开」「继续」不溢出、对比清晰）。
- 用户图审未过前不得进入 ART-IMPORT-PAUSE-BTN。

## 验收

- preview 齐 + 拉伸模拟齐 + review-sheet + PROMPTS/sha256。
- 报告记生成工具/prompt/sha256/用户图审结论（逐件通过/打回）。
- 审查按 `tasks/R-WAVE7.md` R:ART-PAUSE-BTN。

## 交付物

分支提交 + 报告 → **用户单轮图审**（执行者配合记录）→ 通过件流入 ART-IMPORT-PAUSE-BTN。
