import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { THEME, type Theme, type ThemeColor } from '../../assets/scripts/ui/theme';

const EXPECTED_SHAPE: Record<string, string[]> = {
  palette: [
    'brand',
    'brandDark',
    'surface',
    'surfaceRaised',
    'overlayScrim',
    'textPrimary',
    'textSecondary',
    'textDisabled',
    'textOnAccent',
    'accentGold',
    'accentCream',
    'danger',
    'success',
    'warning',
    'selectedTint',
    'tableFelt',
  ],
  typography: ['xs', 'sm', 'md', 'lg', 'xl', 'display'],
  spacing: ['xs', 'sm', 'md', 'lg', 'xl'],
  radius: ['sm', 'md', 'lg', 'pill'],
  alpha: ['disabled', 'hover', 'pressed', 'scrim'],
};

function isThemeColor(value: unknown): value is ThemeColor {
  if (!value || typeof value !== 'object') return false;
  const channels = value as ThemeColor;
  return (['r', 'g', 'b', 'a'] as const).every(
    (key) => Number.isInteger(channels[key]) && channels[key] >= 0 && channels[key] <= 255,
  );
}

function assertMonotonicIncreasing(values: number[]): void {
  for (let i = 1; i < values.length; i += 1) {
    expect(values[i]).toBeGreaterThan(values[i - 1]);
  }
}

describe('T-THEME-TOKENS theme.ts', () => {
  it('THEME 及全部嵌套对象 Object.isFrozen 为 true', () => {
    expect(Object.isFrozen(THEME)).toBe(true);
    expect(Object.isFrozen(THEME.palette)).toBe(true);
    expect(Object.isFrozen(THEME.typography)).toBe(true);
    expect(Object.isFrozen(THEME.spacing)).toBe(true);
    expect(Object.isFrozen(THEME.radius)).toBe(true);
    expect(Object.isFrozen(THEME.alpha)).toBe(true);
    for (const color of Object.values(THEME.palette)) {
      expect(Object.isFrozen(color)).toBe(true);
    }
  });

  it('所有 ThemeColor 通道均为 0–255 整数', () => {
    for (const color of Object.values(THEME.palette)) {
      expect(isThemeColor(color)).toBe(true);
    }
  });

  it('typography 与 spacing 各自严格单调递增', () => {
    assertMonotonicIncreasing(Object.values(THEME.typography));
    assertMonotonicIncreasing(Object.values(THEME.spacing));
  });

  it('theme.ts 源码不含 from \'cc\'', () => {
    const source = readFileSync(new URL('../../assets/scripts/ui/theme.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/from\s+['"]cc['"]/);
  });

  it('快照锁形：分组与键集合与契约一致', () => {
    const theme = THEME as Theme;
    expect(Object.keys(theme).sort()).toEqual(Object.keys(EXPECTED_SHAPE).sort());
    for (const [group, keys] of Object.entries(EXPECTED_SHAPE)) {
      expect(Object.keys(theme[group as keyof Theme]).sort()).toEqual([...keys].sort());
    }
    expect(Object.keys(THEME.palette)).toHaveLength(16);
  });
});
