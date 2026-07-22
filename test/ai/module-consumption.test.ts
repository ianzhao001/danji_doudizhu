/**
 * W-AI-R2 种子 v2：ai 模块消费防僵尸门（规划者修订 · 2026-07-17 · sota2 · 缺陷 D2 长效化）。
 *
 * ── v2 修订记录（R2a 阻断裁决）──
 *   v1 探测器只认「直连 import 模块路径」，把**经 ai/index.ts 桶转出后被产品具名消费**的模块
 *   误判为僵尸（baseline←flow/driver.ts:8、bidding-levels←flow/policies.ts:10 均为真实消费）。
 *   v2 升级为**符号级两层探测**：模块被消费 ⇔ ①产品直连 import 其路径，或
 *   ②产品从 ai 桶具名导入了该模块导出的任一符号。bid-confidence 核实确无产品消费点，
 *   随 hintRank/insight 入 V10 冻结家族白名单（附原因）。candidates.ts 仍为门的诞生判据。
 *
 * 落位：Codex 逐字节复制**覆盖** test/ai/module-consumption.test.ts（重发 seed commit，R2a 棒）。
 * 先例：test/ui/island-consumption.test.ts（S5b 防僵尸岛）。
 *
 * ── 预期红（对 R2 基线 main，预跑实测）── 僵尸清单恰为 [candidates.ts] → 1 红。
 * ── 负向变异自证（执行者实现后自查）──
 *   ① 新增一个无人 import 的 ai 模块 → 红。
 *   ② 把 flow/driver.ts 的桶导入符号改名遮蔽（chooseAction as x 后不再消费）→ baseline 仍绿
 *      （别名剥离后符号命中）——改为彻底删除该导入 → baseline 红（证明②层探测真在工作）。
 *   ③ 把 bid-confidence 从白名单移除 → 红（白名单是显式豁免而非漏检）。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SCRIPTS_ROOT = fileURLToPath(new URL('../../assets/scripts', import.meta.url));
const AI_ROOT = join(SCRIPTS_ROOT, 'ai');

/** 白名单：模块名 → 豁免原因（原因必须非空——防静默扩容）。 */
const WHITELIST: Record<string, string> = {
  index: '桶文件（barrel），由测试与跨层消费',
  hintRank: 'V10 用户裁决：SHOW_ADVISOR 隐藏件冻结期不迭代（insight 的支撑模块）',
  insight: 'V10 用户裁决：SHOW_ADVISOR 隐藏件冻结期不迭代',
  'bid-confidence': 'V10 冻结家族：叫抢信心徽章（隐藏件）——经桶导出供冻结面复用，无产品消费点（KL 登记口径分歧未修）',
};

function aiModules(): string[] {
  return readdirSync(AI_ROOT, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => relative(AI_ROOT, join(entry.parentPath, entry.name)).split('\\').join('/'));
}

function productSources(excludeRel: string): Array<{ rel: string; source: string }> {
  return readdirSync(SCRIPTS_ROOT, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => {
      const abs = join(entry.parentPath, entry.name);
      return { rel: relative(SCRIPTS_ROOT, abs).split('\\').join('/'), source: readFileSync(abs, 'utf8') };
    })
    .filter(({ rel }) => rel !== `ai/${excludeRel}` && rel !== 'ai/index.ts');
}

function importPattern(moduleRel: string): RegExp {
  const base = moduleRel.replace(/\.ts$/, '').split('/').pop()!;
  return new RegExp(`from\\s+['"][^'"]*\\/${base.replace(/[-]/g, '\\-')}['"]`);
}

/** 模块导出的符号名（function/const/class/enum/interface/type + 命名再导出）。 */
function exportedSymbols(moduleRel: string): string[] {
  const source = readFileSync(join(AI_ROOT, moduleRel), 'utf8');
  const names = new Set<string>();
  for (const re of [
    /export\s+(?:async\s+)?function\s+(\w+)/g,
    /export\s+const\s+(\w+)/g,
    /export\s+class\s+(\w+)/g,
    /export\s+enum\s+(\w+)/g,
    /export\s+interface\s+(\w+)/g,
    /export\s+type\s+(\w+)/g,
  ]) {
    for (const match of source.matchAll(re)) names.add(match[1]);
  }
  for (const match of source.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const raw of match[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/).pop()?.trim();
      if (name) names.add(name);
    }
  }
  return [...names];
}

/** 产品从 ai 桶的具名导入清单（剥别名/type 前缀），按文件聚合。 */
function barrelNamedImports(source: string): Set<string> {
  const names = new Set<string>();
  for (const match of source.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"][^'"]*\/ai['"]/g)) {
    for (const raw of match[1].split(',')) {
      const name = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]?.trim();
      if (name) names.add(name);
    }
  }
  return names;
}

describe('W-AI-R2 ai 模块消费防僵尸门 v2（直连 ∨ 桶具名符号）', () => {
  it('门自证：直连形态/桶具名形态可识别，注释与无关符号不误报', () => {
    expect(importPattern('pimc.ts').test("import { pimcArbitrate } from '../pimc';")).toBe(true);
    expect(importPattern('pimc.ts').test('// 注释里提到 pimc 不算 import')).toBe(false);
    const named = barrelNamedImports("import { AiLevel, strategyFor, chooseBidByLevel } from '../ai';");
    expect(named.has('chooseBidByLevel')).toBe(true);
    expect(named.has('strategyFor')).toBe(true);
    expect(barrelNamedImports("import { t } from './strings';").size).toBe(0);
    const aliasStripped = barrelNamedImports("import { chooseAction as fallbackAction, type AiStrategy } from '../ai';");
    expect(aliasStripped.has('chooseAction'), '别名剥离取原名').toBe(true);
    expect(aliasStripped.has('AiStrategy'), 'type 前缀剥离').toBe(true);
  });

  it('每个 ai 模块：直连 import ≥1 或 桶具名符号被消费 ≥1，或在带原因的白名单内（僵尸零容忍）', () => {
    const zombies: string[] = [];
    for (const moduleRel of aiModules()) {
      const base = moduleRel.replace(/\.ts$/, '').split('/').pop()!;
      if (WHITELIST[base] !== undefined) {
        expect(WHITELIST[base].trim().length, `白名单 ${base} 必须附原因`).toBeGreaterThan(0);
        continue;
      }
      const sources = productSources(moduleRel);
      const direct = sources.some(({ source }) => importPattern(moduleRel).test(source));
      if (direct) continue;
      const symbols = new Set(exportedSymbols(moduleRel));
      const viaBarrel = sources.some(({ rel, source }) => {
        if (rel.startsWith('ai/')) return false; // ai 内部消费必为直连，桶层只服务跨层
        const named = barrelNamedImports(source);
        for (const symbol of named) if (symbols.has(symbol)) return true;
        return false;
      });
      if (!viaBarrel) zombies.push(moduleRel);
    }
    expect(zombies, `零消费僵尸模块: ${zombies.join(', ')}`).toEqual([]);
  });

  it('tuning 离线注入器不被产品消费，产品只读取 getTuning', () => {
    const sources = productSources('tuning.ts');
    const setterConsumers = sources
      .filter(({ source }) => source.includes('__setTuningForOfflineSearch'))
      .map(({ rel }) => rel);
    expect(setterConsumers).toEqual([]);
    expect(sources.some(({ source }) => source.includes('getTuning'))).toBe(true);
  });
});
