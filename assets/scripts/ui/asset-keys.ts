import { Rank, Suit } from '../rules';
import type { CueId } from './event-cues';

export const RESOURCE_PATHS = {
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
  gameTableBgC1: 'art/backgrounds/game-table-bg-c1',

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
  seatNameplateV13: 'art/ui/seat-nameplate-v13',
  bottomCardsDockV13: 'art/ui/bottom-cards-dock-v13',
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
  // W-VISION-COLOR-R2-d:c2 沿用 c1 色彩与 v21 结构，仅将 rim 向内加厚。
  btnPrimaryC2: 'art/ui/btn-primary-c2',
  btnSecondaryC2: 'art/ui/btn-secondary-c2',
  btnNeutralC2: 'art/ui/btn-neutral-c2',
  infoPillC1: 'art/ui/info-pill-c1',
  seatNameplateC1: 'art/ui/seat-nameplate-c1',
  panelPopupV19: 'art/ui/panel-popup-v19',
  settlementPanelV19: 'art/ui/settlement-panel-v19',
  avatarFrameV19: 'art/ui/avatar-frame-v19',
  countdownRingV19: 'art/ui/countdown-ring-v19',
  landlordHatV19: 'art/ui/landlord-hat-v19',
  farmerBadgeV19: 'art/ui/farmer-badge-v19',
  patternLabelV19: 'art/ui/pattern-label-v19',
  bottomCardsDockV15: 'art/ui/bottom-cards-dock-v15',

  fxSparkV19: 'art/fx/fx-spark-v19',
  fxRingV19: 'art/fx/fx-ring-v19',
  fxStarV19: 'art/fx/fx-star-v19',
  fxTrailV19: 'art/fx/fx-trail-v19',
  fxConfettiV19: 'art/fx/fx-confetti-v19',

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

  if (rank === Rank.SmallJoker && suit === Suit.Joker) return RESOURCE_PATHS.jokerSmallV13;
  if (rank === Rank.BigJoker && suit === Suit.Joker) return RESOURCE_PATHS.jokerBigV13;
  if (NORMAL_RANKS.has(rank) && NORMAL_SUITS.has(suit)) return RESOURCE_PATHS.cardTemplateV13;
  return null;
}

export function suitAssetPath(suit: Suit | 'joker'): ResourcePath | null {
  switch (suit) {
    case Suit.Spade:
      return RESOURCE_PATHS.suitSpadeV13;
    case Suit.Heart:
      return RESOURCE_PATHS.suitHeartV13;
    case Suit.Club:
      return RESOURCE_PATHS.suitClubV13;
    case Suit.Diamond:
      return RESOURCE_PATHS.suitDiamondV13;
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
