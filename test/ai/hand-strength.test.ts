import { describe, expect, it } from 'vitest';
import { Suit, Rank, type Card } from '../../assets/scripts/rules';
import { evaluateHand } from '../../assets/scripts/ai/handStrength';

function c(rank: Rank, suit: Suit = Suit.Spade): Card {
  return { rank, suit: rank >= Rank.SmallJoker ? Suit.Joker : suit };
}

function four(rank: Rank): Card[] {
  return [
    c(rank, Suit.Spade),
    c(rank, Suit.Heart),
    c(rank, Suit.Club),
    c(rank, Suit.Diamond),
  ];
}

describe('evaluateHand', () => {
  it('returns an empty strength for an empty hand', () => {
    expect(evaluateHand([])).toEqual({
      score: 0,
      bombs: 0,
      rockets: 0,
      highCards: 0,
      longestStraight: 0,
    });
  });

  it('scores rocket hands above similar hands without rocket', () => {
    const withoutRocket = [c(Rank.R2), c(Rank.A), c(Rank.K)];
    const withRocket = [...withoutRocket, c(Rank.SmallJoker), c(Rank.BigJoker)];

    expect(evaluateHand(withRocket).rockets).toBe(1);
    expect(evaluateHand(withRocket).score).toBeGreaterThan(evaluateHand(withoutRocket).score);
  });

  it('scores multiple bombs above a single bomb and non-bomb hands', () => {
    const noBomb = [c(Rank.R3), c(Rank.R4), c(Rank.R5), c(Rank.R6)];
    const oneBomb = four(Rank.R8);
    const twoBombs = [...four(Rank.R8), ...four(Rank.K)];

    expect(evaluateHand(twoBombs).bombs).toBe(2);
    expect(evaluateHand(oneBomb).bombs).toBe(1);
    expect(evaluateHand(twoBombs).score).toBeGreaterThan(evaluateHand(oneBomb).score);
    expect(evaluateHand(oneBomb).score).toBeGreaterThan(evaluateHand(noBomb).score);
  });

  it('does not lower score when adding a high card or a bomb', () => {
    const base = [c(Rank.R3), c(Rank.R4), c(Rank.R5)];
    const high = [...base, c(Rank.R2)];
    const bomb = [...high, ...four(Rank.Q)];

    expect(evaluateHand(high).score).toBeGreaterThanOrEqual(evaluateHand(base).score);
    expect(evaluateHand(bomb).score).toBeGreaterThanOrEqual(evaluateHand(high).score);
  });

  it('keeps score in the 0..100 range and is deterministic', () => {
    const hand = [
      ...four(Rank.R3),
      ...four(Rank.R4),
      ...four(Rank.R5),
      c(Rank.SmallJoker),
      c(Rank.BigJoker),
      c(Rank.R2),
    ];

    const first = evaluateHand(hand);
    const second = evaluateHand(hand);
    expect(first.score).toBeGreaterThanOrEqual(0);
    expect(first.score).toBeLessThanOrEqual(100);
    expect(second).toEqual(first);
  });

  it('keeps straight length stable when the hand also contains 2 and jokers', () => {
    const hand = [
      c(Rank.R3),
      c(Rank.R4),
      c(Rank.R5),
      c(Rank.A),
      c(Rank.R2),
      c(Rank.SmallJoker),
      c(Rank.BigJoker),
    ];

    expect(evaluateHand(hand).longestStraight).toBe(3);
  });

  it('preserves the named weight formula output for a representative strong hand', () => {
    const hand = [
      c(Rank.SmallJoker),
      c(Rank.BigJoker),
      c(Rank.R2),
      ...four(Rank.Q),
      c(Rank.R3),
      c(Rank.R4),
      c(Rank.R5),
      c(Rank.R6),
      c(Rank.R7),
    ];

    expect(evaluateHand(hand)).toEqual({
      score: 78,
      bombs: 1,
      rockets: 1,
      highCards: 3,
      longestStraight: 5,
    });
  });
});
