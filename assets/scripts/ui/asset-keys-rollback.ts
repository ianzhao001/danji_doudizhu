/**
 * v1.6 审计裁决 P1-2:退役资产键物理隔离——键与文件保留仅作回滚,产品零消费。
 * 机检门 test/architecture-gates.test.ts 门④断言这些键名除本文件与 asset-keys.ts 外
 * 在 assets/scripts 零出现(含 RUNTIME_PRELOAD_SPRITES 预载表与一切 resources.load)。
 * 回滚姿势:把所需键搬回 asset-keys.ts 的 RESOURCE_PATHS 并接回消费点,同批更新门④清单。
 * 对应 PNG/meta 仍在 assets/resources 原位保留。
 * 注意:bottomCardsDockV15 仍是活跃皮肤键,不在此列。
 */
export const ROLLBACK_RESOURCE_PATHS = {
  // W-VISION S4R-R2 用户裁决:卡面回滚 v13；v19 卡系保留仅作回滚。
  cardTemplate: 'art/cards/card-template',
  cardBack: 'art/cards/card-back',
  suitSpade: 'art/cards/suit-spade',
  suitHeart: 'art/cards/suit-heart',
  suitClub: 'art/cards/suit-club',
  suitDiamond: 'art/cards/suit-diamond',
  jokerSmall: 'art/cards/joker-small',
  jokerBig: 'art/cards/joker-big',
  cardTemplateV19: 'art/cards/card-template-v19',
  cardBackV19: 'art/cards/card-back-v19',
  cardSelectedFrameV19: 'art/cards/card-selected-frame-v19',
  suitSpadeV19: 'art/cards/suit-spade-v19',
  suitHeartV19: 'art/cards/suit-heart-v19',
  suitClubV19: 'art/cards/suit-club-v19',
  suitDiamondV19: 'art/cards/suit-diamond-v19',
  jokerSmallV19: 'art/cards/joker-small-v19',
  jokerBigV19: 'art/cards/joker-big-v19',
  // W-VISION-COLOR-R2-d:c2 rim 接管按钮，c1 按钮保留仅作回滚。
  btnPrimaryC1: 'art/ui/btn-primary-c1',
  btnSecondaryC1: 'art/ui/btn-secondary-c1',
  btnNeutralC1: 'art/ui/btn-neutral-c1',
  // W-VISION-COLOR:c1 配色全场接管，v21 按钮及旧牌桌/药丸/名牌/托盘仅作回滚。
  btnPrimaryV21: 'art/ui/btn-primary-v21',
  btnSecondaryV21: 'art/ui/btn-secondary-v21',
  btnTertiaryV21: 'art/ui/btn-tertiary-v21',
  btnDisabledV21: 'art/ui/btn-disabled-v21',
  gameTableBgV13: 'art/backgrounds/game-table-bg-v13',
  playTrayV19: 'art/ui/play-tray-v19',
  playTrayC1: 'art/ui/play-tray-c1',
  infoPillV19: 'art/ui/info-pill-v19',
  seatNameplateV19: 'art/ui/seat-nameplate-v19',
  // W-VISION S4R-R3 用户签收驳回:v20 美术不可接受，仅保留回滚。
  btnPrimaryV20: 'art/ui/btn-primary-v20',
  btnSecondaryV20: 'art/ui/btn-secondary-v20',
  btnTertiaryV20: 'art/ui/btn-tertiary-v20',
  btnDisabledV20: 'art/ui/btn-disabled-v20',
  // W-VISION S4R-R2 用户裁决:v20 曾接管全场景，v19 按钮族退役。
  btnPrimaryV19: 'art/ui/btn-primary-v19',
  btnSecondaryV19: 'art/ui/btn-secondary-v19',
  btnTertiaryV19: 'art/ui/btn-tertiary-v19',
  btnDisabledV19: 'art/ui/btn-disabled-v19',
  // v1.6 终审整改①退役:v15 异形花瓣端头按钮族(用户点名"不要异形形状")。
  btnPrimaryV15: 'art/ui/btn-primary-v15',
  btnSecondaryV15: 'art/ui/btn-secondary-v15',
  btnTertiaryV15: 'art/ui/btn-tertiary-v15',
  btnDisabledV15: 'art/ui/btn-disabled-v15',
  // v1.6 二次终审整改退役:v17 多层描边按钮族(盖字底图=单一填充+至多一条细描边)。
  btnPrimaryV17: 'art/ui/btn-primary-v17',
  btnSecondaryV17: 'art/ui/btn-secondary-v17',
  btnTertiaryV17: 'art/ui/btn-tertiary-v17',
  btnDisabledV17: 'art/ui/btn-disabled-v17',
  // v1.6 二次终审整改退役:v15 信息条/席位名牌(换 v18 极简族)。
  infoPillV15: 'art/ui/info-pill-v15',
  seatNameplateV15: 'art/ui/seat-nameplate-v15',
  // W-VISION S4 退役:v18 极简族由同门更完整的 v19 族接替。
  btnPrimaryV18: 'art/ui/btn-primary-v18',
  btnSecondaryV18: 'art/ui/btn-secondary-v18',
  btnTertiaryV18: 'art/ui/btn-tertiary-v18',
  btnDisabledV18: 'art/ui/btn-disabled-v18',
  infoPillV18: 'art/ui/info-pill-v18',
  seatNameplateV18: 'art/ui/seat-nameplate-v18',
  // v1.6 二次终审整改退役:v15 燕尾缎带结算横幅(异形,改 v18 牌匾零新图)。
  settlementBannerWinV15: 'art/ui/settlement-banner-win-v15',
  settlementBannerLoseV15: 'art/ui/settlement-banner-lose-v15',
  // v1.6 ART-V16 退役:结算 v13 三键(面板底/胜负横幅全套换 v15)。
  settlementPanelV13: 'art/ui/settlement-panel-v13',
  settlementBannerWinV13: 'art/ui/settlement-banner-win-v13',
  settlementBannerLoseV13: 'art/ui/settlement-banner-lose-v13',
  // v1.6 终审整改①退役:暂停 toggle/action 专皮(统一走 v18 按钮族)。
  pauseBtnToggle: 'art/ui/pause-btn-toggle',
  pauseBtnAction: 'art/ui/pause-btn-action',
  // W-VISION S4 退役:旧面板、计时徽标与特效族。
  panelPopupV15: 'art/ui/panel-popup-v15',
  settlementPanelV15: 'art/ui/settlement-panel-v15',
  badgeMultiplierV13: 'art/ui/badge-multiplier-v13',
  badgeTimerV13: 'art/ui/badge-timer-v13',
  fxSpark: 'art/fx/fx-spark',
  fxRing: 'art/fx/fx-ring',
  fxStar: 'art/fx/fx-star',
  fxTrail: 'art/fx/fx-trail',
  fxConfetti: 'art/fx/fx-confetti',
} as const;

export type RollbackResourceKey = keyof typeof ROLLBACK_RESOURCE_PATHS;
