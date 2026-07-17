/**
 * W-VISION S1 排印与间距静态门（门 K / 门 L）——规划者预写种子 · 2026-07-14 · sota2。
 *
 * 落位机制：Codex 开工 S1 时将本文件**原样复制**到 `test/ui/typography-gate.test.ts`（新文件），
 * 作为独立 commit「seed(W-VISION): relocate planner seeds」；内容一字不得改动，
 * 审查者对 seeds 源文件与落位文件做逐字节一致核。
 *
 * ── 为什么要这道门 ──
 * 源码普查实测：裸字号 11 档（10/11/12/13/14/15/16/18/22/24/26）+ THEME 6 档（11/13/16/20/24/28）
 * = **并集 13 档**；还有**算出来的字号**（`panelHeight / 2 - 34`、`compactHero ? 10 : 12`）。
 * `THEME.spacing`（4/8/12/16/24）声明了但**消费次数 = 0**，全是散落魔数。
 * 参考得物 DS 规范 DW-A11（字号阶梯，单产物 ≤9 档）与 DW-A14（间距节奏）收敛。
 *
 * ── 门 K 排印 ──
 *   K1 THEME.typography 每档形如 { size, lineHeight }（当前是裸 number → 红）
 *   K2 去重 size ≤9 档、全部 ∈ 得物阶梯、最小 ≥11
 *   K3 ui/components/** 零裸 fontSize 数字字面量
 *   K4 ui/components/** 零裸 lineHeight 数字字面量
 *   K5 ui/components/** 零「算出来的字号」（fontSize 赋表达式）
 *   K6 ui/components/** 除 ui-helpers.ts 外，addComponent(Label) 出现 0 次
 *      —— Cocos Label.overflow 默认值是 NONE，裸建 Label 会让**门 A 立红**；
 *         全场 Label 必须经 ui-helpers 的唯一出口，由它统一赋字体 + overflow。
 *   K7 addLabel 走语义角色签名（把「裸数字字号」挡在类型层）
 *
 * ── 门 L 间距 ──
 *   L1 THEME.spacing 为 7 档语义令牌，值集 ⊆ {4,8,10,12,16,20,24}
 *   L2 THEME.spacing 被真实消费（≥5 个 ui/components 文件）——当前 0
 *   注：区域几何豁免。`table-zones.ts` / `table-layout.ts` 的 `clamp(w*0.135, …)` 是布局比例，
 *      不是间距，不在本门辖区（本门只扫 ui/components/**）。
 *
 * ── 预期红因（实现前，typecheck 应保持净）──
 *   K1/K2 红：THEME.typography 现为 { xs:11, sm:13, md:16, lg:20, xl:24, display:28 }（裸 number，
 *            无 lineHeight；且 28 ∉ 得物阶梯）。
 *   K3/K4/K5 红：top-bar/seats/play-area/lobby 等处大量裸数字与算式字号。
 *   K6 红：待实测（若已为 0 则本条先绿，作为回归护栏保留）。
 *   K7 红：ui-helpers 的 addLabel 现为位置参数、第 4 参是裸 number。
 *   L1/L2 红：spacing 现为 { xs:4, sm:8, md:12, lg:16, xl:24 }（5 档、命名非语义）且零消费。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { THEME } from '../../assets/scripts/ui/theme';

// 本文件落位在 test/ui/ → 回到仓根需要两级（`../../`）。
// 规划者 S0 首版误抄了 architecture-gates.test.ts（它在 test/ 下，只需一级）的 `../`，
// 导致 readdirSync 抛 ENOENT，K3–K7/L2 变成「假红」——红在路径上，不在契约上。已修（S0 修订 · 2026-07-14）。
const SCRIPTS_ROOT = fileURLToPath(new URL('../../assets/scripts', import.meta.url));
const COMPONENTS_ROOT = join(SCRIPTS_ROOT, 'ui', 'components');

/** 得物 DW-A11 字号阶梯（固定 px）。单产物 ≤9 档。 */
const DEWU_LADDER = new Set([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 30]);
const MAX_SIZE_STEPS = 9;
/** 可见文字下限：11px（得物阶梯有 10，但游戏在 780×360 上 10px 已不可读）。 */
const MIN_READABLE_SIZE = 11;

/** 得物 DW-A14 间距节奏 + layout.md（页面内容 20 / 卡片间 10）。 */
const SPACING_LADDER = new Set([4, 8, 10, 12, 16, 20, 24]);
const SPACING_ROLES = ['tight', 'default', 'card', 'comfortable', 'section', 'safe', 'wide'];
/** spacing 令牌必须真正接线，不能只是声明。 */
const MIN_SPACING_CONSUMER_FILES = 5;

