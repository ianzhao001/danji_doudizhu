import { describe, expect, it } from 'vitest';
import {
  Category,
  Rank,
  Suit,
  recognize,
  type Card,
  type HandPattern,
} from '../../assets/scripts/rules';
import { canFinishInOneMove, finishingFollow } from '../../assets/scripts/ai/endgame';

function c(rank: Rank, suit: Suit = Suit.Spade): Card {
  return { rank, suit };
}

function requirePattern(cards: Card[]): HandPattern {
  const pattern = recognize(cards);
  if (!pattern) throw new Error('expected legal pattern');
  return pattern;
}

describe('endgame finishing helpers', () => {
  it('detects a whole straight as one finish move', () => {
    const hand = [Rank.R3, Rank.R4, Rank.R5, Rank.R6, Rank.R7].map((rank) => c(rank));

    expect(canFinishInOneMove(hand)).toBe(true);
  });

  it('detects a whole trips-pair as one finish move', () => {
    const hand = [
      c(Rank.R9),
      c(Rank.R9, Suit.Heart),
      c(Rank.R9, Suit.Club),
      c(Rank.K),
      c(Rank.K, Suit.Heart),
    ];

    expect(canFinishInOneMove(hand)).toBe(true);
  });

  it('rejects mixed illegal hands and empty hands', () => {
    expect(canFinishInOneMove([c(Rank.R3), c(Rank.R5), c(Rank.R9)])).toBe(false);
    expect(canFinishInOneMove([])).toBe(false);
  });

  it('returns a follow that uses the whole hand when it can beat top', () => {
    const top = requirePattern([c(Rank.R7)]);
    const hand = [c(Rank.A)];
    const move = finishingFollow(hand, top);

    expect(move?.cards).toEqual(hand);
    expect(move?.pattern.category).toBe(Category.Single);
    expect(move?.pattern.mainRank).toBe(Rank.A);
  });

  it('returns null when no whole-hand follow can beat top', () => {
    const top = requirePattern([c(Rank.K), c(Rank.K, Suit.Heart)]);
    const hand = [c(Rank.R4), c(Rank.R4, Suit.Heart), c(Rank.R8)];

    expect(finishingFollow(hand, top)).toBeNull();
  });

  it('is deterministic', () => {
    const top = requirePattern([c(Rank.R6)]);
    const hand = [c(Rank.R10)];

    expect(finishingFollow(hand, top)).toEqual(finishingFollow(hand, top));
  });
});
