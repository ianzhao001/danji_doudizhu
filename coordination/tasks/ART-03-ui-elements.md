# ART-03 UI 元素生成（按钮 / 状态徽章 / 弹窗面板 · 文生图）

- 状态：**ready**（ART-01 风格锚 `a181d45` 已被用户采纳并并 main；同 `task/art-gen-v2` 串行 #3）
- 派发模式：Codex 文生图执行者（worktree·`image_gen` + #00ff00 chroma-key 后处理）
- 输出（**只写预览包**，**不进 `assets/`**）：`asset-previews/pink-cartoon-production-v2/ui/`
  - 按钮底板（**无字**，文字 Cocos 渲染）：`btn-primary.png`、`btn-secondary.png`、`btn-disabled.png`（每文件一张独立透明 sprite）
  - 动作图标：`icon-play.png`、`icon-pass.png`、`icon-hint.png`、`icon-bid.png`、`icon-back.png`、`icon-settings.png`
  - 状态徽章底板（无字）：`badge-multiplier.png`、`badge-turn.png`、`badge-countdown-ring.png`、`emphasis-bomb.png`、`emphasis-rocket.png`、`emphasis-spring.png`
  - 弹窗面板：`panel-popup.png`（设置/确认重开通用底板）
  - `source/` 子目录：每张 `image_gen` 原图复制进 `ui/source/<name>-source.png` 备查
  - 同目录 `PROMPTS.md`（含每图 prompt 全文 + 源路径 + 后处理步骤，可复现）
  - `coordination/reports/ART-03-ui-elements.report.md`（技术验收记录）
- 风格锚（**具体引用**）：`asset-previews/pink-cartoon-production-v2/backgrounds/PROMPTS.md` 的 **Shared Art Direction**（甜美卡通粉、软萌贴纸、禁赌场/金钱/文字/logo）+ 各图 Color palette / Constraints 行。
- v1 可复用 prompt 来源（**显式路径**）：升级自 `asset-previews/pink-cartoon-ui-v1/PROMPTS.md` + `SELECTED.md`（采纳方向为 variant B）。**注意关键升级**：v1 生成的是多图概念板（每图 8–12 元素网格），**本批要求每文件一张独立透明 sprite**（如 `btn-primary.png` 单图 + `#00ff00` chroma-key 抠出），**勿沿用 v1 板式 prompt**——每张必须单独出图。
- 工具：同 ART-01——`image_gen` 出单图 → 复制进 `source/` → `#00ff00` chroma-key + `remove_chroma_key.py` 抠透明 → Pillow 裁 alpha 边/缩放到目标画布。全程零 `cc`、零测试、不进 `assets/`、不手写 `.meta`。

## 共享美术方向
同 ART-01（甜美卡通粉、软萌贴纸、禁赌场/金钱/文字/logo）。按钮=圆角软糖质感底板（primary 草莓粉、secondary 柔蓝/奶油、disabled 灰粉去饱和）；图标=简洁高辨识线面结合；徽章=小巧圆润。**按钮与徽章一律不含文字**（文字层 Cocos 加）。

## 规格
- 按钮底板：**240×96** 透明 PNG，圆角，**预留九宫格可拉伸**（四角圆角、中部可平铺）；三态（primary/secondary/disabled）视觉一致仅配色/明度变化。
- 动作图标：**96×96** 透明，缩到 32×32 可辨（出牌=扑克扇出、不要=摆手/叉、提示=灯泡/星、叫抢=皇冠/手势、返回=箭头、设置=齿轮花）。
- 状态徽章：**128×128** 透明（倍数=星形徽章、当前回合=指针/箭头光环、倒计时=圆环进度底）；强调徽章 bomb/rocket/spring=爆裂/火箭/花朵缎带软萌特效贴纸。
- 弹窗面板：**900×1100** 圆角透明面板底板。

## 九宫格切片参数说明
本批输出的是**已切好的独立透明 sprite**（每文件一张图）。九宫格切片参数（按钮中部平铺区四周边距）**留后续导入任务**登记，与本批单图输出不冲突——本批只负责产出干净透明 sprite，导入时再标九宫格边距。

## Prompt 要点
每图按 v1 结构字段 + #00ff00 chroma-key 抠出；constraints 必含「no text/letters/numbers/rank/suit/logo/watermark/casino/coins」。三态按钮用同一 prompt 改 color palette 行。

## 验收
- 全部文件存在、尺寸/透明/命名符合；图标缩 32px 可辨；按钮三态成套且无字；抠角干净。
- `source/` 备查原图齐全；`PROMPTS.md` 可复现；`ART-03-ui-elements.report.md` 落盘。
- 风格与 ART-01/v1 一致。
- 视觉终审归用户；架构验技术规格后置 `in-review`。
