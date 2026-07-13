import { Rank, Suit } from '../rules';
import type { CueId } from './event-cues';

export const RESOURCE_PATHS = {
  cardTemplate: 'art/cards/card-template',
  cardBack: 'art/cards/card-back',
  suitSpade: 'art/cards/suit-spade',
  suitHeart: 'art/cards/suit-heart',
  suitClub: 'art/cards/suit-club',
  suitDiamond: 'art/cards/suit-diamond',
  jokerSmall: 'art/cards/joker-small',
  jokerBig: 'art/cards/joker-big',
  cardTemplateV13: 'art/cards/card-template-v13',
  cardBackV13: 'art/cards/card-back-v13',
  suitSpadeV13: 'art/cards/suit-spade-v13',
  suitHeartV13: 'art/cards/suit-heart-v13',
  suitClubV13: 'art/cards/suit-club-v13',
  suitDiamondV13: 'art/cards/suit-diamond-v13',
  jokerSmallV13: 'art/cards/joker-small-v13',
  jokerBigV13: 'art/cards/joker-big-v13',

  lobbyBg: 'art/backgrounds/lobby-bg',
  gameTableBg: 'art/backgrounds/game-table-bg',
  settlementBg: 'art/backgrounds/settlement-bg',
  gameTableBgV13: 'art/backgrounds/game-table-bg-v13',

  playerAvatar: 'art/avatars/player-avatar',
  aiCheerfulAvatar: 'art/avatars/ai-cheerful-avatar',
  aiCalmAvatar: 'art/avatars/ai-calm-avatar',
  landlordRoleAvatar: 'art/avatars/landlord-role-avatar',
  farmerRoleAvatar: 'art/avatars/farmer-role-avatar',
  avatarFrameSet: 'art/avatars/avatar-frame-set',
  landlordRoleBadge: 'art/avatars/landlord-role-badge',
  farmerRoleBadge: 'art/avatars/farmer-role-badge',
  avatarFrame: 'art/avatars/avatar-frame',
  heroBodyV13: 'art/avatars/hero-body-v13',
  leftAiBodyV13: 'art/avatars/left-ai-body-v13',
  rightAiBodyV13: 'art/avatars/right-ai-body-v13',

  buttonSet: 'art/ui/button-set',
  panelSet: 'art/ui/panel-set',
  statusBadges: 'art/ui/status-badges',
  actionIcons: 'art/ui/action-icons',
  buttonPrimary: 'art/ui/btn-primary',
  buttonSecondary: 'art/ui/btn-secondary',
  buttonDisabled: 'art/ui/btn-disabled',
  seatNameplate: 'art/ui/seat-nameplate',
  bottomCardsDock: 'art/ui/bottom-cards-dock',
  btnPrimaryV13: 'art/ui/btn-primary-v13',
  btnSecondaryV13: 'art/ui/btn-secondary-v13',
  btnTertiaryV13: 'art/ui/btn-tertiary-v13',
  btnDisabledV13: 'art/ui/btn-disabled-v13',
  pauseBtnToggle: 'art/ui/pause-btn-toggle',
  pauseBtnAction: 'art/ui/pause-btn-action',
  seatNameplateV13: 'art/ui/seat-nameplate-v13',
  bottomCardsDockV13: 'art/ui/bottom-cards-dock-v13',
  settlementBannerWinV13: 'art/ui/settlement-banner-win-v13',
  settlementBannerLoseV13: 'art/ui/settlement-banner-lose-v13',
  settlementPanelV13: 'art/ui/settlement-panel-v13',
  badgeMultiplierV13: 'art/ui/badge-multiplier-v13',
  badgeTimerV13: 'art/ui/badge-timer-v13',
  iconPlay: 'art/ui/icon-play',
  iconPass: 'art/ui/icon-pass',
  iconHint: 'art/ui/icon-hint',
  iconBid: 'art/ui/icon-bid',
  iconBack: 'art/ui/icon-back',
  iconSettings: 'art/ui/icon-settings',
  badgeMultiplier: 'art/ui/badge-multiplier',
  badgeTurn: 'art/ui/badge-turn',
  badgeCountdownRing: 'art/ui/badge-countdown-ring',
  emphasisBomb: 'art/ui/emphasis-bomb',
  emphasisRocket: 'art/ui/emphasis-rocket',
  emphasisSpring: 'art/ui/emphasis-spring',
  panelPopup: 'art/ui/panel-popup',
  btnPrimaryV15: 'art/ui/btn-primary-v15',
  btnSecondaryV15: 'art/ui/btn-secondary-v15',
  btnTertiaryV15: 'art/ui/btn-tertiary-v15',
  btnDisabledV15: 'art/ui/btn-disabled-v15',
  // v1.6 终审整改①:规则圆角矩形按钮四态(替 v15 异形花瓣端头);v15 键保留仅作回滚。
  btnPrimaryV17: 'art/ui/btn-primary-v17',
  btnSecondaryV17: 'art/ui/btn-secondary-v17',
  btnTertiaryV17: 'art/ui/btn-tertiary-v17',
  btnDisabledV17: 'art/ui/btn-disabled-v17',
  // v1.6 二次终审整改(用户设计原则:盖字底图=单一填充+至多一条细描边,禁多层线条/异形):
  // v18 极简族——按钮四态 + 信息条 + 席位名牌;v17(多层描边)与 v15(异形)键保留仅作回滚。
  btnPrimaryV18: 'art/ui/btn-primary-v18',
  btnSecondaryV18: 'art/ui/btn-secondary-v18',
  btnTertiaryV18: 'art/ui/btn-tertiary-v18',
  btnDisabledV18: 'art/ui/btn-disabled-v18',
  infoPillV18: 'art/ui/info-pill-v18',
  seatNameplateV18: 'art/ui/seat-nameplate-v18',
  infoPillV15: 'art/ui/info-pill-v15',
  seatNameplateV15: 'art/ui/seat-nameplate-v15',
  bottomCardsDockV15: 'art/ui/bottom-cards-dock-v15',
  panelPopupV15: 'art/ui/panel-popup-v15',
  settlementPanelV15: 'art/ui/settlement-panel-v15',
  settlementBannerWinV15: 'art/ui/settlement-banner-win-v15',
  settlementBannerLoseV15: 'art/ui/settlement-banner-lose-v15',

  fxSpark: 'art/fx/fx-spark',
  fxRing: 'art/fx/fx-ring',
  fxStar: 'art/fx/fx-star',
  fxTrail: 'art/fx/fx-trail',
  fxConfetti: 'art/fx/fx-confetti',

  splash: 'art/misc/splash',
  appIcon: 'art/misc/app-icon',
  emptyRecords: 'art/misc/empty-records',
  settlementWinBadge: 'art/misc/badge-win',
  settlementLoseBadge: 'art/misc/badge-lose',

  audioDeal: 'audio/deal',
  audioSelect: 'audio/select',
  audioPlay: 'audio/play',
  audioPass: 'audio/pass',
  audioBomb: 'audio/bomb',
  audioRocket: 'audio/rocket',
  audioWin: 'audio/win',
  audioLose: 'audio/lose',
  audioButton: 'audio/button',
  audioRedeal: 'audio/redeal',
  audioReset: 'audio/reset',
  audioLandlord: 'audio/landlord',

  fontRegular: 'fonts/SourceHanSansCN-Regular',
  fontHeavy: 'fonts/SourceHanSansCN-Heavy',
} as const;

