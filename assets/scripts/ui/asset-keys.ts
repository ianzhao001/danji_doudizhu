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

  lobbyBg: 'art/backgrounds/lobby-bg',
  gameTableBg: 'art/backgrounds/game-table-bg',
  settlementBg: 'art/backgrounds/settlement-bg',

  playerAvatar: 'art/avatars/player-avatar',
  aiCheerfulAvatar: 'art/avatars/ai-cheerful-avatar',
  aiCalmAvatar: 'art/avatars/ai-calm-avatar',
  landlordRoleAvatar: 'art/avatars/landlord-role-avatar',
  farmerRoleAvatar: 'art/avatars/farmer-role-avatar',
  avatarFrameSet: 'art/avatars/avatar-frame-set',

  buttonSet: 'art/ui/button-set',
  panelSet: 'art/ui/panel-set',
  statusBadges: 'art/ui/status-badges',
  actionIcons: 'art/ui/action-icons',

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
