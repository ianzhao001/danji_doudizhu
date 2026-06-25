import { describe, it, expect } from 'vitest';
import { createDeck, Rank, Suit } from '../../assets/scripts/rules';

describe('card / deck', () => {
  it('54 张且组成正确', () => {
    const d = createDeck();
    expect(d.length).toBe(54);
    expect(d.filter((c) => c.suit === Suit.Joker).length).toBe(2);
    expect(d.filter((c) => c.rank === Rank.R3).length).toBe(4);
    const ids = new Set(d.map((c) => `${c.rank}-${c.suit}`));
    expect(ids.size).toBe(54);
  });

  it('点数强度顺序：A < 2 < 小王 < 大王，3 最小', () => {
    expect(Rank.R3 < Rank.R4).toBe(true);
    expect(Rank.A < Rank.R2).toBe(true);
    expect(Rank.R2 < Rank.SmallJoker).toBe(true);
    expect(Rank.SmallJoker < Rank.BigJoker).toBe(true);
  });
});
