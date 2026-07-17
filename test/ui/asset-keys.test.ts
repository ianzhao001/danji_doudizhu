import { describe, expect, it } from 'vitest';
import { cardView } from '../../assets/scripts/ui/card-view';
import { cueForFlowEvent, type CueId } from '../../assets/scripts/ui/event-cues';
import {
  RESOURCE_PATHS,
  cardAssetPath,
  cueAudioPath,
  resourcePath,
  spriteFrameResourcePath,
  suitAssetPath,
} from '../../assets/scripts/ui/asset-keys';
import { ROLLBACK_RESOURCE_PATHS } from '../../assets/scripts/ui/asset-keys-rollback';
import { createDeck, Rank, Suit } from '../../assets/scripts/rules';
import { Side } from '../../assets/scripts/game';

describe('asset keys', () => {
  it('RESOURCE_PATHS contains extensionless unique resources paths', () => {
    const paths = Object.values(RESOURCE_PATHS);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.every((path) => !path.startsWith('resources/'))).toBe(true);
    expect(paths.every((path) => !/\.(png|wav|mp3|otf|ttf)$/i.test(path))).toBe(true);
    expect(resourcePath('lobbyBg')).toBe('art/backgrounds/lobby-bg');
    expect(resourcePath('audioButton')).toBe('audio/button');
    expect(resourcePath('landlordRoleBadge')).toBe('art/avatars/landlord-role-badge');
    expect(resourcePath('buttonPrimary')).toBe('art/ui/btn-primary');
    expect(resourcePath('splash')).toBe('art/misc/splash');
  });

  it('maps image resources to their Cocos SpriteFrame sub-asset path', () => {
    expect(spriteFrameResourcePath(RESOURCE_PATHS.cardTemplateV13)).toBe('art/cards/card-template-v13/spriteFrame');
    expect(spriteFrameResourcePath(RESOURCE_PATHS.lobbyBg)).toBe('art/backgrounds/lobby-bg/spriteFrame');
  });

  it('locks every active card / button / skin / fx key to an independent literal resource path', () => {
    // W-VISION-COLOR 用户裁决:信息层级配色重构(c1)→ R2-d rim 加厚(c2,仅按钮三张);
    // v21 按钮族 + v19 药丸/名牌/托盘 + v13 牌桌底 + c1 按钮族退役入 rollback;
    // 卡面 v13、牌桌/药丸/名牌 c1、面板/头像/环/帽/徽/牌型/特效 v19 续用。
    expect({
      // v13 卡系(续用;无 cardSelectedFrame——v1.6 无选中框层)
      cardTemplateV13: RESOURCE_PATHS.cardTemplateV13,
      cardBackV13: RESOURCE_PATHS.cardBackV13,
      suitSpadeV13: RESOURCE_PATHS.suitSpadeV13,
      suitHeartV13: RESOURCE_PATHS.suitHeartV13,
      suitClubV13: RESOURCE_PATHS.suitClubV13,
      suitDiamondV13: RESOURCE_PATHS.suitDiamondV13,
      jokerSmallV13: RESOURCE_PATHS.jokerSmallV13,
      jokerBigV13: RESOURCE_PATHS.jokerBigV13,
      // c2 按钮族（R2-d 用户解锁 rim 加厚 ~1px:三张同族一致、向内加厚、alpha/trim/capInsets 不变;
      // 圆角/高光/底唇/投影/渐变/色相/饱和全部不动——结构冻结仅解锁 rim 这一项）
      btnPrimaryC2: RESOURCE_PATHS.btnPrimaryC2,
      btnSecondaryC2: RESOURCE_PATHS.btnSecondaryC2,
      btnNeutralC2: RESOURCE_PATHS.btnNeutralC2,
      // c1 皮相（牌桌降饱和 / 象牙白药丸·名牌;R2 移除中央托盘,playTrayC1 退役,不在活跃表）
      gameTableBgC1: RESOURCE_PATHS.gameTableBgC1,
      infoPillC1: RESOURCE_PATHS.infoPillC1,
      seatNameplateC1: RESOURCE_PATHS.seatNameplateC1,
      // v19 皮相（未在本波改色范围,续用）
      panelPopupV19: RESOURCE_PATHS.panelPopupV19,
      settlementPanelV19: RESOURCE_PATHS.settlementPanelV19,
      avatarFrameV19: RESOURCE_PATHS.avatarFrameV19,
      countdownRingV19: RESOURCE_PATHS.countdownRingV19,
      landlordHatV19: RESOURCE_PATHS.landlordHatV19,
      farmerBadgeV19: RESOURCE_PATHS.farmerBadgeV19,
      patternLabelV19: RESOURCE_PATHS.patternLabelV19,
      // v19 特效族（续用）
      fxConfettiV19: RESOURCE_PATHS.fxConfettiV19,
      fxStarV19: RESOURCE_PATHS.fxStarV19,
      fxSparkV19: RESOURCE_PATHS.fxSparkV19,
      fxRingV19: RESOURCE_PATHS.fxRingV19,
      fxTrailV19: RESOURCE_PATHS.fxTrailV19,
    }).toEqual({
      cardTemplateV13: 'art/cards/card-template-v13',
      cardBackV13: 'art/cards/card-back-v13',
      suitSpadeV13: 'art/cards/suit-spade-v13',
      suitHeartV13: 'art/cards/suit-heart-v13',
      suitClubV13: 'art/cards/suit-club-v13',
      suitDiamondV13: 'art/cards/suit-diamond-v13',
      jokerSmallV13: 'art/cards/joker-small-v13',
      jokerBigV13: 'art/cards/joker-big-v13',
      btnPrimaryC2: 'art/ui/btn-primary-c2',
      btnSecondaryC2: 'art/ui/btn-secondary-c2',
      btnNeutralC2: 'art/ui/btn-neutral-c2',
      gameTableBgC1: 'art/backgrounds/game-table-bg-c1',
      infoPillC1: 'art/ui/info-pill-c1',
      seatNameplateC1: 'art/ui/seat-nameplate-c1',
      panelPopupV19: 'art/ui/panel-popup-v19',
      settlementPanelV19: 'art/ui/settlement-panel-v19',
      avatarFrameV19: 'art/ui/avatar-frame-v19',
      countdownRingV19: 'art/ui/countdown-ring-v19',
      landlordHatV19: 'art/ui/landlord-hat-v19',
      farmerBadgeV19: 'art/ui/farmer-badge-v19',
      patternLabelV19: 'art/ui/pattern-label-v19',
      fxConfettiV19: 'art/fx/fx-confetti-v19',
      fxStarV19: 'art/fx/fx-star-v19',
      fxSparkV19: 'art/fx/fx-spark-v19',
      fxRingV19: 'art/fx/fx-ring-v19',
      fxTrailV19: 'art/fx/fx-trail-v19',
    });
  });

  it('maps final reviewed ART-IMPORT sprites to resources paths', () => {
    expect(resourcePath('farmerRoleBadge')).toBe('art/avatars/farmer-role-badge');
    expect(resourcePath('avatarFrame')).toBe('art/avatars/avatar-frame');
    expect(resourcePath('buttonSecondary')).toBe('art/ui/btn-secondary');
    expect(resourcePath('buttonDisabled')).toBe('art/ui/btn-disabled');
    expect(resourcePath('iconPlay')).toBe('art/ui/icon-play');
    expect(resourcePath('iconPass')).toBe('art/ui/icon-pass');
    expect(resourcePath('iconHint')).toBe('art/ui/icon-hint');
    expect(resourcePath('iconBid')).toBe('art/ui/icon-bid');
    expect(resourcePath('iconBack')).toBe('art/ui/icon-back');
    expect(resourcePath('iconSettings')).toBe('art/ui/icon-settings');
    expect(resourcePath('badgeMultiplier')).toBe('art/ui/badge-multiplier');
    expect(resourcePath('badgeTurn')).toBe('art/ui/badge-turn');
    expect(resourcePath('badgeCountdownRing')).toBe('art/ui/badge-countdown-ring');
    expect(resourcePath('emphasisBomb')).toBe('art/ui/emphasis-bomb');
    expect(resourcePath('emphasisRocket')).toBe('art/ui/emphasis-rocket');
    expect(resourcePath('emphasisSpring')).toBe('art/ui/emphasis-spring');
    expect(resourcePath('panelPopup')).toBe('art/ui/panel-popup');
    expect(resourcePath('appIcon')).toBe('art/misc/app-icon');
    expect(resourcePath('emptyRecords')).toBe('art/misc/empty-records');
    expect(resourcePath('settlementWinBadge')).toBe('art/misc/badge-win');
    expect(resourcePath('settlementLoseBadge')).toBe('art/misc/badge-lose');
  });

  it('covers every card-view assetKey produced from a full deck', () => {
    for (const card of createDeck()) {
      const view = cardView(card);
      expect(cardAssetPath(view.assetKey)).not.toBeNull();
    }
  });

  it('maps normal cards to card template and jokers to joker art', () => {
    expect(cardAssetPath(cardView({ rank: Rank.R7, suit: Suit.Heart }).assetKey)).toBe(
      'art/cards/card-template-v13',
    );
    expect(cardAssetPath(cardView({ rank: Rank.SmallJoker, suit: Suit.Joker }).assetKey)).toBe(
      'art/cards/joker-small-v13',
    );
    expect(cardAssetPath(cardView({ rank: Rank.BigJoker, suit: Suit.Joker }).assetKey)).toBe(
      'art/cards/joker-big-v13',
    );
    expect(cardAssetPath('999-Z')).toBeNull();
  });

  it('maps suits to suit art and joker suit to null', () => {
    expect(suitAssetPath(Suit.Spade)).toBe('art/cards/suit-spade-v13');
    expect(suitAssetPath(Suit.Heart)).toBe('art/cards/suit-heart-v13');
    expect(suitAssetPath(Suit.Club)).toBe('art/cards/suit-club-v13');
    expect(suitAssetPath(Suit.Diamond)).toBe('art/cards/suit-diamond-v13');
    expect(suitAssetPath('joker')).toBeNull();
  });

  // v1.5 T-AUDIO-MAP 契约改写(披露):胜负音归 settled 单点分流;win cue 音频退役
  //(修「AI 赢也播胜利音」旧 bug 并防 win/settled 双响)。旧断言 "win→audioWin" 即被修的 bug 行为。
  it('maps direct event cues to audio; settled routes by heroWon; win cue audio retired', () => {
    const direct: CueId[] = ['deal', 'play', 'pass', 'bomb', 'rocket'];
    for (const cue of direct) expect(cueAudioPath(cue)).not.toBeNull();

    expect(cueAudioPath('bid')).toBe(RESOURCE_PATHS.audioSelect);
    expect(cueAudioPath('bottomRevealed')).toBe(RESOURCE_PATHS.audioDeal);

    const settledCue = cueForFlowEvent({
      type: 'settled',
      settlement: { multiplier: 1, spring: 'none', bombs: 0, scores: [2, -1, -1] },
    });
    expect(cueAudioPath(settledCue!)).toBeNull(); // 缺 context 保守静音
    expect(cueAudioPath(settledCue!, { heroWon: true })).toBe(RESOURCE_PATHS.audioWin);
    expect(cueAudioPath(settledCue!, { heroWon: false })).toBe(RESOURCE_PATHS.audioLose);

    // v1.6 T-CUE-AUDIO 契约改写(披露):音频解禁,三哑 cue 补音——
    // 旧断言 landlordDecided/reset→null 即 v1.5「零新增音频」约束下的登记缺口,本版清零。
    const landlordCue = cueForFlowEvent({ type: 'landlordDecided', landlord: 0, bidMultiplier: 1 });
    const resetCue = cueForFlowEvent({ type: 'round', event: { type: 'reset', leader: 0 } });
    const redealCue = cueForFlowEvent({ type: 'redeal', attempt: 1 });
    expect(cueAudioPath(landlordCue!)).toBe(RESOURCE_PATHS.audioLandlord);
    expect(cueAudioPath(resetCue!)).toBe(RESOURCE_PATHS.audioReset);
    expect(cueAudioPath(redealCue!)).toBe(RESOURCE_PATHS.audioRedeal);

    expect(
      cueAudioPath(cueForFlowEvent({ type: 'round', event: { type: 'win', seat: 0, side: Side.Landlord } })!),
    ).toBeNull();
  });
});


