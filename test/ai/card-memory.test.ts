import { describe, expect, it } from 'vitest';
import { trackPlayed } from '../../assets/scripts/ai/cardMemory';
import { Category, Rank, Suit, type Card, type HandPattern } from '../../assets/scripts/rules';
import { Side, type GameEvent } from '../../assets/scripts/game';

function c(rank: Rank, suit: Suit = Suit.Spade): Card {
  return { rank, suit: rank >= Rank.SmallJoker ? Suit.Joker : suit };
}

function pattern(category: Category, cards: Card[], mainRank = cards[0].rank): HandPattern {
  return { category, mainRank, length: cards.length, cards };
}

describe('trackPlayed', () => {
  it('returns full deck counts for empty public information', () => {
    const memory = trackPlayed([]);

    expect(memory.playedCount).toBe(0);
    expect(memory.remainingByRank[Rank.R3]).toBe(4);
    expect(memory.remainingByRank[Rank.R2]).toBe(4);
    expect(memory.remainingByRank[Rank.SmallJoker]).toBe(1);
    expect(memory.remainingByRank[Rank.BigJoker]).toBe(1);
  });

  it('decrements ranks from play events', () => {
    const events: GameEvent[] = [
      { type: 'play', seat: 0, pattern: pattern(Category.Pair, [c(Rank.K), c(Rank.K, Suit.Heart)]) },
      { type: 'pass', seat: 1 },
      { type: 'reset', leader: 0 },
      { type: 'win', seat: 0, side: Side.Landlord },
    ];

    const memory = trackPlayed(events);
    expect(memory.playedCount).toBe(2);
    expect(memory.remainingByRank[Rank.K]).toBe(2);
  });

  it('decrements bomb and rocket patterns from play events', () => {
    const bombCards = [
      c(Rank.R8),
      c(Rank.R8, Suit.Heart),
      c(Rank.R8, Suit.Club),
      c(Rank.R8, Suit.Diamond),
    ];
    const events: GameEvent[] = [
      { type: 'play', seat: 1, pattern: pattern(Category.Bomb, bombCards, Rank.R8) },
      {
        type: 'play',
        seat: 2,
        pattern: pattern(Category.Rocket, [c(Rank.SmallJoker), c(Rank.BigJoker)], Rank.BigJoker),
      },
      { type: 'bomb', seat: 1 },
      { type: 'rocket', seat: 2 },
    ];

    const memory = trackPlayed(events);
    expect(memory.playedCount).toBe(6);
    expect(memory.remainingByRank[Rank.R8]).toBe(0);
    expect(memory.remainingByRank[Rank.SmallJoker]).toBe(0);
    expect(memory.remainingByRank[Rank.BigJoker]).toBe(0);
  });

  it('also deducts own known hand', () => {
    const memory = trackPlayed([], [c(Rank.A), c(Rank.A, Suit.Heart), c(Rank.SmallJoker)]);

    expect(memory.playedCount).toBe(0);
    expect(memory.remainingByRank[Rank.A]).toBe(2);
    expect(memory.remainingByRank[Rank.SmallJoker]).toBe(0);
  });

  it('never decrements below zero and is deterministic', () => {
    const events: GameEvent[] = [
      {
        type: 'play',
        seat: 0,
        pattern: pattern(Category.Bomb, [
          c(Rank.R3),
          c(Rank.R3, Suit.Heart),
          c(Rank.R3, Suit.Club),
          c(Rank.R3, Suit.Diamond),
          c(Rank.R3),
        ]),
      },
    ];

    const first = trackPlayed(events);
    const second = trackPlayed(events);
    expect(first.remainingByRank[Rank.R3]).toBe(0);
    expect(first.playedCount).toBe(4);
    expect(second).toEqual(first);
  });

  it('returns frozen memory objects', () => {
    const memory = trackPlayed([], [c(Rank.R3)]);
    const remaining = memory.remainingByRank as Record<number, number>;

    expect(Object.isFrozen(memory)).toBe(true);
    expect(Object.isFrozen(memory.remainingByRank)).toBe(true);
    expect(() => {
      remaining[Rank.R3] = 4;
    }).toThrow(TypeError);
    expect(memory.remainingByRank[Rank.R3]).toBe(3);
  });
});
