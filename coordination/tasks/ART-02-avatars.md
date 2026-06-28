# ART-02 头像与身份徽章生成（玩家 / 两 AI / 地主农民 / 头像框 · 文生图）

- 状态：**ready**（ART-01 风格锚 `a181d45` 已被用户采纳并并 main；同 `task/art-gen-v2` 串行 #2）
- 派发模式：Codex 文生图执行者（worktree·`image_gen` + #00ff00 chroma-key 后处理）
- 输出（**只写预览包**，**不进 `assets/`**）：`asset-previews/pink-cartoon-production-v2/avatars/`
  - `player-avatar.png`、`ai-cheerful-avatar.png`、`ai-calm-avatar.png`、`landlord-role-badge.png`、`farmer-role-badge.png`、`avatar-frame.png`
  - `source/` 子目录：每张 `image_gen` 原图复制进 `avatars/source/<name>-source.png` 备查（镜像 ART-01 `backgrounds/source/` 做法）
  - 同目录 `PROMPTS.md`（含每图 prompt 全文 + 源路径 + 后处理步骤，可复现）
  - `coordination/reports/ART-02-avatars.report.md`（技术验收记录，照 `coordination/templates/report.md`）
- 风格锚（**具体引用**）：`asset-previews/pink-cartoon-production-v2/backgrounds/PROMPTS.md` 的 **Shared Art Direction**（甜美卡通粉、软萌贴纸、禁赌场/金钱/文字/logo）+ 各图的 Color palette / Constraints 行，是本任务每图 prompt 的风格基准。
- v1 可复用 prompt 来源（**显式路径**）：升级自 `asset-previews/pink-cartoon-avatars-v1/PROMPTS.md` 的 `player-avatar` / `ai-cheerful-avatar` / `ai-calm-avatar` / `avatar-frame-set` 四图 prompt。
- 工具：同 ART-01——`image_gen` 出图 → 复制进 `source/` → `#00ff00` chroma-key + `remove_chroma_key.py` 抠透明 → Pillow 裁 alpha 边/缩放到目标画布。全程零 `cc` import、零测试、不进 `assets/`、不手写 `.meta`。
- **提交注意**：`asset-previews/` 被 `.gitignore` 忽略（`:35`），完成后必须用 `git add -f asset-previews/pink-cartoon-production-v2/avatars/ coordination/reports/ART-02-avatars.report.md` 提交，否则生成成功但提交不含资产（照 ART-01 `a181d45` 先例）。

## 共享美术方向
同 ART-01（甜美卡通粉、软萌贴纸、禁赌场/金钱/文字/logo）。头像为半身/头部吉祥物，性格区分：cheerful=活泼暖色、calm=温和冷调、player=中性友好。身份徽章=可叠加在头像角的小图标（地主=皇冠/纸扇王座意象但**非金币宝座**；农民=草帽/锄头/麦穗软萌意象），**不含「地主/农民」汉字**（文字由 Cocos 渲染）。

## 命名与语义厘清（导入阶段前置约束）
- 本任务的 `landlord-role-badge.png` / `farmer-role-badge.png`（128×128）是**新增的角标徽章小图标**，与 v1 的 `landlord-role-avatar` / `farmer-role-avatar`（整张角色头像，代码 `assets/scripts/ui/asset-keys.ts` 用此键）**语义不同**。
- 本任务**只产出 badge 小图标，不升级 role-avatar 整张头像**（role-avatar 升级留后续导入对齐任务）。若执行者认为需要同时升级 role-avatar，须在 `PROMPTS.md` 与 report 中显式标注并补充 256×256 整张头像输出，不得与现有 `asset-keys.ts` 键名歧义。

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
- `source/` 备查原图齐全；`PROMPTS.md` 可复现；`ART-02-avatars.report.md` 落盘。
- 风格与 ART-01/v1 一致。
- 视觉终审归用户；架构验技术规格后置 `in-review`。
