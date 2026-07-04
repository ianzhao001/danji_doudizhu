# ART-GAME-REMAKE 实现报告

- 实现方标识：Codex
- 分支：`main`（用户直接要求实施计划；本回合先落 preview gate，不导入资源）
- 状态：等待用户视觉终审

## 改了哪些文件

- `asset-previews/v13-pink-game-remake/`
- `coordination/tasks/ART-GAME-REMAKE.md`
- `coordination/tasks/ART-IMPORT-GAME-REMAKE.md`
- `coordination/tasks/T-LAYOUT3.md`
- `coordination/tasks/P-G4-UI-REMAKE.md`
- `coordination/tasks/R-UI-REMAKE.md`
- `coordination/reports/ART-GAME-REMAKE.report.md`

## 非文字模态 / IDE 实操验收证据

- 验收面：图像 preview
- 环境与版本：内置 `image_gen` 方向稿 + Python 3 / Pillow 脚本生成分项 PNG
- 操作步骤：
  1. 生成 pink 游戏内 UI 重造方向稿。
  2. 复制方向稿到 `asset-previews/v13-pink-game-remake/source/ai-direction-sheet.png`。
  3. 运行 `python3 asset-previews/v13-pink-game-remake/scripts/generate_preview_assets.py` 生成分项资产与合成图。
- 原始证据路径：
  - `asset-previews/v13-pink-game-remake/review-sheet.png`
  - `asset-previews/v13-pink-game-remake/composites/`
  - `asset-previews/v13-pink-game-remake/PROMPTS.md`
- 结果摘要：
  - 生成 1 张内置 `image_gen` 方向稿：`source/ai-direction-sheet.png`（1846×852，仅作风格参考）。
  - 生成正式图审总览：`review-sheet.png`（1600×1000）。
  - 生成三张正式合成预览：844×390 叫抢、780×360 出牌、844×390 结算。
  - 生成分项 preview PNG：背景、三名角色 body、卡牌/牌背/花色/Joker、按钮、名字牌、底牌托架、结算面板、胜负徽章。
  - `PROMPTS.md` 已记录生成方式、正式接线限制与 sha256。
- 用户主观终审状态：等待
- 审查边界：审查者仅核验证据链、步骤、环境、日志、用户终审记录与可复现说明；不替代用户下视觉结论。

## 测试与类型检查输出

```
npm --prefix test test
Test Files  140 passed (140)
Tests       711 passed (711)

npm --prefix test run typecheck
tsc --noEmit passed

git diff --check
passed
```

## 与 spec 的偏差 / 关键决策

- 方向稿中如出现当前功能外按钮，仅作为风格参考；正式脚本合成稿只保留现有功能入口。
- 本回合不进入 `ART-IMPORT-GAME-REMAKE`，因为用户视觉终审尚未通过。

## 批次交接记录 / 下一步

- 所属批次 / 任务号：UI-REMAKE / `ART-GAME-REMAKE`
- 本回合结论 / 状态：preview gate 待用户视觉终审
- 下一步找谁：执行者配合用户终审
- 用户终审配合：请用户查看 `review-sheet.png` 与 `composites/`，确认 pink 风格一致性、布局、名字牌对比度、手牌可读性、按钮易点性、结算观感。
- 给下一窗口的可粘贴提示词：
  - 你是本仓库 斗地主 的执行者，配合用户进行 `ART-GAME-REMAKE` 用户视觉终审。先读 `coordination/PROTOCOL.md`、`coordination/tasks/ART-GAME-REMAKE.md`、`coordination/reports/ART-GAME-REMAKE.report.md`、`coordination/BOARD.md` 的 UI-REMAKE 段。请用户查看 `asset-previews/v13-pink-game-remake/review-sheet.png` 与 `asset-previews/v13-pink-game-remake/composites/`，记录用户对 pink 风格一致性、整体布局、名字牌对比度、手牌可读性、按钮易点性、结算观感的结论；不要替用户判断视觉通过。
