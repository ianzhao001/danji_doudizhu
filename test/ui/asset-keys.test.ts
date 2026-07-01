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
    expect(spriteFrameResourcePath(RESOURCE_PATHS.cardTemplate)).toBe('art/cards/card-template/spriteFrame');
    expect(spriteFrameResourcePath(RESOURCE_PATHS.lobbyBg)).toBe('art/backgrounds/lobby-bg/spriteFrame');
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
      RESOURCE_PATHS.cardTemplate,
    );
    expect(cardAssetPath(cardView({ rank: Rank.SmallJoker, suit: Suit.Joker }).assetKey)).toBe(
      RESOURCE_PATHS.jokerSmall,
    );
    expect(cardAssetPath(cardView({ rank: Rank.BigJoker, suit: Suit.Joker }).assetKey)).toBe(
      RESOURCE_PATHS.jokerBig,
    );
    expect(cardAssetPath('999-Z')).toBeNull();
  });

  it('maps suits to suit art and joker suit to null', () => {
    expect(suitAssetPath(Suit.Spade)).toBe(RESOURCE_PATHS.suitSpade);
    expect(suitAssetPath(Suit.Heart)).toBe(RESOURCE_PATHS.suitHeart);
    expect(suitAssetPath(Suit.Club)).toBe(RESOURCE_PATHS.suitClub);
    expect(suitAssetPath(Suit.Diamond)).toBe(RESOURCE_PATHS.suitDiamond);
    expect(suitAssetPath('joker')).toBeNull();
  });

  it('maps direct event cues to audio and leaves context cues unresolved', () => {
    const direct: CueId[] = ['deal', 'play', 'pass', 'bomb', 'rocket', 'win'];
    for (const cue of direct) expect(cueAudioPath(cue)).not.toBeNull();

    const settledCue = cueForFlowEvent({
      type: 'settled',
      settlement: { multiplier: 1, spring: 'none', bombs: 0, scores: [2, -1, -1] },
    });
    const landlordCue = cueForFlowEvent({ type: 'landlordDecided', landlord: 0, bidMultiplier: 1 });
    const resetCue = cueForFlowEvent({ type: 'round', event: { type: 'reset', leader: 0 } });

    expect(cueAudioPath(settledCue!)).toBeNull();
    expect(cueAudioPath(landlordCue!)).toBeNull();
    expect(cueAudioPath(resetCue!)).toBeNull();
    expect(cueAudioPath(cueForFlowEvent({ type: 'round', event: { type: 'win', seat: 0, side: Side.Landlord } })!)).toBe(
      RESOURCE_PATHS.audioWin,
    );
  });
});
