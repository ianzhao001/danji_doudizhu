import { describe, it, expect } from 'vitest';
import { adviseBid } from '../../assets/scripts/ai/bidding-advisor';
import { isStrongHand } from '../../assets/scripts/ai/bidding';
import { Rank, Suit, type Card } from '../../assets/scripts/rules';

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit });
const strongHand = [c(Rank.R2, Suit.Spade), c(Rank.SmallJoker, Suit.Joker)];
const weakHand = [c(Rank.R3, Suit.Spade), c(Rank.R7, Suit.Heart), c(Rank.K, Suit.Club)];

describe('M6-L10 adviseBid', () => {
  it('suggests call for a strong hand during calling', () => {
    expect(adviseBid(strongHand, 'calling')).toEqual({ suggestion: 'call', strong: true });
  });

  it('suggests grab for a strong hand during grabbing', () => {
    expect(adviseBid(strongHand, 'grabbing')).toEqual({ suggestion: 'grab', strong: true });
  });

  it('suggests pass for weak hands in either phase', () => {
    expect(adviseBid(weakHand, 'calling')).toEqual({ suggestion: 'pass', strong: false });
    expect(adviseBid(weakHand, 'grabbing')).toEqual({ suggestion: 'pass', strong: false });
  });

  it('keeps strong aligned with isStrongHand threshold 2 and is deterministic', () => {
    expect(adviseBid(strongHand, 'calling').strong).toBe(isStrongHand(strongHand, 2));
    expect(adviseBid(weakHand, 'calling')).toEqual(adviseBid(weakHand, 'calling'));
  });
});