/** Label 的唯一出口——只有它可以裸建 Label / 设 overflow / 赋字体。 */
const LABEL_FACTORY = 'ui/components/ui-helpers.ts';

function listTsFiles(root: string): string[] {
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => join(entry.parentPath, entry.name));
}

/**
 * 去注释后再匹配（与 architecture-gates.test.ts 同款六态扫描器）：
 * 门禁语义是「代码消费」，允许注释里提及被禁词（复盘注释不算违规）。
 * 注释替换为空格（保留换行），字符串内容原样保留——禁词藏进字符串只可能误报（fail-safe）。
 */
function stripComments(source: string): string {
  type Mode = 'code' | 'line' | 'block' | 'single' | 'double' | 'template';
  let mode: Mode = 'code';
  let out = '';
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];
    if (mode === 'code') {
      if (ch === '/' && next === '/') { mode = 'line'; out += '  '; i++; continue; }
      if (ch === '/' && next === '*') { mode = 'block'; out += '  '; i++; continue; }
      if (ch === "'") mode = 'single';
      else if (ch === '"') mode = 'double';
      else if (ch === '`') mode = 'template';
      out += ch;
      continue;
    }
    if (mode === 'line') {
      if (ch === '\n') { mode = 'code'; out += ch; } else out += ' ';
      continue;
    }
    if (mode === 'block') {
      if (ch === '*' && next === '/') { mode = 'code'; out += '  '; i++; } else out += ch === '\n' ? ch : ' ';
      continue;
    }
    // 字符串三态：原样保留，遇到未转义的同款引号收尾
    out += ch;
    if (ch === '\\') { out += source[i + 1] ?? ''; i++; continue; }
    if (mode === 'single' && ch === "'") mode = 'code';
    else if (mode === 'double' && ch === '"') mode = 'code';
    else if (mode === 'template' && ch === '`') mode = 'code';
  }
  return out;
}

interface Source {
  rel: string;
  code: string;
}

function componentSources(): Source[] {
  return listTsFiles(COMPONENTS_ROOT).map((file) => ({
    rel: relative(SCRIPTS_ROOT, file).split('\\').join('/'),
    code: stripComments(readFileSync(file, 'utf8')),
  }));
}

function hits(sources: Source[], pattern: RegExp): string[] {
  const out: string[] = [];
  for (const { rel, code } of sources) {
    for (const m of code.matchAll(pattern)) {
      out.push(`${rel}: ${m[0].trim()}`);
    }
  }
  return out;
}

describe('门 K 排印静态门（得物 DW-A11 参考）', () => {
  it('K1 THEME.typography 每档形如 { size, lineHeight }（正整数）', () => {
    const table = THEME.typography as unknown as Record<string, unknown>;
    const roles = Object.keys(table);
    expect(roles.length, '至少 6 个语义角色').toBeGreaterThanOrEqual(6);
    for (const role of roles) {
      const step = table[role] as { size?: unknown; lineHeight?: unknown } | number;
      expect(typeof step, `typography.${role} 应为 { size, lineHeight } 对象，不是裸数字`).toBe('object');
      const { size, lineHeight } = step as { size?: unknown; lineHeight?: unknown };
      expect(typeof size, `typography.${role}.size`).toBe('number');
      expect(typeof lineHeight, `typography.${role}.lineHeight`).toBe('number');
      expect(Number.isInteger(size), `typography.${role}.size 为整数`).toBe(true);
      expect(Number.isInteger(lineHeight), `typography.${role}.lineHeight 为整数`).toBe(true);
      expect(lineHeight as number, `typography.${role}.lineHeight ≥ size`).toBeGreaterThanOrEqual(size as number);
    }
  });

  it(`K2 去重字号 ≤${MAX_SIZE_STEPS} 档、全部 ∈ 得物阶梯、最小 ≥${MIN_READABLE_SIZE}`, () => {
    const table = THEME.typography as unknown as Record<string, { size: number }>;
    const sizes = Object.values(table).map((step) => step?.size);
    const distinct = [...new Set(sizes)].sort((a, b) => a - b);
    expect(distinct.length, `去重字号档数（实际 ${distinct.join('/')}）`).toBeLessThanOrEqual(MAX_SIZE_STEPS);
    for (const size of distinct) {
      expect(DEWU_LADDER.has(size), `字号 ${size} 不在得物阶梯 {10..20,22,24,30}`).toBe(true);
      expect(size, `字号 ${size} 低于可读下限`).toBeGreaterThanOrEqual(MIN_READABLE_SIZE);
    }
  });

  it('K3 ui/components/** 零裸 fontSize 数字字面量', () => {
    const bad = hits(componentSources(), /fontSize\s*[:=]\s*\d+/g);
    expect(bad, `裸字号（改用 THEME.typography.<role>）：\n${bad.join('\n')}`).toEqual([]);
  });

  it('K4 ui/components/** 零裸 lineHeight 数字字面量', () => {
    const bad = hits(componentSources(), /lineHeight\s*[:=]\s*\d+/g);
    expect(bad, `裸行高（改用 THEME.typography.<role>）：\n${bad.join('\n')}`).toEqual([]);
  });

  it('K5 ui/components/** 零「算出来的字号」（fontSize 赋表达式）', () => {
    // 例：`panelHeight / 2 - 34`、`compactHero ? 10 : 12` —— 字号不得由几何或分支推导。
    const bad = hits(componentSources(), /fontSize\s*[:=]\s*[^,;)\n]*[+\-*/?]/g);
    expect(bad, `算出来的字号：\n${bad.join('\n')}`).toEqual([]);
  });

  it(`K6 除 ${LABEL_FACTORY} 外零 addComponent(Label)（Label.overflow 默认 NONE 会让门 A 立红）`, () => {
    const bad = componentSources()
      .filter((s) => s.rel !== LABEL_FACTORY)
      .flatMap(({ rel, code }) =>
        [...code.matchAll(/addComponent\(\s*Label\s*\)/g)].map((m) => `${rel}: ${m[0]}`),
      );
    expect(bad, `裸建 Label（一律走 ui-helpers 的 addLabel）：\n${bad.join('\n')}`).toEqual([]);
  });

  it('K7 addLabel 走语义角色签名（把裸数字字号挡在类型层）', () => {
    const factory = componentSources().find((s) => s.rel === LABEL_FACTORY);
    expect(factory, `找不到 ${LABEL_FACTORY}`).toBeDefined();
    expect(
      /role\s*[?]?\s*:\s*TypographyRole/.test(factory!.code),
      'addLabel/addSkinnedButton 的字号参数必须是 TypographyRole 语义角色，不能是 number',
    ).toBe(true);
  });
});

