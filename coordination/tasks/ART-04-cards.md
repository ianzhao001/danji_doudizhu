# ART-04 牌面精修（牌背 / 大小王 / 牌框底板 · 文生图）

- 状态：blocked（待 ART-01；同 `task/art-gen-v2` 串行 #4）
- 派发模式：Codex 文生图执行者（worktree·`image_gen` + chroma-key；确定性底板可 Python/Pillow）
- 输出（**只写预览包**）：`asset-previews/pink-cartoon-production-v2/cards/`
  - `card-back.png`、`joker-small.png`、`joker-big.png`、`card-frame.png`（可选精修：`suit-*.png` 升级版）
  - 同目录 `PROMPTS.md`
- 依赖：ART-01。
- 工具：插画类（牌背/大小王）用 `image_gen` + chroma-key；几何底板（card-frame/suit）可 Python+Pillow 确定性生成（照 v1 做法）。

## 背景与边界
牌面渲染**数据驱动**：点数+花色 → 图集帧/文字叠加（`card-view` 已给 `assetKey`/`rankLabel`/`suitKey`）。故**不需要逐张 54 面手绘**；本任务只精修：① 牌背、② 大小王整张插画、③ 空白牌框底板（点数/花色由 Cocos 文字+suit 图标叠加）。**牌面内不画点数/字母/数字/牌点**（v1 铁律）。

## 规格（统一比例 2.5:3.5）
- `card-back.png`：**400×560** 不透明或圆角透明，软萌粉卡通背纹（花/星/纸扇平铺），无字无 logo。
- `joker-small.png` / `joker-big.png`：**400×560** 整张牌插画，小王=冷调黑白灰+柔蓝薰衣草、大王=暖彩珊瑚草莓粉奶黄（沿用并升级 v1 方向），#00ff00 抠角后裁到 400×560 透明画布。
- `card-frame.png`：**400×560** 空白牌框底板（奶油面、粉细边、留角标区与中央花色区），透明外区。
- （可选）`suit-spade/heart/club/diamond.png`：**256×256** 升级版，高对比、缩 32px 可辨。

## Prompt 要点
大小王照 v1 `PROMPTS.md` 的 joker prompt 升级（保「2.5:3.5 单张牌、居中、无字无牌点、#00ff00 纯背景、无投影」约束）；牌背强调可平铺无缝、低视觉噪声不抢手牌。

## 验收
- 文件存在、400×560 / 256×256 比例与透明符合；大小王清晰区分；牌面/牌背**无任何点数/字母/牌点/花色字**；抠角干净。
- 风格与 ART-01/v1 一致；`PROMPTS.md`（含确定性脚本说明）可复现。
- 视觉终审归用户；架构验技术规格后置 `in-review`。
