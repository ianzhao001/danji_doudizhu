import { describe, expect, it } from 'vitest';
import { bidConfidence } from '../../assets/scripts/ai/bid-confidence';
import { evaluateHand } from '../../assets/scripts/ai/handStrength';
import { Rank, Suit, type Card } from '../../assets/scripts/rules';

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

describe('bidConfidence', () => {
  it('marks weak hands as low and not recommended', () => {
    expect(bidConfidence([c(Rank.R3), c(Rank.R4), c(Rank.R5)])).toMatchObject({
      tier: 'low',
      recommendCall: false,
    });
  });

  it('marks strong hands as high and recommended', () => {
    const hand = [...four(Rank.A), ...four(Rank.R2), c(Rank.SmallJoker), c(Rank.BigJoker)];
    expect(bidConfidence(hand)).toMatchObject({
      tier: 'high',
      recommendCall: true,
    });
  });

  it('uses evaluateHand score directly', () => {
    const hand = [...four(Rank.K), c(Rank.R2)];

    expect(bidConfidence(hand).score).toBe(evaluateHand(hand).score);
  });

  it('maps threshold boundaries', () => {
    // Hands chosen to lock the threshold behavior against the current evaluateHand formula.
    expect(bidConfidence([...four(Rank.Q), c(Rank.R2), c(Rank.A)]).tier).toBe('mid');
    expect(bidConfidence([...four(Rank.Q), c(Rank.R2), c(Rank.A)]).recommendCall).toBe(true);
  });

  it('is deterministic', () => {
    const hand = [...four(Rank.R9), c(Rank.SmallJoker), c(Rank.BigJoker)];
    expect(bidConfidence(hand)).toEqual(bidConfidence(hand));
  });
});
