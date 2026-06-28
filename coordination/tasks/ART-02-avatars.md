# ART-02 头像与身份徽章生成（玩家 / 两 AI / 地主农民 / 头像框 · 文生图）

- 状态：blocked（待 ART-01 起风格锚；同 `task/art-gen-v2` 串行 #2）
- 派发模式：Codex 文生图执行者（worktree·`image_gen` + chroma-key 后处理）
- 输出（**只写预览包**）：`asset-previews/pink-cartoon-production-v2/avatars/`
  - `player-avatar.png`、`ai-cheerful-avatar.png`、`ai-calm-avatar.png`、`landlord-role-badge.png`、`farmer-role-badge.png`、`avatar-frame.png`
  - 同目录 `PROMPTS.md`
- 依赖：ART-01（风格锚）。
- 工具：同 ART-01。

## 共享美术方向
同 ART-01（甜美卡通粉、软萌贴纸、禁赌场/金钱/文字/logo）。头像为半身/头部吉祥物，性格区分：cheerful=活泼暖色、calm=温和冷调、player=中性友好。身份徽章=可叠加在头像角的小图标（地主=皇冠/纸扇王座意象但**非金币宝座**；农民=草帽/锄头/麦穗软萌意象），**不含「地主/农民」汉字**（文字由 Cocos 渲染）。

## 规格
- 头像：**256×256** 透明 PNG（chroma-key 抠出），头部居中、留边、清晰剪影、缩到 64×64 仍可辨。
- 身份徽章：**128×128** 透明小图标。
- 头像框：**256×256** 透明圆/圆角描边框（中空，叠加在头像上）。

## Prompt 要点（每图按 v1 结构字段 + #00ff00 chroma-key）
- player：友好中性吉祥物头像，奶油+柔蓝。
- ai-cheerful：活泼咧嘴吉祥物，珊瑚/草莓粉、奶黄。
- ai-calm：温和微笑吉祥物，柔蓝/薰衣草。
- landlord-role-badge：软萌皇冠/纸扇王座意象徽章（无金币、无金属财宝、无字）。
- farmer-role-badge：软萌草帽/麦穗意象徽章（无字）。
- avatar-frame：圆角描边相框，粉色细边+小星花点缀，中空透明。

> constraints 必含「no text/letters/numbers/logo/watermark/casino/coins/ingots/chips」；身份意象避免金钱与赌场。

## 验收
- 6 文件存在、尺寸/透明/命名符合；抠角干净无残边；缩小可辨；性格/身份区分明显且无汉字。
- 风格与 ART-01/v1 一致；`PROMPTS.md` 可复现。
- 视觉终审归用户；架构验技术规格后置 `in-review`。
