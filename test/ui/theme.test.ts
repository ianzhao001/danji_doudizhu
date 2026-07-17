/**
 * W-VISION S1 主题令牌契约（规划者预写种子 · 2026-07-14 · sota2 · S0 修订 · S5 修订[S4R-R2 卡面回滚]）。
 *
 * 落位机制：Codex 将本文件**原样复制**到 `test/ui/theme.test.ts`（覆盖旧版 T-THEME-TOKENS），
 * 作为独立 commit「seed(W-VISION): relocate planner seeds」；内容一字不得改动，
 * 审查者对 seeds 源文件与落位文件做逐字节一致核。
 *
 * ── 为什么由规划者改而不是执行者改 ──
 * 旧 `theme.test.ts`（T-THEME-TOKENS）把 `typography: {xs,sm,md,lg,xl,display}`（裸 number）
 * 与 `spacing: {xs,sm,md,lg,xl}` 的键集锁死。S1 换成 9 档语义字号 + 7 档语义间距后它必红。
 * 但**契约测试是规划者的**（铁律 4：共享契约文件由规划者维护）——执行者若自己改契约测试，
 * sota2 的独立性就塌了。故 S1 报 blocked 是**正确行为**，由规划者出新契约解阻。
 *
 * ── 继承的旧不变量（逐条保留，不弱化）──
 *   · THEME 及全部嵌套对象 Object.isFrozen
 *   · 所有 ThemeColor 通道为 0–255 整数；palette 恰 16 键
 *   · theme.ts 源码不含 `from 'cc'`（纯岛）
 *   · 快照锁形：分组与键集合与契约一致
 *   · typography / spacing 单调递增
 *
 * ── 新契约 ──
 *   · typography 每档形如 { size, lineHeight }（不再是裸 number）
 *   · 9 档**规范音阶**（assistive…display）严格单调递增；`cardRank` 回滚 v1.6 的 **13/16**
 *     （W-VISION S4R-R2 用户裁决,不再复用 `sectionTitle` 22）；`cardRank.size` 与 `meta` 同号(13),
 *     使「牌面点数」有语义键而**不引入第 10 个字号**——门 K2 只数去重后的数值档数。
 *   · spacing 7 档语义令牌，按声明序严格单调递增。
 *
 * ── 有意不锁的东西 ──
 *   **不硬锁 lineHeight 的具体数值**，只锁 `lineHeight >= size`。
 *   原因：门 B 的字形带公式是 `gh = min(h, lineHeight × lines)`，行高必须按**盖字皮的实测净区**
 *   反推上限（陷阱②）。硬锁数值会把实现方按死在拍脑袋的初值上——S1 已据实测净区把小字档
 *   从 11/14、13/17、14/20 收紧到 11/12、13/15、14/18，这正是我们要的行为。
 *
 * ── 预期红因 ──
 *   S1 实现前：旧 THEME `typography.assistive` 不存在（键集 xs..display）→ 快照锁形红；裸 number 无 .size → 音阶/形状红。
 *   S5 修订前：S4R-R2 已把 `cardRank` 回滚 13/16,但旧契约仍断言 `cardRank.size === sectionTitle.size(22)` → 1 红（本次修订消除）。
 */
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
  typography: [
    'assistive',
    'secondary',
    'meta',
    'body',
    'action',
    'prominentAction',
    'sectionTitle',
    'cardRank',
    'hero',
    'display',
  ],
  spacing: ['tight', 'default', 'card', 'comfortable', 'section', 'safe', 'wide'],
  radius: ['sm', 'md', 'lg', 'pill'],
  alpha: ['disabled', 'hover', 'pressed', 'scrim'],
};

/** 9 档规范音阶（按 size 升序）。`cardRank` 不在此列——它回滚 v1.6=13/16,与 meta 同号(13)但 lineHeight 异,不占规范音阶档。 */
const TYPE_SCALE = [
  'assistive',
  'secondary',
  'meta',
  'body',
  'action',
  'prominentAction',
  'sectionTitle',
  'hero',
  'display',
] as const;

/** spacing 的声明序即升序。 */
const SPACING_SCALE = ['tight', 'default', 'card', 'comfortable', 'section', 'safe', 'wide'] as const;

