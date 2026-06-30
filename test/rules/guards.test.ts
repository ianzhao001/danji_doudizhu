import { describe, expect, it } from 'vitest';
import { Category, Rank, Suit } from '../../assets/scripts/rules';
import {
  cardKey,
  hasOwn,
  isCard,
  isCategory,
  isHandPattern,
  isRank,
  isRecord,
  isSuit,
} from '../../assets/scripts/rules/guards';

describe('rules guards', () => {
  it('recognizes plain records without accepting arrays or null', () => {
    expect(isRecord({ value: 1 })).toBe(true);
    expect(isRecord(Object.create(null))).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
  });

  it('checks own properties without following the prototype chain', () => {
    const value = Object.create({ inherited: true }) as Record<string, unknown>;
    value.own = true;

    expect(hasOwn(value, 'own')).toBe(true);
    expect(hasOwn(value, 'inherited')).toBe(false);
  });

  it('builds stable card keys', () => {
    expect(cardKey({ rank: Rank.R3, suit: Suit.Spade })).toBe('3:S');
  });

  it('recognizes card and pattern wire shapes', () => {
    const card = { rank: Rank.R3, suit: Suit.Spade };
    const pattern = { category: Category.Single, mainRank: Rank.R3, length: 1, cards: [card] };

    expect(isRank(Rank.R3)).toBe(true);
    expect(isSuit(Suit.Spade)).toBe(true);
    expect(isCategory(Category.Single)).toBe(true);
    expect(isCard(card)).toBe(true);
    expect(isHandPattern(pattern)).toBe(true);
    expect(isHandPattern({ ...pattern, length: 2 })).toBe(false);
  });
});
