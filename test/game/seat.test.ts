import { describe, expect, it } from 'vitest';
import { isGameEvent, isSeat, nextSeat } from '../../assets/scripts/game/seat';
import { Side } from '../../assets/scripts/game';
import { Category, Rank, Suit } from '../../assets/scripts/rules';

const single3 = {
  category: Category.Single,
  mainRank: Rank.R3,
  length: 1,
  cards: [{ rank: Rank.R3, suit: Suit.Spade }],
};

describe('game seat helpers', () => {
  it('recognizes seats and rotates through the three seats', () => {
    expect(isSeat(0)).toBe(true);
    expect(isSeat(1)).toBe(true);
    expect(isSeat(2)).toBe(true);
    expect(isSeat(3)).toBe(false);
    expect(nextSeat(0)).toBe(1);
    expect(nextSeat(1)).toBe(2);
    expect(nextSeat(2)).toBe(0);
  });

  it('recognizes valid game events', () => {
    expect(isGameEvent({ type: 'play', seat: 0, pattern: single3 })).toBe(true);
    expect(isGameEvent({ type: 'pass', seat: 1 })).toBe(true);
    expect(isGameEvent({ type: 'bomb', seat: 2 })).toBe(true);
    expect(isGameEvent({ type: 'rocket', seat: 0 })).toBe(true);
    expect(isGameEvent({ type: 'reset', leader: 2 })).toBe(true);
    expect(isGameEvent({ type: 'win', seat: 1, side: Side.Farmer })).toBe(true);
  });

  it('rejects malformed game events', () => {
    expect(isGameEvent(null)).toBe(false);
    expect(isGameEvent({ type: 'unknown', seat: 0 })).toBe(false);
    expect(isGameEvent({ type: 'pass', seat: 9 })).toBe(false);
    expect(isGameEvent({ type: 'reset', leader: '0' })).toBe(false);
    expect(isGameEvent({ type: 'win', seat: 1, side: 'x' })).toBe(false);
    expect(isGameEvent({ type: 'play', seat: 0, pattern: { ...single3, length: 2 } })).toBe(false);
  });
});
