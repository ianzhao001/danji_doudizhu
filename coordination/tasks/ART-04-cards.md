# ART-04 牌面精修（牌背 / 大小王 / 牌框底板 · 文生图）

- 状态：**ready**（ART-01 风格锚 `a181d45` 已被用户采纳并并 main；同 `task/art-gen-v2` 串行 #4）
- 派发模式：Codex 文生图执行者（worktree·`image_gen` + #00ff00 chroma-key；确定性底板可 Python/Pillow）
- 输出（**只写预览包**，**不进 `assets/`**）：`asset-previews/pink-cartoon-production-v2/cards/`
  - `card-back.png`、`joker-small.png`、`joker-big.png`、**`card-template.png`**（可选精修：`suit-*.png` 升级版）
  - `source/` 子目录：每张 `image_gen` 原图复制进 `cards/source/<name>-source.png` 备查
  - 同目录 `PROMPTS.md`（含每图 prompt 全文 + 源路径 + 后处理步骤 + 确定性脚本说明，可复现）
  - `coordination/reports/ART-04-cards.report.md`（技术验收记录）
- 风格锚（**具体引用**）：`asset-previews/pink-cartoon-production-v2/backgrounds/PROMPTS.md` 的 **Shared Art Direction**。
- v1 可复用 prompt 来源（**显式路径**）：大小王升级自 `asset-previews/pink-cartoon-production-v1/PROMPTS.md:38-88` 的 joker prompt（保「2.5:3.5 单张牌、居中、无字无牌点、#00ff00 纯背景、无投影」约束）。
- 工具：插画类（牌背/大小王）用 `image_gen` + chroma-key；几何底板（card-template/suit）可 Python+Pillow 确定性生成（照 v1 做法）。全程零 `cc`、零测试、不进 `assets/`、不手写 `.meta`。

## 命名对齐（**必读**——与代码键名一致，否则导入阶段会断）
- 牌框底板输出文件名必须是 **`card-template.png`**，沿用 v1/MANIFEST 与代码 `assets/scripts/ui/asset-keys.ts` 的 `cardTemplate: 'art/cards/card-template'` 键名。
- 牌背输出 `card-back.png`（对应 `asset-keys.ts` 的 `cardBack: 'art/cards/card-back'`）。
- 大小王输出 `joker-small.png` / `joker-big.png`（对应 `jokerSmall` / `jokerBig` 键）。
- 若执行者出于语义偏好坚持用 `card-frame` 命名，须在 `PROMPTS.md` 与 report 中显式标注「card-frame 为 card-template 的新名，导入时需同步改 `asset-keys.ts:5` 键名/路径」——默认仍用 `card-template` 与代码对齐，零改导入路径。

## 背景与边界
牌面渲染**数据驱动**：点数+花色 → 图集帧/文字叠加（`card-view` 已给 `assetKey`/`rankLabel`/`suitKey`）。故**不需要逐张 54 面手绘**；本任务只精修：① 牌背、② 大小王整张插画、③ 空白牌框底板（点数/花色由 Cocos 文字+suit 图标叠加）。**牌面内不画点数/字母/数字/牌点**（v1 铁律）。

## 规格（统一比例 2.5:3.5）
- `card-back.png`：**400×560 不透明**（铺满背纹走不透明，同 ART-01 lobby/game-table 直接 Pillow 裁缩、**不** chroma-key），软萌粉卡通背纹（花/星/纸扇平铺），无字无 logo、可平铺无缝、低视觉噪声不抢手牌。
- `joker-small.png` / `joker-big.png`：**400×560** 整张牌插画，小王=冷调黑白灰+柔蓝薰衣草、大王=暖彩珊瑚草莓粉奶黄（沿用并升级 v1 方向），`#00ff00` 抠角后裁到 400×560 透明画布。
- `card-template.png`：**400×560** 空白牌框底板（奶油面、粉细边、留角标区与中央花色区），透明外区。
- （可选）`suit-spade/heart/club/diamond.png`：**256×256** 升级版，高对比、缩 32px 可辨。

## Prompt 要点
大小王照 v1 joker prompt 升级（路径见上）；牌背强调可平铺无缝、低视觉噪声不抢手牌。

## 验收
- 文件存在、400×560 / 256×256 比例与透明符合；大小王清晰区分；牌面/牌背**无任何点数/字母/牌点/花色字**；抠角干净；`card-template.png` 命名与代码键名一致。
- `source/` 备查原图齐全；`PROMPTS.md`（含确定性脚本说明）可复现；`ART-04-cards.report.md` 落盘。
- 风格与 ART-01/v1 一致。
- 视觉终审归用户；架构验技术规格后置 `in-review`。