// UI 资源键契约：v12 皮肤新增键必须显式存在。
// Record 宽化仅为让测试在键落地前保持可编译。
describe('ART-IMPORT-UIKIT 新键', () => {
  it('seatNameplate / bottomCardsDock 指向 v12 资源路径', () => {
    const paths = RESOURCE_PATHS as unknown as Record<string, string>;
    expect(paths['seatNameplate']).toBe('art/ui/seat-nameplate');
    expect(paths['bottomCardsDock']).toBe('art/ui/bottom-cards-dock');
  });
});

// W-VISION-COLOR 契约改写(披露):信息层级配色——牌桌/托盘/药丸/名牌/游戏按钮换 c1(v21 结构不动只改色);
// v21 按钮族 + v19 药丸/名牌/托盘 + v13 牌桌底物理隔离至 rollback;卡面 v13、其余 v19 皮相续用。
describe('ART 活跃键与回滚隔离(W-VISION-COLOR c1 配色 → R2-d c2 rim 加厚)', () => {
  it('活跃皮相键:结算面板 v19、卡面 v13、c2 游戏按钮与 c1 皮相', () => {
    expect(RESOURCE_PATHS.settlementPanelV19).toBe('art/ui/settlement-panel-v19');
    expect(RESOURCE_PATHS.cardTemplateV13).toBe('art/cards/card-template-v13');
    expect(RESOURCE_PATHS.btnPrimaryC2).toBe('art/ui/btn-primary-c2');
    expect(RESOURCE_PATHS.gameTableBgC1).toBe('art/backgrounds/game-table-bg-c1');
    expect(RESOURCE_PATHS.infoPillC1).toBe('art/ui/info-pill-c1');
    expect(RESOURCE_PATHS.seatNameplateC1).toBe('art/ui/seat-nameplate-c1');
  });

  it('回滚键在隔离文件中路径不变(回滚可用),且与活跃表零重名', () => {
    expect(ROLLBACK_RESOURCE_PATHS.settlementBannerWinV15).toBe('art/ui/settlement-banner-win-v15');
    expect(ROLLBACK_RESOURCE_PATHS.settlementBannerLoseV15).toBe('art/ui/settlement-banner-lose-v15');
    expect(ROLLBACK_RESOURCE_PATHS.settlementPanelV13).toBe('art/ui/settlement-panel-v13');
    expect(ROLLBACK_RESOURCE_PATHS.btnPrimaryV15).toBe('art/ui/btn-primary-v15');
    expect(ROLLBACK_RESOURCE_PATHS.btnPrimaryV17).toBe('art/ui/btn-primary-v17');
    expect(ROLLBACK_RESOURCE_PATHS.btnPrimaryV18).toBe('art/ui/btn-primary-v18');
    // S4R-R2:v19 卡系退役入回滚(卡面回滚 v13);S4R-R2/R3:v19 与 v20 按钮退役。
    expect(ROLLBACK_RESOURCE_PATHS.cardTemplateV19).toBe('art/cards/card-template-v19');
    expect(ROLLBACK_RESOURCE_PATHS.cardSelectedFrameV19).toBe('art/cards/card-selected-frame-v19');
    expect(ROLLBACK_RESOURCE_PATHS.btnPrimaryV19).toBe('art/ui/btn-primary-v19');
    expect(ROLLBACK_RESOURCE_PATHS.btnPrimaryV20).toBe('art/ui/btn-primary-v20');
    // W-VISION-COLOR:v21 按钮族 + v19 药丸/名牌/托盘 + v13 牌桌底退役入回滚(全场景换 c1 信息层级配色)。
    expect(ROLLBACK_RESOURCE_PATHS.btnPrimaryV21).toBe('art/ui/btn-primary-v21');
    expect(ROLLBACK_RESOURCE_PATHS.btnSecondaryV21).toBe('art/ui/btn-secondary-v21');
    expect(ROLLBACK_RESOURCE_PATHS.btnTertiaryV21).toBe('art/ui/btn-tertiary-v21');
    expect(ROLLBACK_RESOURCE_PATHS.btnDisabledV21).toBe('art/ui/btn-disabled-v21');
    expect(ROLLBACK_RESOURCE_PATHS.gameTableBgV13).toBe('art/backgrounds/game-table-bg-v13');
    expect(ROLLBACK_RESOURCE_PATHS.playTrayV19).toBe('art/ui/play-tray-v19');
    // R2:中央托盘移除,c1 托盘皮 playTrayC1 亦退役(零消费)。
    expect(ROLLBACK_RESOURCE_PATHS.playTrayC1).toBe('art/ui/play-tray-c1');
    // R2-d:rim 加厚换 c2,c1 按钮族退役入回滚(保留可回退性——规划者裁决走 c2 新键,不原位替换)。
    expect(ROLLBACK_RESOURCE_PATHS.btnPrimaryC1).toBe('art/ui/btn-primary-c1');
    expect(ROLLBACK_RESOURCE_PATHS.btnSecondaryC1).toBe('art/ui/btn-secondary-c1');
    expect(ROLLBACK_RESOURCE_PATHS.btnNeutralC1).toBe('art/ui/btn-neutral-c1');
    expect(ROLLBACK_RESOURCE_PATHS.infoPillV19).toBe('art/ui/info-pill-v19');
    expect(ROLLBACK_RESOURCE_PATHS.seatNameplateV19).toBe('art/ui/seat-nameplate-v19');
    expect(ROLLBACK_RESOURCE_PATHS.panelPopupV15).toBe('art/ui/panel-popup-v15');
    expect(ROLLBACK_RESOURCE_PATHS.fxConfetti).toBe('art/fx/fx-confetti');
    expect(ROLLBACK_RESOURCE_PATHS.pauseBtnToggle).toBe('art/ui/pause-btn-toggle');
    // 回滚方向反锁:活跃键不得残留在回滚表(否则「回滚可用」与「活跃」自相矛盾)。
    const rollback = ROLLBACK_RESOURCE_PATHS as unknown as Record<string, string | undefined>;
    expect(rollback.cardTemplateV13, 'v13 卡面应在活跃表,不在回滚表').toBeUndefined();
    expect(rollback.btnPrimaryC2, 'c2 按钮应在活跃表,不在回滚表').toBeUndefined();
    expect(rollback.gameTableBgC1, 'c1 牌桌应在活跃表,不在回滚表').toBeUndefined();
    expect(rollback.infoPillC1, 'c1 药丸应在活跃表,不在回滚表').toBeUndefined();
    const activeKeys = new Set(Object.keys(RESOURCE_PATHS));
    for (const key of Object.keys(ROLLBACK_RESOURCE_PATHS)) {
      expect(activeKeys.has(key), `回滚键「${key}」不得同时存在于活跃表`).toBe(false);
    }
  });
});
