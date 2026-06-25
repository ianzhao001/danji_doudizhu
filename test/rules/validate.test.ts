import { describe, it, expect } from 'vitest';
import { validatePlay, recognize } from '../../assets/scripts/rules';
import { cards } from './_util';

describe('validatePlay', () => {
  it('非法牌型 → INVALID_PATTERN', () => {
    const r = validatePlay(cards('3 4'));
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('INVALID_PATTERN');
  });

  it('压不过 → CANNOT_BEAT（仍带 pattern）', () => {
    const current = recognize(cards('5 5'))!;
    const r = validatePlay(cards('3 3'), current);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('CANNOT_BEAT');
    expect(r.pattern?.category).toBeDefined();
  });

  it('合法领出 / 合法压过 → ok', () => {
    expect(validatePlay(cards('3 3 3')).ok).toBe(true);
    const current = recognize(cards('3 3'))!;
    expect(validatePlay(cards('4 4'), current).ok).toBe(true);
  });
});
