# T-C0 asset-keys 资源绑定审计

## 结论

- `RESOURCE_PATHS` 共 58 个键，全部能在 `assets/resources/**` 下找到对应源文件（`.png` / `.wav` / `.otf`）。
- 现有运行时代码只直接加载少量背景、卡面和音频；其余美术键大多是已导入但尚未在 v1 UI 中接入的资源储备，建议保留给 P-G/P-L 的节点命名与资源绑定规范使用。
- SpriteFrame 资源的加载入口保持一致：`lobby-scene.ts` / `game-scene-skeleton.ts` 均经 `spriteFrameResourcePath(path)` 加 `/spriteFrame` 后加载；`cardAssetPath()` / `suitAssetPath()` 返回的路径也由消费方再走同一 SpriteFrame 加载入口。
- 例外正常：`audio*` 为 `AudioClip` 路径，不走 `spriteFrameResourcePath()`；`fontRegular` / `fontHeavy` 为 OTF 字体路径，本轮不上字体；`appIcon` / `splash` 当前只登记资源键，构建/启动图接入不在本任务内。

## 逐键审计

| key | path | 资源文件 | 当前绑定/使用状态 | 结论 |
|---|---|---|---|---|
| `cardTemplate` | `art/cards/card-template` | `card-template.png` | `cardAssetPath()` 普通牌映射；game 侧卡牌加载 fallback | 保留 |
| `cardBack` | `art/cards/card-back` | `card-back.png` | 当前未被运行时消费 | 保留，P-G 可用于牌背/底牌视觉 |
| `suitSpade` | `art/cards/suit-spade` | `suit-spade.png` | `suitAssetPath()` 间接消费 | 保留 |
| `suitHeart` | `art/cards/suit-heart` | `suit-heart.png` | `suitAssetPath()` 间接消费 | 保留 |
| `suitClub` | `art/cards/suit-club` | `suit-club.png` | `suitAssetPath()` 间接消费 | 保留 |
| `suitDiamond` | `art/cards/suit-diamond` | `suit-diamond.png` | `suitAssetPath()` 间接消费 | 保留 |
| `jokerSmall` | `art/cards/joker-small` | `joker-small.png` | `cardAssetPath()` 小王映射 | 保留 |
| `jokerBig` | `art/cards/joker-big` | `joker-big.png` | `cardAssetPath()` 大王映射 | 保留 |
| `lobbyBg` | `art/backgrounds/lobby-bg` | `lobby-bg.png` | lobby 背景直接加载 | 保留；横屏阶段会临时用运行时占位替代竖图拉伸 |
| `gameTableBg` | `art/backgrounds/game-table-bg` | `game-table-bg.png` | game 背景直接加载 | 保留；横屏阶段会临时用运行时占位替代竖图拉伸 |
| `settlementBg` | `art/backgrounds/settlement-bg` | `settlement-bg.png` | 结算弹层直接加载 | 保留 |
| `playerAvatar` | `art/avatars/player-avatar` | `player-avatar.png` | 当前未被运行时消费 | 保留，供 P-G 头像绑定 |
| `aiCheerfulAvatar` | `art/avatars/ai-cheerful-avatar` | `ai-cheerful-avatar.png` | 当前未被运行时消费 | 保留，供 P-G 头像绑定 |
| `aiCalmAvatar` | `art/avatars/ai-calm-avatar` | `ai-calm-avatar.png` | 当前未被运行时消费 | 保留，供 P-G 头像绑定 |
| `landlordRoleAvatar` | `art/avatars/landlord-role-avatar` | `landlord-role-avatar.png` | 当前未被运行时消费 | 保留，供 P-G 身份视觉 |
| `farmerRoleAvatar` | `art/avatars/farmer-role-avatar` | `farmer-role-avatar.png` | 当前未被运行时消费 | 保留，供 P-G 身份视觉 |
| `avatarFrameSet` | `art/avatars/avatar-frame-set` | `avatar-frame-set.png` | 当前未被运行时消费 | 保留，后续可拆分/绑定 |
| `landlordRoleBadge` | `art/avatars/landlord-role-badge` | `landlord-role-badge.png` | 测试登记，运行时未直接消费 | 保留，供 P-G |
| `farmerRoleBadge` | `art/avatars/farmer-role-badge` | `farmer-role-badge.png` | 测试登记，运行时未直接消费 | 保留，供 P-G |
| `avatarFrame` | `art/avatars/avatar-frame` | `avatar-frame.png` | 测试登记，运行时未直接消费 | 保留，供 P-G |
| `buttonSet` | `art/ui/button-set` | `button-set.png` | 当前未被运行时消费 | 保留，P-L/P-G 可用于按钮视觉 |
| `panelSet` | `art/ui/panel-set` | `panel-set.png` | 当前未被运行时消费 | 保留，P-L/P-G 可用于面板视觉 |
| `statusBadges` | `art/ui/status-badges` | `status-badges.png` | 当前未被运行时消费 | 保留 |
| `actionIcons` | `art/ui/action-icons` | `action-icons.png` | 当前未被运行时消费 | 保留 |
| `buttonPrimary` | `art/ui/btn-primary` | `btn-primary.png` | 测试登记，运行时未直接消费 | 保留，供按钮化阶段 |
| `buttonSecondary` | `art/ui/btn-secondary` | `btn-secondary.png` | 测试登记，运行时未直接消费 | 保留，供按钮化阶段 |
| `buttonDisabled` | `art/ui/btn-disabled` | `btn-disabled.png` | 测试登记，运行时未直接消费 | 保留，供按钮化阶段 |
| `iconPlay` | `art/ui/icon-play` | `icon-play.png` | 测试登记，运行时未直接消费 | 保留，供按钮化阶段 |
| `iconPass` | `art/ui/icon-pass` | `icon-pass.png` | 测试登记，运行时未直接消费 | 保留，供按钮化阶段 |
| `iconHint` | `art/ui/icon-hint` | `icon-hint.png` | 测试登记，运行时未直接消费 | 保留，供按钮化阶段 |
| `iconBid` | `art/ui/icon-bid` | `icon-bid.png` | 测试登记，运行时未直接消费 | 保留，供叫抢按钮 |
| `iconBack` | `art/ui/icon-back` | `icon-back.png` | 测试登记，运行时未直接消费 | 保留，供返回按钮 |
| `iconSettings` | `art/ui/icon-settings` | `icon-settings.png` | 测试登记，运行时未直接消费 | 保留，供设置入口 |
| `badgeMultiplier` | `art/ui/badge-multiplier` | `badge-multiplier.png` | 测试登记，运行时未直接消费 | 保留，供 HUD |
| `badgeTurn` | `art/ui/badge-turn` | `badge-turn.png` | 测试登记，运行时未直接消费 | 保留，供 HUD |
| `badgeCountdownRing` | `art/ui/badge-countdown-ring` | `badge-countdown-ring.png` | 测试登记，运行时未直接消费 | 保留，供计时视觉 |
| `emphasisBomb` | `art/ui/emphasis-bomb` | `emphasis-bomb.png` | 测试登记，运行时未直接消费 | 保留，供事件强调 |
| `emphasisRocket` | `art/ui/emphasis-rocket` | `emphasis-rocket.png` | 测试登记，运行时未直接消费 | 保留，供事件强调 |
| `emphasisSpring` | `art/ui/emphasis-spring` | `emphasis-spring.png` | 测试登记，运行时未直接消费 | 保留，供结算强调 |
| `panelPopup` | `art/ui/panel-popup` | `panel-popup.png` | 测试登记，运行时未直接消费 | 保留，供弹层 |
| `splash` | `art/misc/splash` | `splash.png` | 测试登记，运行时未直接消费 | 保留；构建启动图例外 |
| `appIcon` | `art/misc/app-icon` | `app-icon.png` | 测试登记，运行时未直接消费 | 保留；应用图标例外 |
| `emptyRecords` | `art/misc/empty-records` | `empty-records.png` | 测试登记，运行时未直接消费；与 data 层 `emptyRecords()` 同名但无路径冲突 | 保留，供 P-L 空态 |
| `settlementWinBadge` | `art/misc/badge-win` | `badge-win.png` | 测试登记，运行时未直接消费 | 保留，供结算 |
| `settlementLoseBadge` | `art/misc/badge-lose` | `badge-lose.png` | 测试登记，运行时未直接消费 | 保留，供结算 |
| `audioDeal` | `audio/deal` | `deal.wav` | `cueAudioPath('deal')` 间接消费 | 保留；AudioClip 例外 |
| `audioSelect` | `audio/select` | `select.wav` | 当前未被运行时消费 | 保留，供手牌按压/选择音效 |
| `audioPlay` | `audio/play` | `play.wav` | `cueAudioPath('play')` 间接消费 | 保留；AudioClip 例外 |
| `audioPass` | `audio/pass` | `pass.wav` | `cueAudioPath('pass')` 间接消费 | 保留；AudioClip 例外 |
| `audioBomb` | `audio/bomb` | `bomb.wav` | `cueAudioPath('bomb')` 间接消费 | 保留；AudioClip 例外 |
| `audioRocket` | `audio/rocket` | `rocket.wav` | `cueAudioPath('rocket')` 间接消费 | 保留；AudioClip 例外 |
| `audioWin` | `audio/win` | `win.wav` | `cueAudioPath('win')` 间接消费 | 保留；AudioClip 例外 |
| `audioLose` | `audio/lose` | `lose.wav` | 当前未被运行时消费 | 保留，供结算失败音效 |
| `audioButton` | `audio/button` | `button.wav` | 测试登记，运行时未直接消费 | 保留，供按钮化阶段 |
| `fontRegular` | `fonts/SourceHanSansCN-Regular` | `SourceHanSansCN-Regular.otf` | 已导入，当前 Label 未引用 | 保留；本轮不上字体 |
| `fontHeavy` | `fonts/SourceHanSansCN-Heavy` | `SourceHanSansCN-Heavy.otf` | 已导入，当前 Label 未引用 | 保留；本轮不上字体 |

