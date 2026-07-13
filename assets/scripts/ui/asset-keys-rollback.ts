/**
 * v1.6 审计裁决 P1-2:退役资产键物理隔离——键与文件保留仅作回滚,产品零消费。
 * 机检门 test/architecture-gates.test.ts 门④断言这些键名除本文件与 asset-keys.ts 外
 * 在 assets/scripts 零出现(含 RUNTIME_PRELOAD_SPRITES 预载表与一切 resources.load)。
 * 回滚姿势:把所需键搬回 asset-keys.ts 的 RESOURCE_PATHS 并接回消费点,同批更新门④清单。
 * 对应 PNG/meta 仍在 assets/resources 原位保留。
 * 注意:bottomCardsDockV15 / panelPopupV15 / settlementPanelV15 是活跃皮肤键,不在此列。
 */
export const ROLLBACK_RESOURCE_PATHS = {
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
} as const;

export type RollbackResourceKey = keyof typeof ROLLBACK_RESOURCE_PATHS;
