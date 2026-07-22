import { describe, expect, it } from 'vitest';
import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import { GamePhase, type GameSnapshot, type TopPlay } from '../../assets/scripts/game';
import { Rank, createRng, recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const hard = strategyFor(AiLevel.Hard);

function top(spec: string): TopPlay {
  return { seat: 0, pattern: recognize(cards(spec))! };
}

function upstreamSnapshot(viewerHand: string, currentTop: string): GameSnapshot {
  const hand = cards(viewerHand);
  return {
    phase: GamePhase.Playing,
    turn: 2,
    landlord: 0,
    top: top(currentTop),
    handCounts: [12, 12, hand.length],
    winner: null,
    viewerHand: hand,
  };
}

describe('hard upstream press preserves absolute control cards', () => {
  it('presses a landlord small single with the largest non-control card, not R2 or a joker', () => {
    const snapshot = upstreamSnapshot('6 10 K A 2 5 5 5', '4');
    const action = hard(snapshot, createRng(1), []);

    expect(action.type).toBe('play');
    if (action.type !== 'play') return;
    expect(action.cards.some((card) => card.rank >= Rank.R2)).toBe(false);
    expect(action.cards.map((card) => card.rank)).toEqual([Rank.A]);
  });

  it('passes instead of breaking protected R2 cards when they are the only rank that can beat the top', () => {
    const snapshot = upstreamSnapshot('3 3 4 4 5 5 6 6 2 2 2 2', '9');
    const action = hard(snapshot, createRng(2), []);

    expect(action).toEqual({ type: 'pass', seat: 2 });
  });
});
