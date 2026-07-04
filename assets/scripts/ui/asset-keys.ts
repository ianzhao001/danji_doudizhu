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

export function cueAudioPath(cue: CueId): ResourcePath | null {
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
    case 'win':
      return RESOURCE_PATHS.audioWin;
    default:
      return null;
  }
}
