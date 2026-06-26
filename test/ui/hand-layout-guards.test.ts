/**
 * M3-00 绿护栏：layoutHand 输入守卫。
 * 锁定非法 count/尺寸的抛错路径，以及单张溢出居中的允许路径。
 */
import { describe, it, expect } from 'vitest';
import { layoutHand } from '../../assets/scripts/ui/hand-layout';

describe('M3-00 手牌布局输入守卫', () => {
  it('非整数或负数 count 抛错', () => {
    expect(() => layoutHand(1.5, { containerWidth: 390, cardWidth: 60 })).toThrow();
    expect(() => layoutHand(-1, { containerWidth: 390, cardWidth: 60 })).toThrow();
  });

  it('count=0 返回空数组且不校验尺寸', () => {
    expect(layoutHand(0, { containerWidth: 0, cardWidth: 0 })).toEqual([]);
  });

  it('count>=1 时 containerWidth 必须为正有限数', () => {
    for (const containerWidth of [0, -10, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => layoutHand(1, { containerWidth, cardWidth: 60 })).toThrow();
    }
  });

  it('count>=1 时 cardWidth 必须为正有限数', () => {
    for (const cardWidth of [0, -10, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => layoutHand(1, { containerWidth: 390, cardWidth })).toThrow();
    }
  });

  it('多张牌时 cardWidth 大于 containerWidth 抛错', () => {
    expect(() => layoutHand(3, { containerWidth: 390, cardWidth: 400 })).toThrow();
  });

  it('单张牌允许 cardWidth 大于 containerWidth，并返回一个居中 slot', () => {
    const slots = layoutHand(1, { containerWidth: 390, cardWidth: 400 });
    expect(slots).toHaveLength(1);
    expect(slots[0].x + 400 / 2).toBeCloseTo(390 / 2, 5);
  });

  it('正常入参返回对应数量 slot', () => {
    expect(layoutHand(5, { containerWidth: 390, cardWidth: 60 })).toHaveLength(5);
  });
});