## SpriteFrame 加载规范

- 必须走 `spriteFrameResourcePath()` 的资源：所有 `.png` SpriteFrame 资源，包括 cards/backgrounds/avatars/ui/misc。
- 当前代码路径：
  - `lobby-scene.ts`：`loadSprite(RESOURCE_PATHS.lobbyBg, ...)` → `spriteFrameResourcePath(path)`。
  - `game-scene-skeleton.ts`：背景、结算背景、卡面、花色图标均通过 `loadSprite()` → `spriteFrameResourcePath(path)`。
  - `cardAssetPath()` / `suitAssetPath()` 只返回资源路径，不直接加载；加载仍由消费方统一处理。

## 正常例外

- `audioDeal/audioSelect/audioPlay/audioPass/audioBomb/audioRocket/audioWin/audioLose/audioButton`：音频资源，Cocos 用 `resources.load(path, AudioClip)`，不加 `/spriteFrame`。
- `fontRegular/fontHeavy`：OTF 字体资源，当前未接入 Label；本轮只登记状态。
- `appIcon/splash`：构建/启动资源，当前仅作为资源键登记，不代表运行时 SpriteFrame 消费。

## 给 P-G / P-L 的建议

- P-G/P-L 做运行时节点命名和资源绑定时，优先复用已登记键，不要新增同义键。
- 横屏占位阶段不要直接拉伸 `lobbyBg/gameTableBg` 作为验收背景；待横图 ready 后再恢复或替换资源绑定。
- 字体键已存在但未消费，本轮不要宣称字体优化闭合；若后续上字体，建议在统一 Label helper 或组件入口集中接入。
