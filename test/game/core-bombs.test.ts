import { describe, expect, it } from 'vitest';

import { apply, GamePhase, RoundState } from '../../assets/scripts/game';
import { Category, recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

function round(hand = '3 3 3 3 6 7 x X'): RoundState {
  return {
    phase: GamePhase.Playing,
    landlord: 0,
    seats: [
      { index: 0, hand: cards(hand) },
      { index: 1, hand: cards('4 5 8') },
      { index: 2, hand: cards('9 10 J') },
    ],
    turn: 0,
    top: null,
    passesInARow: 0,
    winner: null,
    bombsPlayed: 0,
    bottom: null,
  };
}

describe('core bomb event accounting', () => {
  it('increments bombsPlayed and emits bomb event for a bomb', () => {
    const result = apply(round(), { type: 'play', seat: 0, cards: cards('3 3 3 3') });

    expect(result.state.bombsPlayed).toBe(1);
    expect(result.events).toContainEqual({ type: 'bomb', seat: 0 });
  });

  it('increments bombsPlayed and emits rocket event for a rocket', () => {
    const result = apply(round(), { type: 'play', seat: 0, cards: cards('x X') });

    expect(result.state.bombsPlayed).toBe(1);
    expect(result.events).toContainEqual({ type: 'rocket', seat: 0 });
  });

  it('does not count ordinary singles or pairs as bombs', () => {
    const single = apply(round('3 4 5'), { type: 'play', seat: 0, cards: cards('3') });
    const pair = apply(round('3 3 4 5'), { type: 'play', seat: 0, cards: cards('3 3') });

    expect(single.state.bombsPlayed).toBe(0);
    expect(single.events.some((event) => event.type === 'bomb' || event.type === 'rocket')).toBe(false);
    expect(pair.state.bombsPlayed).toBe(0);
    expect(pair.events.some((event) => event.type === 'bomb' || event.type === 'rocket')).toBe(false);
  });

  it('does not count four-plus-two as a bomb event', () => {
    const pattern = recognize(cards('4 4 4 4 6 7'));
    expect(pattern?.category).toBe(Category.FourPlusTwoSingles);

    const result = apply(round('4 4 4 4 6 7 8'), {
      type: 'play',
      seat: 0,
      cards: cards('4 4 4 4 6 7'),
    });

    expect(result.state.bombsPlayed).toBe(0);
    expect(result.events.some((event) => event.type === 'bomb')).toBe(false);
  });

  it('does not count triples as bombs', () => {
    const result = apply(round('5 5 5 8'), { type: 'play', seat: 0, cards: cards('5 5 5') });

    expect(result.state.bombsPlayed).toBe(0);
    expect(result.events.some((event) => event.type === 'bomb' || event.type === 'rocket')).toBe(false);
  });
});
