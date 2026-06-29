import { describe, expect, it } from 'vitest';
import { Category, Rank, Suit, type Card, type Move } from '../../assets/scripts/rules';
import type { ActionInsight } from '../../assets/scripts/ai/insight';
import { deriveInsightView } from '../../assets/scripts/ui/insight-view';

function singleMove(rank: Rank): Move {
  const card: Card = { rank, suit: Suit.Spade };
  return {
    cards: [card],
    pattern: { category: Category.Single, mainRank: rank, length: 1, cards: [card] },
  };
}

function insight(overrides: Partial<ActionInsight> = {}): ActionInsight {
  return {
    recommended: singleMove(Rank.R3),
    shouldPass: false,
    rationale: '先出小牌，尽量保留炸弹',
    strengthScore: 40,
    ...overrides,
  };
}

describe('deriveInsightView', () => {
  it('uses rationale as recommendation text', () => {
    expect(deriveInsightView(insight()).text).toBe('先出小牌，尽量保留炸弹');
  });

  it('uses pass copy and pass flag when pass is recommended', () => {
    const view = deriveInsightView(
      insight({ recommended: null, shouldPass: true, rationale: '没有合适跟牌，建议过牌' }),
    );

    expect(view.text).toBe('建议过牌');
    expect(view.isPass).toBe(true);
  });

  it('keeps empty-hand insight visually quiet', () => {
    expect(
      deriveInsightView(insight({ recommended: null, shouldPass: false, rationale: '手牌已空' })),
    ).toEqual({ text: '', isPass: false, emphasize: false });
  });

  it('emphasizes strong hands at the threshold', () => {
    expect(deriveInsightView(insight({ strengthScore: 66 }))).toMatchObject({ emphasize: false });
    expect(deriveInsightView(insight({ strengthScore: 67 }))).toMatchObject({ emphasize: true });
  });
});