export type ResourceKey = keyof typeof RESOURCE_PATHS;
export type ResourcePath = (typeof RESOURCE_PATHS)[ResourceKey];

const NORMAL_RANKS = new Set<number>([
  Rank.R3,
  Rank.R4,
  Rank.R5,
  Rank.R6,
  Rank.R7,
  Rank.R8,
  Rank.R9,
  Rank.R10,
  Rank.J,
  Rank.Q,
  Rank.K,
  Rank.A,
  Rank.R2,
]);

const NORMAL_SUITS = new Set<string>([Suit.Spade, Suit.Heart, Suit.Club, Suit.Diamond]);

export function resourcePath(key: ResourceKey): ResourcePath {
  return RESOURCE_PATHS[key];
}

export function spriteFrameResourcePath(path: ResourcePath): string {
  return `${path}/spriteFrame`;
}

export function cardAssetPath(assetKey: string): ResourcePath | null {
  const [rankRaw, suit] = assetKey.split('-');
  const rank = Number(rankRaw);

  if (rank === Rank.SmallJoker && suit === Suit.Joker) return RESOURCE_PATHS.jokerSmall;
  if (rank === Rank.BigJoker && suit === Suit.Joker) return RESOURCE_PATHS.jokerBig;
  if (NORMAL_RANKS.has(rank) && NORMAL_SUITS.has(suit)) return RESOURCE_PATHS.cardTemplate;
  return null;
}

export function suitAssetPath(suit: Suit | 'joker'): ResourcePath | null {
  switch (suit) {
    case Suit.Spade:
      return RESOURCE_PATHS.suitSpade;
    case Suit.Heart:
      return RESOURCE_PATHS.suitHeart;
    case Suit.Club:
      return RESOURCE_PATHS.suitClub;
    case Suit.Diamond:
      return RESOURCE_PATHS.suitDiamond;
    default:
      return null;
  }
}

/**
 * v1.5 T-AUDIO-MAP:cue→音频的唯一真相源。
 * - 胜负音归 `settled` 单点分流(context.heroWon),`win` cue 音频退役——修「AI 赢也播胜利音」旧 bug 并防 win/settled 双响;
 * - settled 缺 context 时保守返回 null(宁静音不误播);
 * - bid→select、bottomRevealed→deal 补哑 cue。
 * v1.6 T-CUE-AUDIO(音频解禁):redeal/reset/landlordDecided 三哑 cue 补音,12 键全响。
 */
export function cueAudioPath(cue: CueId, context?: { heroWon?: boolean }): ResourcePath | null {
  switch (cue) {
    case 'deal':
      return RESOURCE_PATHS.audioDeal;
    case 'play':
      return RESOURCE_PATHS.audioPlay;
    case 'pass':
      return RESOURCE_PATHS.audioPass;
    case 'bomb':
      return RESOURCE_PATHS.audioBomb;
    case 'rocket':
      return RESOURCE_PATHS.audioRocket;
    case 'bid':
      return RESOURCE_PATHS.audioSelect;
    case 'bottomRevealed':
      return RESOURCE_PATHS.audioDeal;
    case 'redeal':
      return RESOURCE_PATHS.audioRedeal;
    case 'reset':
      return RESOURCE_PATHS.audioReset;
    case 'landlordDecided':
      return RESOURCE_PATHS.audioLandlord;
    case 'settled':
      if (context?.heroWon === undefined) return null;
      return context.heroWon ? RESOURCE_PATHS.audioWin : RESOURCE_PATHS.audioLose;
    case 'win':
      return null;
    default:
      return null;
  }
}