describe('门 L 间距静态门（得物 DW-A14 参考）', () => {
  it(`L1 THEME.spacing 为 ${SPACING_ROLES.length} 档语义令牌，值 ∈ {4,8,10,12,16,20,24}`, () => {
    const table = THEME.spacing as unknown as Record<string, number>;
    expect(Object.keys(table).sort()).toEqual([...SPACING_ROLES].sort());
    for (const [role, value] of Object.entries(table)) {
      expect(typeof value, `spacing.${role}`).toBe('number');
      expect(SPACING_LADDER.has(value), `spacing.${role}=${value} 不在间距阶梯`).toBe(true);
    }
  });

  it(`L2 THEME.spacing 被真实消费（≥${MIN_SPACING_CONSUMER_FILES} 个 ui/components 文件；当前 0）`, () => {
    const consumers = componentSources()
      .filter(({ code }) => /THEME\.spacing\./.test(code))
      .map(({ rel }) => rel);
    expect(
      consumers.length,
      `spacing 令牌消费文件数（实际：${consumers.join(', ') || '无'}）——令牌不能只声明不接线`,
    ).toBeGreaterThanOrEqual(MIN_SPACING_CONSUMER_FILES);
  });
});

describe('门 K/L 自证（门的判据本身也会有 bug，先自证门再信门）', () => {
  it('注释与字符串里的禁词不计数（去注释扫描器有效）', () => {
    const src = "// fontSize = 14\n/* lineHeight: 20 */\nconst s = 'fontSize = 99';\nconst n = 1;";
    const code = stripComments(src);
    expect(/fontSize\s*[:=]\s*\d+/.test(code.replace(/'[^']*'/g, "''")), '注释里的字号不应计数').toBe(false);
    expect(code.includes('const n = 1;'), '代码本体保留').toBe(true);
  });

  it('真实的裸字号会被抓到（正例）', () => {
    const code = stripComments('label.fontSize = 13;');
    expect(/fontSize\s*[:=]\s*\d+/.test(code)).toBe(true);
  });

  it('算出来的字号会被抓到（正例）', () => {
    expect(/fontSize\s*[:=]\s*[^,;)\n]*[+\-*/?]/.test('fontSize: panelHeight / 2 - 34,')).toBe(true);
    expect(/fontSize\s*[:=]\s*[^,;)\n]*[+\-*/?]/.test('fontSize: compactHero ? 10 : 12,')).toBe(true);
  });

  it('裸建 Label 会被抓到（正例）', () => {
    expect(/addComponent\(\s*Label\s*\)/.test('const l = node.addComponent(Label);')).toBe(true);
  });
});
