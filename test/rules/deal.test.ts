import { describe, it, expect } from 'vitest';
import { createDeck, createRng, shuffle, deal } from '../../assets/scripts/rules';

const ids = (cs: { rank: number; suit: string }[]) => cs.map((c) => `${c.rank}-${c.suit}`);

describe('rng / deal', () => {
  it('同种子洗牌可复现，不同种子不同', () => {
    const a = ids(shuffle(createDeck(), createRng(42)));
    const b = ids(shuffle(createDeck(), createRng(42)));
    const c = ids(shuffle(createDeck(), createRng(43)));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('发牌 17×3 + 3 底牌，无重复且用尽 54 张', () => {
    const { hands, bottom } = deal(createRng(7));
    expect(hands[0].length).toBe(17);
    expect(hands[1].length).toBe(17);
    expect(hands[2].length).toBe(17);
    expect(bottom.length).toBe(3);
    const all = [...hands[0], ...hands[1], ...hands[2], ...bottom];
    expect(all.length).toBe(54);
    expect(new Set(ids(all)).size).toBe(54);
  });
});
