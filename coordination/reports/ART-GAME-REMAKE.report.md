# ART-GAME-REMAKE 实现报告

- 实现方标识：Codex
- 分支：`task/ART-GAME-REMAKE`
- 状态：in-review（用户图审打回重排已提交；等待用户复审；未进入 import）

## 改了哪些文件

- `asset-previews/v13-pink-game-remake/`
- `coordination/reports/ART-GAME-REMAKE.report.md`

未改 `assets/resources/**`、`.meta`、场景、产品代码、规则、AI、流程、存档或大厅。

## 生成方式 / 管线证据

- 使用内置 `image_gen` 生成 4 张正式源图，原样保存在 `asset-previews/v13-pink-game-remake/source/generated-v13/`：
  - `game-table-bg-v13-source.png`
  - `avatars-v13-source.png`
  - `ui-v13-source.png`
  - `cards-v13-source.png`
- 使用 `asset-previews/v13-pink-game-remake/scripts/finalize_imagegen_v13.py` 做非创作后处理：
  - 裁切 image_gen 源图。
  - 对角色/UI/卡牌执行 chroma-key 去背。
  - 缩放到 preview 目标尺寸。
  - 生成 64px / 176px 拉伸模拟。
  - 生成 `review-sheet-v2.png` 与三张 v13 合成图。
  - 生成 `manifest-v13.json` 与更新 `PROMPTS.md`。
- `PROMPTS.md` 已明确标注旧 `*-preview.png`、旧 `review-sheet.png`、旧 `composites/composite-*.png` 为 `layout mockup only / 非正式资产`。
- 本轮正式 `*-v13.png` 均由内置 `image_gen` 源图裁切/去背/缩放得到；Pillow 未绘制正式分项资产。

## 正式产物清单

用户图审入口：

- `asset-previews/v13-pink-game-remake/review-sheet-v2.png`
- `asset-previews/v13-pink-game-remake/composites/v13/composite-844x390-bidding-v13.png`
- `asset-previews/v13-pink-game-remake/composites/v13/composite-780x360-playing-v13.png`
- `asset-previews/v13-pink-game-remake/composites/v13/composite-844x390-settlement-v13.png`
- `asset-previews/v13-pink-game-remake/manifest-v13.json`
- `asset-previews/v13-pink-game-remake/PROMPTS.md`

分项 preview：

```
backgrounds/game-table-bg-v13.png
avatars/hero-body-v13.png
avatars/left-ai-body-v13.png
avatars/right-ai-body-v13.png
ui/seat-nameplate-v13.png
ui/btn-primary-v13.png
ui/btn-secondary-v13.png
ui/btn-tertiary-v13.png
ui/btn-disabled-v13.png
ui/settlement-banner-win-v13.png
ui/settlement-banner-lose-v13.png
ui/settlement-panel-v13.png
ui/bottom-cards-dock-v13.png
ui/badge-multiplier-v13.png
ui/badge-timer-v13.png
cards/card-template-v13.png
cards/card-back-v13.png
cards/suit-spade-v13.png
cards/suit-heart-v13.png
cards/suit-club-v13.png
cards/suit-diamond-v13.png
cards/joker-small-v13.png
cards/joker-big-v13.png
```

附加但不进入 import 必选清单：

```
ui/badge-role-v13.png
stretch-simulations/*-v13-stretch.png
source/generated-v13/*.png
```

## 机械校验

```
python3 asset-previews/v13-pink-game-remake/scripts/finalize_imagegen_v13.py
completed

asset list check
missing []
not_manifest []
old_entries []
alpha_bad []

manifest_count 39
backgrounds/game-table-bg-v13.png fc8278caddd316f7 1688x780 alpha False corners False
avatars/hero-body-v13.png f2cf7b839ccf0a56 320x360 alpha True corners True
avatars/left-ai-body-v13.png 87d139fe18034eb3 360x520 alpha True corners True
avatars/right-ai-body-v13.png bb3a197ed1baf689 360x520 alpha True corners True
ui/badge-multiplier-v13.png e31db64b06626c56 180x180 alpha True corners True
ui/badge-role-v13.png 256b5c4c6a05614c 180x180 alpha True corners True
ui/badge-timer-v13.png e4e3b36b27271b49 180x180 alpha True corners True
ui/bottom-cards-dock-v13.png ae5e9cf2e9a12433 440x140 alpha True corners True
ui/btn-disabled-v13.png ee859ef5bd84d724 480x160 alpha True corners True
ui/btn-primary-v13.png 5fd35d740d5e44d1 480x160 alpha True corners True
ui/btn-secondary-v13.png fd8e4989d0b3c7fc 480x160 alpha True corners True
ui/btn-tertiary-v13.png 4f66efeb4430da48 480x160 alpha True corners True
ui/seat-nameplate-v13.png 439301a5435380d6 360x96 alpha True corners True
ui/settlement-banner-lose-v13.png e9f51f5bc7e7c15a 640x180 alpha True corners True
ui/settlement-banner-win-v13.png f0c234fc697e6b0f 640x180 alpha True corners True
ui/settlement-panel-v13.png 4face92eebd2a792 760x380 alpha True corners True
cards/card-back-v13.png 30768ee5b3994c87 220x320 alpha True corners True
cards/card-template-v13.png 45d9aecc40e1d65e 220x320 alpha True corners True
cards/joker-big-v13.png 4b635fac10d47c2d 220x320 alpha True corners True
cards/joker-small-v13.png 3e15df7fc1162693 220x320 alpha True corners True
cards/suit-club-v13.png 4a80a76d6c98aff9 128x128 alpha True corners True
cards/suit-diamond-v13.png 4df5921f0fc127f2 128x128 alpha True corners True
cards/suit-heart-v13.png 0af62567b214f762 128x128 alpha True corners True
cards/suit-spade-v13.png f1fb7153001e6ba6 128x128 alpha True corners True
composites/v13/composite-780x360-playing-v13.png 35f31c6a455785da 780x360 alpha False corners False
composites/v13/composite-844x390-bidding-v13.png 7f6d951c84e66c1e 844x390 alpha False corners False
composites/v13/composite-844x390-settlement-v13.png 0d5f3809d9dffde0 844x390 alpha False corners False
```

