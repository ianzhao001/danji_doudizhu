import { describe, it, expect } from 'vitest';
import { recognize, beats } from '../../assets/scripts/rules';
import { cards } from './_util';

const P = (s: string) => recognize(cards(s))!;

describe('compare / beats', () => {
  it('同型更大者胜，需同张数', () => {
    expect(beats(P('4'), P('3'))).toBe(true);
    expect(beats(P('3'), P('4'))).toBe(false);
    expect(beats(P('4 5 6 7 8'), P('3 4 5 6 7'))).toBe(true);
    expect(beats(P('3 4 5 6 7 8'), P('3 4 5 6 7'))).toBe(false); // 长度不同不可比
  });

  it('跨型不可比', () => {
    expect(beats(P('3 3'), P('4'))).toBe(false);
    expect(beats(P('3 3 3'), P('4 4'))).toBe(false);
  });

  it('炸弹压非炸弹、大炸弹压小炸弹、火箭压一切', () => {
    expect(beats(P('3 3 3 3'), P('A A'))).toBe(true);
    expect(beats(P('A A'), P('3 3 3 3'))).toBe(false);
    expect(beats(P('4 4 4 4'), P('3 3 3 3'))).toBe(true);
    expect(beats(P('x X'), P('3 3 3 3'))).toBe(true);
    expect(beats(P('x X'), P('2'))).toBe(true);
    expect(beats(P('3 3 3 3'), P('x X'))).toBe(false);
  });
});
