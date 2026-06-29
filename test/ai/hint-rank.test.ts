import { describe, it, expect } from 'vitest';
import { bestHint, rankHints } from '../../assets/scripts/ai/hintRank';
import { Category, Rank, Suit, recognize, type Card } from '../../assets/scripts/rules';

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit });

function pattern(cards: Card[]) {
  const result = recognize(cards);
  if (!result) throw new Error('bad fixture');
  return result;
}

describe('M6-L9 rankHints', () => {
  it('prefers low-value non-bomb singles and keeps bombs last when leading', () => {
    const hand = [
      c(Rank.R3, Suit.Spade),
      c(Rank.R4, Suit.Spade),
      c(Rank.R7, Suit.Spade),
      c(Rank.R7, Suit.Heart),
      c(Rank.R7, Suit.Club),
      c(Rank.R7, Suit.Diamond),
    ];
    const ranked = rankHints(hand, null);
    expect(ranked[0].pattern.category).toBe(Category.Single);
    expect(ranked[0].pattern.mainRank).toBe(Rank.R3);
    expect(ranked[ranked.length - 1].pattern.category).toBe(Category.Bomb);
  });

  it('uses the smallest legal follow that can beat current', () => {
    const current = pattern([c(Rank.A, Suit.Spade)]);
    const hand = [c(Rank.R2, Suit.Spade), c(Rank.BigJoker, Suit.Joker), c(Rank.R3, Suit.Spade)];
    expect(bestHint(hand, current)?.pattern.mainRank).toBe(Rank.R2);
  });

  it('returns null when there is no legal follow', () => {
    const current = pattern([c(Rank.BigJoker, Suit.Joker)]);
    const hand = [c(Rank.R3, Suit.Spade), c(Rank.R4, Suit.Spade)];
    expect(bestHint(hand, current)).toBeNull();
  });

  it('is deterministic for identical input', () => {
    const hand = [
      c(Rank.R3, Suit.Spade),
      c(Rank.R3, Suit.Heart),
      c(Rank.R4, Suit.Spade),
      c(Rank.R4, Suit.Heart),
      c(Rank.SmallJoker, Suit.Joker),
      c(Rank.BigJoker, Suit.Joker),
    ];
    expect(rankHints(hand, null)).toEqual(rankHints(hand, null));
  });

  it('does not mutate the hand', () => {
    const hand = [c(Rank.R3, Suit.Spade), c(Rank.R4, Suit.Spade)];
    const before = hand.map((card) => ({ ...card }));
    rankHints(hand, null);
    expect(hand).toEqual(before);
  });
});