完整 sha256 见 `asset-previews/v13-pink-game-remake/manifest-v13.json` 与 `PROMPTS.md`。

## 非文字模态 / IDE 实操验收证据

- 验收面：图像 preview
- 环境与版本：内置 `image_gen` + Python 3 + Pillow 后处理脚本
- 操作步骤：
  1. 生成 4 张内置 `image_gen` 源图。
  2. 复制源图到 `source/generated-v13/`，保留原 `$CODEX_HOME/generated_images/...` 源路径。
  3. 运行 `python3 asset-previews/v13-pink-game-remake/scripts/finalize_imagegen_v13.py`。
  4. 目检 `review-sheet-v2.png`、三张 v13 合成图与 `btn-primary-v13-stretch.png`。
  5. 运行清单/alpha 机械校验。
- 原始证据路径：
  - `asset-previews/v13-pink-game-remake/source/generated-v13/`
  - `asset-previews/v13-pink-game-remake/review-sheet-v2.png`
  - `asset-previews/v13-pink-game-remake/composites/v13/`
  - `asset-previews/v13-pink-game-remake/stretch-simulations/`
  - `asset-previews/v13-pink-game-remake/manifest-v13.json`
  - `asset-previews/v13-pink-game-remake/PROMPTS.md`
- 结果摘要：正式 `-v13` 清单齐；透明件 alpha 与透明四角通过；旧 Pillow 文件保留但已标注非正式；未导入 `assets/resources`。
- 用户主观终审状态：等待逐件图审
- 执行者配合用户终审记录：等待用户结论；需记录 pink 风格一致性、整体布局、名字牌对比度、手牌可读性、按钮易点性、结算观感。
- 审查边界：审查者仅核验证据链、步骤、环境、日志、用户终审记录与可复现说明；不亲验图像质量，不替代用户下主观结论。

## 测试与类型检查输出

```
npm --prefix test install
added 47 packages, and audited 48 packages
5 vulnerabilities in test dependencies reported by npm audit; no dependency changes made in this task.

npm --prefix test test
Test Files  140 passed (140)
Tests       711 passed (711)

npm --prefix test run typecheck
tsc --noEmit passed

git diff --check
passed
```

## 工作树状态

提交前常规状态：

```
git status --short --untracked-files=all
 M asset-previews/v13-pink-game-remake/PROMPTS.md
 M coordination/reports/ART-GAME-REMAKE.report.md
```

被 `.gitignore` 隐藏但本任务需 force-add 的 preview 产物：

```
!! asset-previews/v13-pink-game-remake/avatars/hero-body-v13.png
!! asset-previews/v13-pink-game-remake/avatars/left-ai-body-v13.png
!! asset-previews/v13-pink-game-remake/avatars/right-ai-body-v13.png
!! asset-previews/v13-pink-game-remake/backgrounds/game-table-bg-v13.png
!! asset-previews/v13-pink-game-remake/cards/*-v13.png
!! asset-previews/v13-pink-game-remake/composites/v13/
!! asset-previews/v13-pink-game-remake/manifest-v13.json
!! asset-previews/v13-pink-game-remake/review-sheet-v2.png
!! asset-previews/v13-pink-game-remake/scripts/finalize_imagegen_v13.py
!! asset-previews/v13-pink-game-remake/source/generated-v13/
!! asset-previews/v13-pink-game-remake/stretch-simulations/
!! asset-previews/v13-pink-game-remake/ui/*-v13.png
```

## 与 spec 的偏差 / 关键决策

