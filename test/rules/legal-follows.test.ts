import { describe, it, expect } from 'vitest';
import { recognize, legalFollows, Category } from '../../assets/scripts/rules';
import { cards } from './_util';

describe('legalFollows 回归（跟牌层）', () => {
  it('大炸弹经 legalFollows 压小炸弹，小炸弹/无解返回空', () => {
    const cur = recognize(cards('4 4 4 4'))!;
    expect(
      legalFollows(cards('5 5 5 5'), cur).some((m) => m.pattern.category === Category.Bomb),
    ).toBe(true);
    expect(legalFollows(cards('3 3 3 3'), cur).length).toBe(0);
  });

  it('火箭经 legalFollows 压炸弹', () => {
    const cur = recognize(cards('K K K K'))!;
    expect(
      legalFollows(cards('x X'), cur).some((m) => m.pattern.category === Category.Rocket),
    ).toBe(true);
  });

  it('同型不同长度不作为跟牌（6 连顺不跟 5 连顺）', () => {
    const cur = recognize(cards('4 5 6 7 8'))!; // 5 连顺
    const follows = legalFollows(cards('5 6 7 8 9 10'), cur);
    // 返回的顺子必须都是 5 张，且确实存在能压过的 5 连顺
    expect(
      follows.every((m) => m.pattern.category !== Category.Straight || m.pattern.length === 5),
    ).toBe(true);
    expect(
      follows.some((m) => m.pattern.category === Category.Straight && m.pattern.length === 5),
    ).toBe(true);
  });
});
