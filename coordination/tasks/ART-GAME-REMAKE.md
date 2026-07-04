# ART-GAME-REMAKE — v13 pink 游戏内 UI 重造 preview（逐件文生图阶段）

- 状态：ready（**方向稿已由用户定档 2026-07-05**·进入逐件文生图阶段；Pillow 布局示意阶段已完成于 `ff43262`）
- 任务模式：editor-evidence（图像产出 + 用户图审 gate）
- 类型：美术 · preview-only · **正式分项资产必须 image_gen 文生图**
- 文件域（只允许改这些）：
  - `asset-previews/v13-pink-game-remake/`
  - `coordination/reports/ART-GAME-REMAKE.report.md`
  - 不碰 `assets/resources/**`、`.meta`、场景、产品代码
- 依赖：T-FIX-SETTLE ✅`6df0c88`；方向稿定档 ✅（用户 2026-07-05）
- 分支：`task/ART-GAME-REMAKE`（**本阶段起走分支+lane**——`ff43262` 直落 main 属用户特批一次性豁免，不再复用）

## 定档方向

`source/ai-direction-sheet.png`（image_gen 文生图）即 v13 目标方向：大圆桌主舞台、三名角色立绘围桌、底部大手牌、行动按钮居中悬桌、结算横幅+面板覆盖暗幕牌桌；粉色卡通风格延续。

## 管线裁定（规划者 2026-07-05·必须遵守）

- **正式分项资产一律 image_gen 文生图**——`scripts/generate_preview_assets.py` 的 Pillow 直出图仅限布局示意 composite，**不得**作为正式资产送审/导入（质感低于现役 v12 且含文字互叠缺陷，规划者亲验裁定）。
- 既有 `composites/*.png` 与 Pillow 分项图保留原位，在 `PROMPTS.md` 标注「布局示意（layout mockup）——非正式资产」。

## 产出（全量重做清单·用户裁决 2026-07-05）

每件按目标用途尺寸（对照 T-LAYOUT3 zone 比例，≥2x 分辨率）生成正式 preview：

- 背景：`game-table-bg-v13`（横版大圆桌舞台；844×390 基准、四横屏可裁安全区）
- 立绘×3：`hero-body-v13` / `left-ai-body-v13` / `right-ai-body-v13`（透明底）
- UI 件：`seat-nameplate-v13`（含头像位）、`btn-primary-v13` / `btn-secondary-v13` / `btn-tertiary-v13` / `btn-disabled-v13`（出牌/不要/提示/禁用）、`settlement-banner-win-v13` / `settlement-banner-lose-v13`、`settlement-panel-v13`、`bottom-cards-dock-v13`、`badge-multiplier-v13`、`badge-timer-v13`
- 卡牌件：`card-template-v13`、`card-back-v13`、`suit-{spade,heart,club,diamond}-v13`、`joker-small-v13`、`joker-big-v13`
- 九宫格候选件（btn×4 / settlement-panel / nameplate / dock）附 **64px/176px 两档拉伸模拟图**
- `review-sheet-v2.png`（逐件成品总览，含卡面混合渲染示意=新模板+代码字效果）+ `PROMPTS.md` 更新（生成方式/约束/每件 sha256）

## 硬约束

- 不改大厅首页；不新增商店/托管/聊天/更多等功能入口；不复刻第三方 IP/logo/角色/图标。
- 方向稿中的 加倍按钮/金币/第四座位 等**非当前功能元素不得进入正式件**（方向稿仅风格参考）。
- 用户图审未通过前，不得进入 `ART-IMPORT-GAME-REMAKE`。

## 验收

- 全量清单齐 + 拉伸模拟齐 + `review-sheet-v2.png` 可一屏对照方向稿。
- 报告记录：生成工具与 prompt 摘要、每件 sha256、用户终审状态（等待/逐件通过/打回件清单）。
- 审查按 `tasks/R-UI-REMAKE.md` R:ART-GAME-REMAKE（修订版）。

## 交付物

分支提交 + 报告 → **用户单轮图审**（执行者配合并记录结论）→ 通过件流入 ART-IMPORT；打回件单独重生成再审。