- 使用 4 张 image_gen 源图承载多件 sprite，再逐件裁切为正式 `-v13` preview。每个正式件均来自内置 `image_gen` 源图，Pillow 只做非创作后处理。
- `settlement-banner-win-v13` / `settlement-banner-lose-v13` 为无字装饰底图；合成预览中的「地主胜利」是 composite 上的代码字效果示意，不是正式资产内文字。
- Joker 使用原创小丑/皇冠图案区分大小王，无 `JOKER` 文字，避免 image_gen 文字瑕疵。
- `ui/badge-role-v13.png` 是 UI sheet 附加裁切件，不在本轮必选 import 清单内。

## 用户图审打回返工段（Codex · 2026-07-05）

### 打回项

- 用户反馈 1：`bidding`、`playing`、`settlement` 三个页面里三个人有两个人重叠，需参考此前示意图的布局避免人物重叠。
- 用户反馈 2：三个人的大小需要一样；玩家角色是在自己手牌的左边，不能出现在牌桌上。
- 关联根因：`T-LAYOUT3` 审查者已打回 `heroBody` 与 `opponentLeftBody` zone 重叠；布局返工已在 `task/T-LAYOUT3` 提交 `7c9a55b` 与二次提交 `927b375`。

### 修复方式

- 未重新生成 image_gen 源图，未替换正式分项资产。
- 只更新 `finalize_imagegen_v13.py` 的合成预览 `ZONE_SIZES`：
  - 844×390：三名 body 统一 `152×234`；玩家 `x=8..160`，手牌从 `x=176` 开始。
  - 780×360：三名 body 统一 `140×216`；玩家 `x=8..148`，手牌从 `x=164` 开始。
- 合成时角色使用 alpha bbox 适配同尺寸 zone，避免透明边导致玩家视觉上偏小。
- 重新生成三张 composite、`review-sheet-v2.png`、`manifest-v13.json` 与 `PROMPTS.md`。
- `PROMPTS.md` 已记录本轮用户图审打回与 `T-LAYOUT3` 修复提交指针。

### 返工后机械校验

```
python3 asset-previews/v13-pink-game-remake/scripts/finalize_imagegen_v13.py
completed

asset list check
missing []
not_manifest []
old_entries []
alpha_bad []

manifest_count 39
composites/v13/composite-844x390-bidding-v13.png 7f6d951c84e66c1e 844x390 alpha False corners False
composites/v13/composite-780x360-playing-v13.png 35f31c6a455785da 780x360 alpha False corners False
composites/v13/composite-844x390-settlement-v13.png 0d5f3809d9dffde0 844x390 alpha False corners False
review-sheet-v2.png c78907d97ba47e84 1800x1320 alpha False corners False
```

### 返工后目检

- `composite-844x390-bidding-v13.png`：三名角色同尺寸；玩家在手牌左侧，不进入牌桌中央；无人物互叠。
- `composite-780x360-playing-v13.png`：三名角色同尺寸；玩家在手牌左侧，底部手牌区未被人物压住。
- `composite-844x390-settlement-v13.png`：暗幕下三名角色同尺寸并保留围桌关系；玩家仍在手牌左侧/左下区域。

### 返工后测试与类型检查输出

```
npm --prefix test test
Test Files  140 passed (140)
Tests       711 passed (711)

npm --prefix test run typecheck
tsc --noEmit passed

git diff --check
passed
```

## 疑问 / 需规划者裁定

- 无。

## 批次交接记录 / 下一步

- 所属批次 / 任务号：UI-REMAKE 第四波 / `ART-GAME-REMAKE`
- 本回合结论 / 状态：v13 逐件 image_gen preview 已完成，等待用户逐件图审；未进入 import。
- 下一步找谁：执行者配合用户终审
- 用户终审配合：请用户查看 `review-sheet-v2.png`、`PROMPTS.md` 正式清单、`composites/v13/` 三张合成图和 `stretch-simulations/`；执行者记录通过/打回件清单。
- 给下一窗口的可粘贴提示词（指针化）：

```
你是本仓库 斗地主 的执行型 AI，配合用户进行 ART-GAME-REMAKE 用户图审。本任务不导入 assets。
先读：coordination/PROTOCOL.md、coordination/tasks/ART-GAME-REMAKE.md、coordination/reports/ART-GAME-REMAKE.report.md、coordination/BOARD.md 的 UI-REMAKE 段。
本回合最小增量：task/ART-GAME-REMAKE 已生成 v13 image_gen 正式 preview，入口为 asset-previews/v13-pink-game-remake/review-sheet-v2.png、PROMPTS.md、manifest-v13.json、composites/v13/；请记录用户对 pink 风格一致性、整体布局、名字牌对比度、手牌可读性、按钮易点性、结算观感的逐件结论，不要替用户判断。
```

## 自检（对照验收项）

- [x] 测试全绿
- [x] typecheck 无错
- [x] `git status --short --untracked-files=all` 已记录，越域未跟踪文件已清理或说明
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获精确机器态 `approved` 前未合并 main；高风险 `approved-pending-planner` 未直接合并；获批后仅由审查者通过 `agentctl.sh claim/merge/release` 合并
- [x] 未 import cc
