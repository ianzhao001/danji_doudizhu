/**
 * 架构红线机检门(v1.6 审计裁决 P1-1②/P1-2/P1-4)。
 * 此前「纯层零随机零时基」「退役资产零消费」只靠每批人工 grep 复述——软约束;
 * 本文件把红线固化为 fail-fast 测试,任何违规在 `npm --prefix test test` 即红。
 * 白名单一律落在本文件(显式数组+理由),不用源码行内 marker:
 * 豁免必须表现为对本门禁文件的 diff,违规文件不能自我豁免。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SCRIPTS_ROOT = fileURLToPath(new URL('../assets/scripts', import.meta.url));
const PURE_LAYERS = ['rules', 'game', 'ai', 'flow', 'data'] as const;

// rollback-only 键(v1.5/v1.6 各轮裁决:键与文件保留仅作回滚,产品零消费)。
// 注意:bottomCardsDockV15/panelPopupV15/settlementPanelV15 是活跃皮肤键,严禁加进来。
const ROLLBACK_ONLY_KEYS = [
  'btnPrimaryV15', 'btnSecondaryV15', 'btnTertiaryV15', 'btnDisabledV15',
  'btnPrimaryV17', 'btnSecondaryV17', 'btnTertiaryV17', 'btnDisabledV17',
  'infoPillV15', 'seatNameplateV15',
  'settlementBannerWinV15', 'settlementBannerLoseV15',
  'settlementPanelV13', 'settlementBannerWinV13', 'settlementBannerLoseV13',
  'pauseBtnToggle', 'pauseBtnAction',
];
const ROLLBACK_KEY_DEFINITION_FILES = new Set([
  'ui/asset-keys.ts', // 键值定义处
  'ui/asset-keys-rollback.ts', // 物理隔离后的定义处(审计裁决 P1-2)
]);
// 场景 @property 绑定冷构建后会失效(KNOWN_LIMITATIONS),棘轮只减不增;
// 基线 14 = lobby-scene.ts 7 + game-scene-skeleton.ts 7。移除装饰器后应同步下调预算。
const PROPERTY_DECORATOR_BUDGET = 14;

function listTsFiles(root: string): string[] {
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => join(entry.parentPath, entry.name));
}

// 去注释后再匹配:门禁语义是「代码消费」,允许注释里提及被禁词(复盘注释不算违规)。
// [^:] 护住 https:// 之类 URL;字符串内 // 只会过度剥离 → 只可能漏报不会误报。
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function offenders(files: string[], pattern: RegExp, excludeRel?: Set<string>): string[] {
  const hits: string[] = [];
  for (const file of files) {
    const rel = relative(SCRIPTS_ROOT, file).split('\\').join('/');
    if (excludeRel?.has(rel)) continue;
    if (pattern.test(stripComments(readFileSync(file, 'utf8')))) hits.push(rel);
  }
  return hits;
}

describe('architecture gates(v1.6 审计裁决)', () => {
  const allFiles = listTsFiles(SCRIPTS_ROOT);
  const pureFiles = PURE_LAYERS.flatMap((layer) => listTsFiles(join(SCRIPTS_ROOT, layer)));

  it('① 纯层(rules/game/ai/flow/data)零 Math.random / Date.now / performance.now', () => {
    expect(offenders(pureFiles, /Math\.random|Date\.now|performance\.now/)).toEqual([]);
  });

  it('② 全产品代码零 Math.random(随机只许走 rules/rng 的 createRng(seed))', () => {
    expect(offenders(allFiles, /Math\.random/)).toEqual([]);
  });

  it("③ 纯层零 import 'cc'(含 cc/ 子路径、require 与动态 import)", () => {
    expect(offenders(pureFiles, /(?:from|import|require)\s*\(?\s*['"]cc(?:\/|['"])/)).toEqual([]);
  });

  it('④ rollback-only 资产键除定义文件外零消费(含预载表)', () => {
    const pattern = new RegExp(`\\b(?:${ROLLBACK_ONLY_KEYS.join('|')})\\b`);
    expect(offenders(allFiles, pattern, ROLLBACK_KEY_DEFINITION_FILES)).toEqual([]);
  });

  it(`⑤ ui/components 场景组件 @property 棘轮:≤${PROPERTY_DECORATOR_BUDGET},禁新增`, () => {
    // 行首锚定只数真实装饰器:裸字符串计数是 16——ui-runtime-helpers.ts 与
    // lobby-scene.ts 各有一处注释提及 @property(,不是绑定,不计入。
    const files = listTsFiles(join(SCRIPTS_ROOT, 'ui/components'));
    const perFile = files
      .map((file) => ({
        rel: relative(SCRIPTS_ROOT, file),
        count: (readFileSync(file, 'utf8').match(/^\s*@property\b/gm) ?? []).length,
      }))
      .filter(({ count }) => count > 0);
    const total = perFile.reduce((sum, { count }) => sum + count, 0);
    const detail = perFile.map(({ rel, count }) => `${rel}=${count}`).join(', ');
    expect(total, `@property 分布:${detail}`).toBeLessThanOrEqual(PROPERTY_DECORATOR_BUDGET);
  });
});
