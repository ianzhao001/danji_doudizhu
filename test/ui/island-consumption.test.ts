/**
 * W-VISION S5b 岛消费契约（规划者预写红种子 · 2026-07-16 · sota2）。
 *
 * 落位：Codex 逐字节复制到 test/ui/island-consumption.test.ts（新建），独立 seed commit。
 *
 * ── 契约 ──
 *   S5a 落地的两个纯岛必须被产品运行时真实消费——测过而不接线的岛是僵尸代码：
 *   · `ui/pattern-label.ts` 的 `patternLabel`：牌型标签浮现（出牌落定后的「顺子/三带一/炸弹…」气泡）。
 *   · `ui/score-roll.ts` 的 `scoreRollFrames`：结算分数滚动（结算面板分数逐帧滚到终值）。
 *   断言：assets/scripts 产品代码（岛文件自身除外）中，各存在 ≥1 个 import 消费点与 ≥1 个调用点。
 *
 * ── 预期红（S5b 接线前）── 两岛消费点均为 0 → 4 断言红。接线后转绿。
 *
 * ── 负向变异自证（执行者接线后自查，报告注明红几条）──
 *   ① 临时把 patternLabel 的消费 import 删掉 → 红 2（import + 调用点）。
 *   ② 临时把 scoreRollFrames 调用改为手写插值 → 红 ≥1（调用点消失）。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SCRIPTS_ROOT = fileURLToPath(new URL('../../assets/scripts', import.meta.url));
const ISLAND_FILES = new Set(['ui/pattern-label.ts', 'ui/score-roll.ts']);

function productSources(): Array<{ rel: string; source: string }> {
  return readdirSync(SCRIPTS_ROOT, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => {
      const abs = join(entry.parentPath, entry.name);
      return { rel: relative(SCRIPTS_ROOT, abs).split('\\').join('/'), source: readFileSync(abs, 'utf8') };
    })
    .filter(({ rel }) => !ISLAND_FILES.has(rel));
}

const IMPORT_PATTERN_LABEL = /from\s+['"][^'"]*\/pattern-label['"]/;
const IMPORT_SCORE_ROLL = /from\s+['"][^'"]*\/score-roll['"]/;
const CALL_PATTERN_LABEL = /\bpatternLabel\s*\(/;
const CALL_SCORE_ROLL = /\bscoreRollFrames\s*\(/;

describe('W-VISION S5b 岛消费契约（防僵尸岛）', () => {
  it('门自证：探测器认得真实消费形态，并拒绝无关文本', () => {
    expect(IMPORT_PATTERN_LABEL.test("import { patternLabel } from '../../pattern-label';")).toBe(true);
    expect(IMPORT_SCORE_ROLL.test("import { scoreRollFrames } from '../score-roll';")).toBe(true);
    expect(CALL_PATTERN_LABEL.test('const text = patternLabel(pattern.category);')).toBe(true);
    expect(CALL_SCORE_ROLL.test('for (const value of scoreRollFrames(prev, next, steps)) {')).toBe(true);
    expect(IMPORT_PATTERN_LABEL.test("import { t } from './strings';")).toBe(false);
    // 调用点探测是文本级(注释里的 patternLabel(x) 也会命中)——故调用点断言必须与 import
    // 断言成对使用:仅注释提及而无真实 import 时,import 断言仍红,契约不可被注释骗绿。
    expect(CALL_PATTERN_LABEL.test('// 曾在注释提及 patternLabel(category) 也算文本命中')).toBe(true);
    expect(CALL_PATTERN_LABEL.test('// 仅提及 patternLabel 名字而不带调用括号不命中')).toBe(false);
  });

  it('patternLabel 在产品代码中有 ≥1 个 import 消费点与调用点（牌型标签浮现）', () => {
    const sources = productSources();
    const importers = sources.filter(({ source }) => IMPORT_PATTERN_LABEL.test(source));
    const callers = sources.filter(({ source }) => CALL_PATTERN_LABEL.test(source));
    expect(importers.length, `pattern-label 岛无产品消费(僵尸岛): importers=${importers.map((f) => f.rel).join(',')}`)
      .toBeGreaterThanOrEqual(1);
    expect(callers.length, 'patternLabel 无产品调用点').toBeGreaterThanOrEqual(1);
  });

  it('scoreRollFrames 在产品代码中有 ≥1 个 import 消费点与调用点（结算分数滚动）', () => {
    const sources = productSources();
    const importers = sources.filter(({ source }) => IMPORT_SCORE_ROLL.test(source));
    const callers = sources.filter(({ source }) => CALL_SCORE_ROLL.test(source));
    expect(importers.length, `score-roll 岛无产品消费(僵尸岛): importers=${importers.map((f) => f.rel).join(',')}`)
      .toBeGreaterThanOrEqual(1);
    expect(callers.length, 'scoreRollFrames 无产品调用点').toBeGreaterThanOrEqual(1);
  });
});
