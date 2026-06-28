# ART-01 背景生成（大厅 / 游戏桌面 / 结算面板 · 文生图）

- 状态：ready（美术生成批 #1）
- 派发模式：**Codex 文生图执行者**（worktree·用 `image_gen` 技能 + 后处理脚本）
- 执行分支：`task/art-gen-v2`（ART-01~04 串行同一分支，单执行者保风格一致）
- 输出（**只写预览包，不进 `assets/`**）：`asset-previews/pink-cartoon-production-v2/backgrounds/`
  - `lobby-bg.png`、`game-table-bg.png`、`settlement-panel.png`
  - 同目录落 `PROMPTS.md`（记录每图最终 prompt + 源文件路径 + 后处理步骤，照 v1 格式）
- 依赖：无。与 Track A（编辑器交互）文件域不相交，可并行。
- 工具：Codex 内置 `image_gen`；切图/裁剪用 `$CODEX_HOME/skills/.system/imagegen/scripts/`（参考 v1 `pink-cartoon-production-v1/PROMPTS.md`）。

## 共享美术方向（与 v1 一致，必须遵守）
强休闲单机斗地主、甜美卡通粉。配色：暖奶油、草莓粉、珊瑚粉、柔蓝、薰衣草紫、少量奶黄点缀。柔和圆描边、软萌贴纸感、云朵/星星/花朵/纸扇/卡牌装饰。**禁止**：赌场/博彩氛围、金币/元宝/筹码/现金、强竞技压迫、可读文字/字母/数字/牌点/花色字、logo/水印。

## 规格
- 全屏背景按竖屏 9:19.5 设计，建议 **1080×2340**（PNG，可不透明）。
- `settlement-panel.png` 为结算弹窗底板，建议 **900×1200** 圆角面板，**透明外区**（chroma-key 抠出）。
- 中部出牌区与底部手牌区需留**低纹理高对比**留白带，避免干扰牌面可读性。

## Prompt 模板（每图按 v1 结构字段，full-bleed 背景无需 chroma-key；面板用 #00ff00 chroma-key）
- **lobby-bg**：温馨大厅/牌室入口，云朵纸扇花朵点缀，中部留干净区给标题与按钮；暖奶油+草莓粉+柔蓝。
- **game-table-bg**：休闲牌桌俯视/半俯视，中央出牌区干净高对比、底部手牌带低纹理；避免花哨。
- **settlement-panel**：圆角弹窗底板，顶部缎带/星星装饰，中部大留白给胜负/倍数/得分文字（文字由 Cocos 渲染，图内不含字）；#00ff00 背景便于抠角。

> 详尽字段（Use case/Asset type/Scene/Subject/Style/Composition/Lighting/Color/Constraints）照 v1 `PROMPTS.md` 写，constraints 必含「no text/letters/numbers/rank/suit/logo/watermark/casino/coins」。

## 验收
- 3 文件存在、尺寸/格式/透明符合上表；`settlement-panel` 外区透明、无残留 chroma 边。
- 无可读文字/赌场/金钱元素；风格与 v1 粉卡通一致。
- `PROMPTS.md` 记录可复现（prompt + 源路径 + 后处理）。
- **人工视觉终审归用户**（架构只验技术规格：尺寸/透明/命名/无字检查）；技术过后置 `in-review` 待用户拍板，再考虑导入（导入另开任务，不在本批）。
