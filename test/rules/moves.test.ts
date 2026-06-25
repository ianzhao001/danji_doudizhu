import { describe, it, expect } from 'vitest';
import {
  enumerateMoves,
  legalFollows,
  recognize,
  beats,
  Category,
} from '../../assets/scripts/rules';
import { cards } from './_util';

const rankKey = (cs: { rank: number }[]) => cs.map((c) => c.rank).sort((a, b) => a - b).join(',');
const specKey = (spec: string) => rankKey(cards(spec));
const rankCounts = (cs: { rank: number }[]): Map<number, number> => {
  const out = new Map<number, number>();
  for (const c of cs) out.set(c.rank, (out.get(c.rank) ?? 0) + 1);
  return out;
};

const keysFor = (handSpec: string, category: Category): Set<string> =>
  new Set(
    enumerateMoves(cards(handSpec))
      .filter((m) => m.pattern.category === category)
      .map((m) => rankKey(m.cards)),
  );

describe('moves enumeration', () => {
  it('enumerateMoves 只产合法牌型', () => {
    const hand = cards('3 3 3 4 5 6 7 8');
    const handCounts = rankCounts(hand);
    const moves = enumerateMoves(hand);
    expect(moves.length).toBeGreaterThan(0);
    for (const m of moves) {
      const p = recognize(m.cards);
      expect(p).not.toBeNull();
      expect(p!.category).toBe(m.pattern.category);
      expect(m.cards.length).toBeLessThanOrEqual(hand.length);
      for (const [rank, n] of rankCounts(m.cards)) {
        expect(n).toBeLessThanOrEqual(handCounts.get(rank) ?? 0);
      }
    }
  });

  it('能枚举出预期牌型（单/三张/顺子）', () => {
    const set = new Set(enumerateMoves(cards('3 3 3 4 5 6 7 8')).map((m) => m.pattern.category));
    expect(set.has(Category.Single)).toBe(true);
    expect(set.has(Category.Trips)).toBe(true);
    expect(set.has(Category.Straight)).toBe(true);
  });

  it('legalFollows 只产能压过当前牌权的着法', () => {
    const hand = cards('4 5 6 7 8 9 9 9');
    const current = recognize(cards('3'))!; // 单张 3
    const follows = legalFollows(hand, current);
    expect(follows.length).toBeGreaterThan(0);
    for (const m of follows) expect(beats(m.pattern, current)).toBe(true);
    expect(follows.some((m) => m.pattern.category === Category.Single)).toBe(true);
  });

  it('无解时 legalFollows 为空', () => {
    const hand = cards('3 4 5'); // 仅有最小单牌
    const current = recognize(cards('2'))!; // 单张 2
    expect(legalFollows(hand, current).length).toBe(0);
  });

  it('飞机带单枚举全部点数组合', () => {
    const keys = keysFor('3 3 3 4 4 4 5 6 7', Category.AirplaneSingles);
    expect(keys).toEqual(new Set([
      specKey('3 3 3 4 4 4 5 6'),
      specKey('3 3 3 4 4 4 5 7'),
      specKey('3 3 3 4 4 4 6 7'),
    ]));
  });

  it('飞机带对枚举全部点数组合', () => {
    const keys = keysFor('3 3 3 4 4 4 5 5 6 6 7 7', Category.AirplanePairs);
    expect(keys).toEqual(new Set([
      specKey('3 3 3 4 4 4 5 5 6 6'),
      specKey('3 3 3 4 4 4 5 5 7 7'),
      specKey('3 3 3 4 4 4 6 6 7 7'),
    ]));
  });

  it('四带二单牌枚举全部点数组合', () => {
    const keys = keysFor('3 3 3 3 4 5 6', Category.FourPlusTwoSingles);
    expect(keys).toEqual(new Set([
      specKey('3 3 3 3 4 5'),
      specKey('3 3 3 3 4 6'),
      specKey('3 3 3 3 5 6'),
    ]));
  });

  it('四带二对子枚举全部点数组合', () => {
    const keys = keysFor('3 3 3 3 4 4 5 5 6 6', Category.FourPlusTwoPairs);
    expect(keys).toEqual(new Set([
      specKey('3 3 3 3 4 4 5 5'),
      specKey('3 3 3 3 4 4 6 6'),
      specKey('3 3 3 3 5 5 6 6'),
    ]));
  });

  it('炸弹和火箭可作为跟牌压非炸弹', () => {
    const follows = legalFollows(cards('4 4 4 4 5 x X'), recognize(cards('A A'))!);
    expect(follows.some((m) => m.pattern.category === Category.Bomb)).toBe(true);
    expect(follows.some((m) => m.pattern.category === Category.Rocket)).toBe(true);
  });
});
