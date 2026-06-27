import { describe, expect, it } from 'vitest';

import { GamePhase, type GameSnapshot, type TopPlay } from '../../assets/scripts/game';
import { recognize } from '../../assets/scripts/rules';
import { deriveActionButtons } from '../../assets/scripts/ui/action-buttons';
import { cards } from '../rules/_util';

const top = (spec: string): TopPlay => ({ seat: 1, pattern: recognize(cards(spec))! });

function snap(args: Partial<GameSnapshot> = {}): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: top('3'),
    handCounts: [3, 3, 3],
    winner: null,
    viewerHand: cards('5 9 K'),
    ...args,
  };
}

describe('action buttons edge cases', () => {
  it('handles missing viewerHand as an empty hand while preserving pass state', () => {
    const snapshot: GameSnapshot = {
      phase: GamePhase.Playing,
      turn: 0,
      landlord: 0,
      top: top('3'),
      handCounts: [0, 3, 3],
      winner: null,
    };

    expect(deriveActionButtons({ snapshot, selectedCards: [], viewerSeat: 0 })).toEqual({
      play: false,
      pass: true,
      hint: false,
    });
  });

  it('defaults viewerSeat to snapshot.turn', () => {
    const snapshot = snap();

    expect(deriveActionButtons({ snapshot, selectedCards: cards('K') })).toEqual(
      deriveActionButtons({ snapshot, selectedCards: cards('K'), viewerSeat: 0 }),
    );
  });

  it('can disable play for selected cards that cannot beat while keeping hint enabled', () => {
    const snapshot = snap({ top: top('A'), viewerHand: cards('K 2') });

    expect(deriveActionButtons({ snapshot, selectedCards: cards('K'), viewerSeat: 0 })).toEqual({
      play: false,
      pass: true,
      hint: true,
    });
  });
});
