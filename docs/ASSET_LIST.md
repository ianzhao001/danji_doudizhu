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

## v1.5 · ART-V15 包(2026-07-12 入库)

生成:Codex(方向稿 v3 用户签收→检查点 B 委托代验);导入:`assets/resources/art/ui`(8)+新 `assets/resources/art/fx`(5);meta=Creator CLI 生成后翻 sprite-frame,9-slice 薄环校准(btn L/R18·T/B14,pill 14/10,panel 四向 56)。

| 键 | 路径 | 用途 |
|---|---|---|
| btnPrimaryV15/btnSecondaryV15/btnTertiaryV15/btnDisabledV15 | art/ui/btn-*-v15 | 两场景按钮四态(中央 64%×56% 纯净文字盘硬门) |
| infoPillV15 | art/ui/info-pill-v15 | 状态条/AI 思考/过牌行药丸 |
| seatNameplateV15 | art/ui/seat-nameplate-v15 | 三席名牌 |
| bottomCardsDockV15 | art/ui/bottom-cards-dock-v15 | 底牌三槽托盘(槽距 71.5/313,消费端反推 131×56) |
| panelPopupV15 | art/ui/panel-popup-v15 | 两场景弹窗/大厅面板 |
| fxSpark/fxRing/fxStar/fxTrail | art/fx/fx-* | 程序化特效贴图(涟漪/爆点/星爆;packable=false) |
| fxConfetti | art/fx/fx-confetti | 胜局彩带 4×2 图集(trimType=none 保 128px 格,运行时裁格) |

预览包与 manifest(SHA-256)存 `asset-previews/v15-visual-upgrade/`(gitignored,本机);v13/v1 键全保留可回滚。

## v1.6 · ART-V16 结算包 + 三补音(2026-07-12 入库)

生成:Codex(单 gate,用户委托规划执行者复核 approved);导入:`assets/resources/art/ui`(3);meta=CLI 生成+手改+重导三趟法(面板 capInsets 四向 56·trim auto 以可见缘 744×364 计;双横幅 trimType=none 保 640×108 全框,恰为显示框 320×54 的 2×,零几何失真)。

| 键 | 路径 | 用途 |
|---|---|---|
| settlementPanelV15 | art/ui/settlement-panel-v15 | 结算面板底 760×380(sliced,胜败共用;中央纯净供代码叠加标题/横幅/分数板/按钮) |
| settlementBannerWinV15 | art/ui/settlement-banner-win-v15 | 胜利横幅 640×108(原生 5.93:1 修 v13 压扁;右端 15% 让位春天 stamp) |
| settlementBannerLoseV15 | art/ui/settlement-banner-lose-v15 | 失败横幅 640×108(与胜同构,低饱和灰蓝紫) |

音频(T-CUE-AUDIO,音频解禁裁决 2026-07-12):`assets/resources/audio/` 增 redeal.wav(0.35s)/reset.wav(0.22s)/landlord.wav(0.55s),44.1kHz mono Int16 峰值 23592 与存量归一一致,landlord RMS 压 win 之下;合成器 `coordination/scripts/v16-audio-synth.py`(标准库+LCG 定值种子,重跑逐字节一致)。音频键 12:12。

预览包与 manifest(SHA-256)存 `asset-previews/v16-settlement/`(gitignored,本机);v13 结算三键保留仅作回滚。

## v1.7 · ART-V20 按钮族(2026-07-15 用户驳回·rollback-only)

生成:Codex ImageGen 四态独立出图,经 chroma-key 去底与三段归一整理为 480×160;导入:`assets/resources/art/ui`(4)。`.meta` 由 Cocos Creator 3.8.8 资产数据库生成并二次重导,未手写;SpriteFrame trim rect 均为 `(7,5,466,149)`,九宫格 capInsets 均为 L/R48·T44·B48,trim auto,走 scale-safe 渲染。

| 键 | 路径 | 用途 |
|---|---|---|
| btnPrimaryV20 | art/ui/btn-primary-v20 | 主题莓粉高饱和主操作；深莓字 |
| btnSecondaryV20 | art/ui/btn-secondary-v20 | 奶油/柔灰次操作；深莓字 |
| btnTertiaryV20 | art/ui/btn-tertiary-v20 | 暖金提示/强调操作；深棕字 |
| btnDisabledV20 | art/ui/btn-disabled-v20 | 低饱和灰粉禁用态；灰莓字 |

共同艺术方向:奶油拟物 candy 风,多段柔渐变+顶部高光带+底部内阴影+贴边细描金+柔和外投影;中央净区不画线。五视口实机机检虽全绿,用户仍明确裁决“太丑、不可接受”，故四键与 PNG/meta 仅保留 rollback-only，产品零消费。

## v1.7 · ART-V21 参考图游戏按钮族(2026-07-15 R4 临时色值·终局待修)

生成:Codex ImageGen 根据用户上传的斗地主截图抽取按钮规范，去字后生成四态同构底图，经 chroma-key 去底、同色阴影校正与三段归一为 480×160。R3 用户确认式样 okay、仅驳回颜色后，R4 再以截图“叫地主/不叫”双钮为唯一色彩参考，只迁移逐行 hue/saturation 到已签 R3 像素；四态 alpha 与 HSV value 场逐像素不变，因此轮廓、圆角、高光、底唇和阴影几何零变化。导入:`assets/resources/art/ui`(4)；`.meta` 仍为 Creator 生成字节，未手写且 R4 前后 SHA 不变。SpriteFrame trim rect 均为 `(7,5,466,149)`，capInsets 为 L/R64·T46·B54，走 scale-safe 九宫格。

| 键 | 路径 | 用途 |
|---|---|---|
| btnPrimaryV21 | art/ui/btn-primary-v21 | 截图暖黄橙主操作；深棕字 `#4A1800` |
| btnSecondaryV21 | art/ui/btn-secondary-v21 | 截图天蓝到蓝紫次操作；深蓝黑字 `#040A16` |
| btnTertiaryV21 | art/ui/btn-tertiary-v21 | 同源暖黄橙强调/提示；深棕字 `#4A2700` |
| btnDisabledV21 | art/ui/btn-disabled-v21 | 低饱和蓝灰禁用态；深蓝灰字 `#0D111C` |

共同艺术方向:参考图的塑胶游戏感，规则厚圆角+上半柔高光+下半渐深+同色底唇/投影+贴边细内泽；不再沿用 v20 的奶油粉与金边语言。R4 中心带临时值:primary 由 `#FCD12A` 过渡到 `#FA9011`，secondary 由 `#3CB0F9` 过渡到 `#4869F4`；tertiary 同暖橙族，disabled 从蓝紫去饱和。五视口真档门虽全绿，但用户明确未签该色值；它只作为 S5/S6 继续开发的临时基线，终局前必须再调。
