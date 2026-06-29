import { describe, expect, it } from 'vitest';
import { adviseAction } from '../../assets/scripts/ai/insight';
import { evaluateHand } from '../../assets/scripts/ai/handStrength';
import {
  Category,
  Rank,
  Suit,
  recognize,
  type Card,
  type HandPattern,
} from '../../assets/scripts/rules';

function c(rank: Rank, suit: Suit = Suit.Spade): Card {
  return { rank, suit: rank >= Rank.SmallJoker ? Suit.Joker : suit };
}

function top(cards: Card[]): HandPattern {
  const pattern = recognize(cards);
  if (!pattern) throw new Error('expected legal pattern');
  return pattern;
}

describe('adviseAction', () => {
  it('recommends the whole hand when leading with a finishable straight', () => {
    const hand = [Rank.R3, Rank.R4, Rank.R5, Rank.R6, Rank.R7].map((rank) => c(rank));
    const insight = adviseAction(hand, null);

    expect(insight.recommended?.cards).toEqual(hand);
    expect(insight.recommended?.pattern.category).toBe(Category.Straight);
    expect(insight.shouldPass).toBe(false);
    expect(insight.rationale).toContain('一手出完');
  });

  it('returns shouldPass when no follow exists', () => {
    const insight = adviseAction([c(Rank.R3), c(Rank.R4), c(Rank.R5)], top([c(Rank.R2)]));

    expect(insight.recommended).toBeNull();
    expect(insight.shouldPass).toBe(true);
  });

  it('prefers non-bomb hints when leading and not finishing', () => {
    const hand = [
      c(Rank.R3),
      c(Rank.R6),
      c(Rank.R9),
      c(Rank.K),
      c(Rank.K, Suit.Heart),
      c(Rank.K, Suit.Club),
      c(Rank.K, Suit.Diamond),
    ];
    const insight = adviseAction(hand, null);

    expect(insight.recommended?.pattern.category).not.toBe(Category.Bomb);
    expect(insight.rationale).toContain('保留炸弹');
  });

  it('uses finishing follow before ordinary hints', () => {
    const hand = [c(Rank.A)];
    const insight = adviseAction(hand, top([c(Rank.K)]));

    expect(insight.recommended?.cards).toEqual(hand);
    expect(insight.rationale).toContain('一手出完');
  });

  it('includes score from evaluateHand and is deterministic', () => {
    const hand = [c(Rank.R3), c(Rank.R4), c(Rank.R9), c(Rank.R2)];

    const first = adviseAction(hand, null);
    const second = adviseAction(hand, null);
    expect(first.strengthScore).toBe(evaluateHand(hand).score);
    expect(second).toEqual(first);
  });

  it('handles empty hands safely', () => {
    expect(adviseAction([], null)).toEqual({
      recommended: null,
      shouldPass: false,
      rationale: '手牌已空',
      strengthScore: 0,
    });
  });
});
