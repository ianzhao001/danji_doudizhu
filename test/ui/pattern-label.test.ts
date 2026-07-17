/**
 * W-VISION S5a 牌型标签纯岛契约（规划者预写红种子 · 2026-07-16 · sota2）。
 *
 * 落位：Codex 逐字节复制到 test/ui/pattern-label.test.ts（新建），作为独立 seed commit；
 * 并新建纯岛 assets/scripts/ui/pattern-label.ts 实现 patternLabel。内容一字不得改动，
 * 审查者对 seeds 源与落位做逐字节一致核。
 *
 * ── 契约 ──
 *   · patternLabel(category: Category): string —— 14 类牌型 → 中文短标签，供「牌型标签浮现」。
 *   · 纯函数、确定性、禁 import 'cc'、禁 Math.random / Date.now / performance.now。
 *   · 全类覆盖（14/14 有标签）、标签非空、两两互异。
 *   · 期望值 = 本文件内独立字面量表 EXPECTED（规划者钉定），不 import 被测实现的任何常量
 *     （避免「自指的门」：期望与实现不得共用同一常量表）。
 *
 * ── 措辞归属 ──
 *   标签**措辞**由规划者提出，属用户可见文案，用户签收时可微调（与颜色同口径）；
 *   但结构契约（全覆盖/非空/互异/锚点）不随措辞变动。W-VISION S5 规格点名「顺子」「三带一」。
 *
 * ── 预期红（实现前）──
 *   assets/scripts/ui/pattern-label.ts 不存在 → 模块解析失败 → 本文件全红 + typecheck TS2307。
 *   建岛并映射 14 类后转绿。
 *
 * ── 负向变异自证（执行者实现后自查，报告注明红几条）──
 *   ① 任一类漏映射（返回空串）→「全类非空」红 1。
 *   ② 两类映射到同一字符串 →「两两互异」红 1。
 *   ③ Straight 标成非「顺子」→「逐类等于期望表」红 1 + 锚点红 1。
 *   ④ 岛内 import 'cc' 或读 Date.now →「纯岛源码」红 1。
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { patternLabel } from '../../assets/scripts/ui/pattern-label';
import { Category } from '../../assets/scripts/rules/pattern';

// 独立期望表（规划者钉定；与被测实现零共享常量）。措辞可由用户签收时微调，不影响结构契约。
const EXPECTED: Record<Category, string> = {
  [Category.Single]: '单张',
  [Category.Pair]: '对子',
  [Category.Trips]: '三张',
  [Category.TripsSingle]: '三带一',
  [Category.TripsPair]: '三带一对',
  [Category.Straight]: '顺子',
  [Category.ConsecutivePairs]: '连对',
  [Category.Airplane]: '飞机',
  [Category.AirplaneSingles]: '飞机带单',
  [Category.AirplanePairs]: '飞机带对',
  [Category.FourPlusTwoSingles]: '四带二',
  [Category.FourPlusTwoPairs]: '四带两对',
  [Category.Bomb]: '炸弹',
  [Category.Rocket]: '王炸',
};

const ALL_CATEGORIES = Object.values(Category).filter((value): value is Category => typeof value === 'number');

describe('W-VISION S5a 牌型标签纯岛', () => {
  it('14 类牌型全部映射到非空字符串', () => {
    expect(ALL_CATEGORIES).toHaveLength(14);
    for (const category of ALL_CATEGORIES) {
      const label = patternLabel(category);
      expect(typeof label, `Category ${Category[category]} 标签应为字符串`).toBe('string');
      expect(label.length, `Category ${Category[category]} 标签非空`).toBeGreaterThan(0);
    }
  });

  it('逐类等于独立期望表', () => {
    for (const category of ALL_CATEGORIES) {
      expect(patternLabel(category), `Category ${Category[category]}`).toBe(EXPECTED[category]);
    }
  });

  it('锚点字面量（W-VISION S5 规格点名 + 通用术语，防整表被同步漂移）', () => {
    expect(patternLabel(Category.Straight)).toBe('顺子');
    expect(patternLabel(Category.TripsSingle)).toBe('三带一');
    expect(patternLabel(Category.Bomb)).toBe('炸弹');
    expect(patternLabel(Category.Rocket)).toBe('王炸');
  });

  it('标签两两互异', () => {
    const labels = ALL_CATEGORIES.map((category) => patternLabel(category));
    expect(new Set(labels).size, '14 个标签应互异').toBe(labels.length);
  });

  it("纯岛：源码不含 cc / 非确定性来源", () => {
    const source = readFileSync(new URL('../../assets/scripts/ui/pattern-label.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/from\s+['"]cc['"]/);
    expect(source).not.toMatch(/\bMath\.random\b/);
    expect(source).not.toMatch(/\bDate\.now\b/);
    expect(source).not.toMatch(/\bperformance\.now\b/);
  });
});
