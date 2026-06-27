import { describe, expect, it } from 'vitest';
import { cardView } from '../../assets/scripts/ui/card-view';
import { cueForFlowEvent, type CueId } from '../../assets/scripts/ui/event-cues';
import {
  RESOURCE_PATHS,
  cardAssetPath,
  cueAudioPath,
  resourcePath,
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
