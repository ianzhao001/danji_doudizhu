# 资源清单

## 本期说明

本文件记录资源需求、已采纳资源和预览资源包，便于美术、音频和开发协作。预览资源默认放在 `asset-previews/`，未经过人工评审前不直接进入 Cocos `assets/`。

当前美术方向：强休闲、娱乐型单机斗地主。整体可偏甜美卡通粉色，但应减少金钱元素和竞技压迫感，避免金币、元宝、筹码、赌场、博彩或强竞技氛围。优先使用纸扇、云朵、彩带、星星、花朵、软萌卡牌装饰等轻松元素。

## 已采纳资源

以下资源已按用户确认作为 M0 例外项导入 Cocos 项目资源区。资源仍是概念预览级 PNG，后续正式上线前需要继续做透明切图、压缩、图集整理和 Cocos 导入参数确认。

- 背景资源：`assets/resources/art/backgrounds/lobby-bg.png`、`assets/resources/art/backgrounds/game-table-bg.png`、`assets/resources/art/backgrounds/settlement-bg.png`
- 牌背资源：`assets/resources/art/cards/card-back.png`
- UI 资源：`assets/resources/art/ui/button-set.png`、`assets/resources/art/ui/panel-set.png`、`assets/resources/art/ui/status-badges.png`、`assets/resources/art/ui/action-icons.png`
- 头像资源：`assets/resources/art/avatars/player-avatar.png`、`assets/resources/art/avatars/ai-cheerful-avatar.png`、`assets/resources/art/avatars/ai-calm-avatar.png`、`assets/resources/art/avatars/landlord-role-avatar.png`、`assets/resources/art/avatars/farmer-role-avatar.png`、`assets/resources/art/avatars/avatar-frame-set.png`

预览源与提示词仍保留在 `asset-previews/`，其中 `pink-cartoon-v2` 和 `pink-cartoon-ui-v1` 的 B 方案为当前采纳方向。

## 已采纳预览资源包

`asset-previews/pink-cartoon-production-v1/` 已由用户采纳为当前牌面、音效和字体素材基准，仍不是正式 Cocos 导入包。

- 牌面预览：`cards/card-template.png`、四个 `suit-*.png`、`joker-small.png`、`joker-big.png`
- 音效源：`audio/wav/deal.wav`、`select.wav`、`play.wav`、`pass.wav`、`bomb.wav`、`rocket.wav`、`win.wav`、`lose.wav`、`button.wav`
- 字体：Source Han Sans CN Regular / Heavy 与 `LICENSE-SourceHanSans.txt`
- 说明文档：`MANIFEST.md`、`PROMPTS.md`

后续进入导入阶段时，建议导入路径为 `assets/resources/art/cards/`、`assets/resources/audio/` 和 `assets/resources/fonts/`。本轮不执行导入、不生成 mp3/ogg、不处理 UI 拼版切图。

## 扑克牌

需求：

- 54 张正面牌。
- 1 张背面牌。
- 小王和大王需要清晰区分。
- 牌面在手机竖屏手牌区域缩小时仍可辨认。

建议规格：

- 统一宽高比例。
- 支持透明背景或统一圆角矩形底。
- 后续可按单张图或图集导入。
- 牌面渲染数据驱动：点数+花色 → 图集帧查表，替换图集不改代码接口。

## 桌面与背景

需求：

- 游戏桌面背景。
- 大厅背景。
- 结算弹窗背景或面板样式。

设计方向：

- 以休闲棋牌桌面为主，避免过度花哨。
- 中部出牌区域需要有足够对比度。
- 底部手牌区域不能被背景纹理干扰。
- 少用金钱、财富、竞技、赌场相关符号。

## UI 元素

需求：

- 主按钮：开始、出牌、提示、不要、叫地主、抢地主、继续、返回。
- 状态标识：地主、农民、当前回合、倍数、倒计时。
- 弹窗：设置、结算、确认重开。

## 音效

需求：

- 发牌。
- 选牌。
- 出牌。
- 不要。
- 炸弹。
- 火箭。
- 胜利。
- 失败。
- 按钮点击。

## 字体

需求：

- 支持中文。
- 数字和牌面文字清晰。
- 移动端小字号下可读。

## 动画

需求：

- 发牌动画。
- 出牌动画。
- 炸弹/火箭强调动画。
- 结算弹窗出现动画。
- 按钮点击反馈。

## 资源验收

- [ ] 手机竖屏小尺寸下可读。
- [ ] 文件命名清晰。
- [ ] 可被 Cocos Creator 正常导入。
- [ ] 资源授权明确。
- [ ] 替换占位资源时不影响代码接口。