function isThemeColor(value: unknown): value is ThemeColor {
  if (!value || typeof value !== 'object') return false;
  const channels = value as ThemeColor;
  return (['r', 'g', 'b', 'a'] as const).every(
    (key) => Number.isInteger(channels[key]) && channels[key] >= 0 && channels[key] <= 255,
  );
}

function assertMonotonicIncreasing(values: number[], label: string): void {
  for (let i = 1; i < values.length; i += 1) {
    expect(values[i], `${label}[${i}] 应严格大于前一档`).toBeGreaterThan(values[i - 1]);
  }
}

describe('W-VISION theme.ts 令牌契约', () => {
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
    for (const step of Object.values(THEME.typography)) {
      expect(Object.isFrozen(step)).toBe(true);
    }
  });

  it('所有 ThemeColor 通道均为 0–255 整数', () => {
    for (const color of Object.values(THEME.palette)) {
      expect(isThemeColor(color)).toBe(true);
    }
  });

  it('typography 每档形如 { size, lineHeight }，且 lineHeight ≥ size', () => {
    const table = THEME.typography as unknown as Record<string, unknown>;
    for (const role of EXPECTED_SHAPE.typography) {
      const step = table[role] as { size?: unknown; lineHeight?: unknown } | undefined;
      expect(step, `typography.${role} 缺失`).toBeTruthy();
      expect(typeof step, `typography.${role} 应为对象，不是裸数字`).toBe('object');
      const { size, lineHeight } = step as { size: unknown; lineHeight: unknown };
      expect(Number.isInteger(size), `typography.${role}.size 应为整数`).toBe(true);
      expect(Number.isInteger(lineHeight), `typography.${role}.lineHeight 应为整数`).toBe(true);
      expect(lineHeight as number, `typography.${role}.lineHeight ≥ size`).toBeGreaterThanOrEqual(size as number);
    }
  });

  it('9 档规范音阶严格单调递增；cardRank 回滚 v1.6 13/16 且与 meta 同号（不引入第 10 个字号）', () => {
    const table = THEME.typography as unknown as Record<string, { size: number; lineHeight: number }>;
    assertMonotonicIncreasing(
      TYPE_SCALE.map((role) => table[role].size),
      'typography.size',
    );
    // W-VISION S4R-R2 用户裁决:牌面点数回滚 v1.6 的 13/16,不再复用 sectionTitle(22)。
    // 这是用户显式钉死的回滚值(例外于「不硬锁 lineHeight」——防止漂回 22),故硬锁 13/16。
    expect(table.cardRank.size, 'cardRank.size 回滚 v1.6 = 13').toBe(13);
    expect(table.cardRank.lineHeight, 'cardRank.lineHeight 回滚 v1.6 = 16').toBe(16);
    // cardRank.size(13) 与 meta.size(13) 同号 → 去重后仍是 9 档,不引入第 10 个字号。
    expect(table.cardRank.size, 'cardRank.size 与 meta 同号(13)').toBe(table.meta.size);
    // 去重后正好 9 档（与门 K2 的 ≤9 上限对齐）
    const distinct = new Set(Object.values(table).map((step) => step.size));
    expect(distinct.size, `去重字号档数（实际 ${[...distinct].sort((a, b) => a - b).join('/')}）`).toBe(
      TYPE_SCALE.length,
    );
  });

  it('spacing 7 档语义令牌，按声明序严格单调递增', () => {
    const table = THEME.spacing as unknown as Record<string, number>;
    assertMonotonicIncreasing(
      SPACING_SCALE.map((role) => table[role]),
      'spacing',
    );
  });

  it("theme.ts 源码不含 from 'cc'", () => {
    const source = readFileSync(new URL('../../assets/scripts/ui/theme.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/from\s+['"]cc['"]/);
  });

  it('快照锁形：分组与键集合与契约一致', () => {
    const theme = THEME as Theme;
    expect(Object.keys(theme).sort()).toEqual(Object.keys(EXPECTED_SHAPE).sort());
    for (const [group, keys] of Object.entries(EXPECTED_SHAPE)) {
      expect(Object.keys(theme[group as keyof Theme]).sort(), `${group} 键集`).toEqual([...keys].sort());
    }
    expect(Object.keys(THEME.palette)).toHaveLength(16);
  });
});
