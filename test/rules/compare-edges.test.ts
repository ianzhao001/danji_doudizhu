import { describe, expect, it } from 'vitest';

import { beats, recognize } from '../../assets/scripts/rules';
import { cards } from './_util';

const P = (spec: string) => recognize(cards(spec))!;

describe('compare / beats edge cases', () => {
  it('does not allow equal mainRank to beat itself', () => {
    expect(beats(P('5 5'), P('5 5'))).toBe(false);
  });

  it('defensively returns false for nullish patterns', () => {
    expect(beats(null as any, P('3'))).toBe(false);
    expect(beats(P('4'), null as any)).toBe(false);
    expect(beats(undefined as any, P('3'))).toBe(false);
    expect(beats(P('4'), undefined as any)).toBe(false);
  });

  it('does not allow rocket to beat rocket', () => {
    expect(beats(P('x X'), P('x X'))).toBe(false);
  });

  it('keeps normal same-type ordering intact', () => {
    expect(beats(P('6 6'), P('5 5'))).toBe(true);
  });

  it('orders bombs and rocket correctly', () => {
    expect(beats(P('3 3 3 3'), P('A'))).toBe(true);
    expect(beats(P('3 3 3 3'), P('A A'))).toBe(true);
    expect(beats(P('3 4 5 6 7'), P('3 3 3 3'))).toBe(false);
    expect(beats(P('4 4 4 4'), P('3 3 3 3'))).toBe(true);
    expect(beats(P('3 3 3 3'), P('3 3 3 3'))).toBe(false);
    expect(beats(P('x X'), P('4 4 4 4'))).toBe(true);
    expect(beats(P('4 4 4 4'), P('x X'))).toBe(false);
  });

  it('rejects cross-type and same-type different-length comparisons', () => {
    expect(beats(P('4 4'), P('3'))).toBe(false);
    expect(beats(P('7 8 9 10 J Q'), P('3 4 5 6 7'))).toBe(false);
  });
});
