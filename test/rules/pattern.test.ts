import { describe, it, expect } from 'vitest';
import { recognize, Category } from '../../assets/scripts/rules';
import { cards } from './_util';

const cat = (spec: string) => recognize(cards(spec))?.category;

describe('pattern recognition', () => {
  it('基础牌型', () => {
    expect(cat('3')).toBe(Category.Single);
    expect(cat('3 3')).toBe(Category.Pair);
    expect(cat('3 3 3')).toBe(Category.Trips);
    expect(cat('3 3 3 4')).toBe(Category.TripsSingle);
    expect(cat('3 3 3 4 4')).toBe(Category.TripsPair);
    expect(cat('3 3 3 3')).toBe(Category.Bomb);
    expect(cat('x X')).toBe(Category.Rocket);
  });

  it('顺子：>=5 连续单，排除 2 和王', () => {
    expect(cat('3 4 5 6 7')).toBe(Category.Straight);
    expect(cat('10 J Q K A')).toBe(Category.Straight);
    expect(recognize(cards('3 4 5 6'))).toBeNull(); // 不足 5 张
    expect(recognize(cards('J Q K A 2'))).toBeNull(); // 含 2
    expect(recognize(cards('A 2 3 4 5'))).toBeNull(); // 含 2 且不连续
  });

  it('连对：>=3 连续对，排除 2 和王', () => {
    expect(cat('3 3 4 4 5 5')).toBe(Category.ConsecutivePairs);
    expect(recognize(cards('3 3 4 4'))).toBeNull(); // 不足 3 对
    expect(recognize(cards('K K A A 2 2'))).toBeNull(); // 含 2
  });

  it('飞机：连续三张 ± 等量翼，翼型须匹配', () => {
    expect(cat('3 3 3 4 4 4')).toBe(Category.Airplane);
    expect(cat('3 3 3 4 4 4 5 6')).toBe(Category.AirplaneSingles);
    expect(cat('3 3 3 4 4 4 5 5 6 6')).toBe(Category.AirplanePairs);
    expect(recognize(cards('3 3 3 4 4 4 5 5 6'))).toBeNull(); // 9 张，翼数/翼型不匹配
    expect(recognize(cards('3 3 3 4 4 4 5 5'))).toBeNull(); // 对子不能当两张单翼
  });

  it('四带二是非炸弹', () => {
    expect(cat('3 3 3 3 4 5')).toBe(Category.FourPlusTwoSingles);
    expect(cat('3 3 3 3 4 4 5 5')).toBe(Category.FourPlusTwoPairs);
    expect(recognize(cards('3 3 3 3 4 4'))).toBeNull(); // 一对不能当两张单牌
  });

  it('非法组合返回 null', () => {
    expect(recognize(cards('3 4'))).toBeNull();
    expect(recognize(cards('3 3 4'))).toBeNull();
    expect(recognize([])).toBeNull();
  });
});
