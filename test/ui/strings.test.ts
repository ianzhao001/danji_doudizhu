import { describe, expect, it } from 'vitest';
import { STRINGS, t } from '../../assets/scripts/ui/strings';

describe('strings table', () => {
  it('returns known keys', () => {
    expect(t('lobby.newGame')).toBe('新局');
    expect(t('action.play')).toBe('出牌');
    expect(t('bid.grab')).toBe('抢地主');
    expect(t('result.win')).toBe('胜利');
    expect(t('cue.bomb')).toBe('炸弹');
  });

  it('falls back to fallback or key for missing entries', () => {
    expect(t('missing.key', '兜底')).toBe('兜底');
    expect(t('missing.key')).toBe('missing.key');
  });

  it('is frozen as a readonly runtime table', () => {
    expect(Object.isFrozen(STRINGS)).toBe(true);
  });

  it('uses domain.name key naming', () => {
    for (const key of Object.keys(STRINGS)) {
      expect(key).toMatch(/^[a-z]+\.[A-Za-z][A-Za-z0-9]*$/);
    }
  });
});
