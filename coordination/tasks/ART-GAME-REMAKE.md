# ART-GAME-REMAKE — v13 pink 游戏内 UI 重造 preview

- 状态：ready（preview-only；用户视觉终审 gate）
- 类型：美术 · preview-only · 文生图方向稿 + 脚本生成分项 PNG
- 文件域（只允许改这些）：
  - `asset-previews/v13-pink-game-remake/`
  - `coordination/reports/ART-GAME-REMAKE.report.md`
  - 不碰 `assets/resources/**`、`.meta`、场景、产品代码
- 依赖：T-FIX-SETTLE done `6df0c88`
- 分支建议：`task/ART-GAME-REMAKE`

## 目标

保持现有 **pink 粉色卡通风格**，只参考用户上传截图的布局与元素组织：大牌桌主舞台、三名角色围桌、底部大手牌、中部行动按钮、结算覆盖在牌桌上。

## 产出

在 `asset-previews/v13-pink-game-remake/` 产出：

- `source/ai-direction-sheet.png`：内置 image_gen 方向稿，仅作风格参考。
- `backgrounds/game-table-bg-preview.png`：横版 pink 牌桌背景 preview。
- `avatars/*-body-preview.png`：三名透明角色立绘 preview。
- `cards/*-preview.png`：卡牌模板、牌背、花色、大小王 preview。
- `ui/*-preview.png`：按钮、名字牌、底牌托架、结算面板、胜负徽章 preview。
- `composites/composite-844x390-bidding.png`、`composite-780x360-playing.png`、`composite-844x390-settlement.png`。
- `review-sheet.png`：整包用户图审总览。
- `PROMPTS.md`：生成方式、约束、文件 sha256。

## 硬约束

- 不改大厅首页。
- 不新增商店、托管、聊天、更多等截图里的新功能按钮。
- 不复刻第三方截图 IP、logo、角色、图标或 UI 资产。
- 方向稿中若出现非当前功能按钮，只能作为视觉参考，不能进入正式接线。
- 用户视觉终审未通过前，不得进入 `ART-IMPORT-GAME-REMAKE`。

## 验收

- preview 文件齐全，`review-sheet.png` 能同时看到叫抢、出牌、结算三种状态。
- 风格保持 pink 粉色卡通，不切换为蓝色写实城市风。
- 报告记录生成工具、路径、sha256、用户终审状态。
