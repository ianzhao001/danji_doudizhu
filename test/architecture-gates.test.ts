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
// Codex R1 阻断①修正:旧正则剥法不识别字符串,`const s = '//'; Date.now()` 的后半行
// 会被当注释吃掉 → 漏报。改为逐字符扫描器(code/line/block/single/double/template 六态):
// 注释替换为空格(保留换行),字符串内容原样保留——禁词藏进字符串只可能误报(fail-safe),
// 真实代码不会被误剥。已知残余:正则字面量内的裸 `//`(如 /[//]/)会被当注释,产品代码
// 无此写法,由下方「门自证」用例把守主路径。
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
      if (ch === '\n') { mode = 'code'; out += '\n'; } else out += ' ';
      continue;
    }
    if (mode === 'block') {
      if (ch === '*' && next === '/') { mode = 'code'; out += '  '; i++; }
      else out += ch === '\n' ? '\n' : ' ';
      continue;
    }
    // 字符串三态:处理转义,内容原样输出。
    if (ch === '\\') { out += ch + (next ?? ''); i++; continue; }
    if ((mode === 'single' && ch === "'") || (mode === 'double' && ch === '"') || (mode === 'template' && ch === '`')) {
      mode = 'code';
    }
    out += ch;
  }
  return out;
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
    // Codex R1 阻断①修正:旧的行首锚定数不到「与 class 左花括号/其他代码同行」的装饰器。
    // 改为对去注释源码全量数 @property token——注释提及被扫描器剥掉,行首/同行一视同仁。
    const files = listTsFiles(join(SCRIPTS_ROOT, 'ui/components'));
    const perFile = files
      .map((file) => ({
        rel: relative(SCRIPTS_ROOT, file),
        count: (stripComments(readFileSync(file, 'utf8')).match(/@property\b/g) ?? []).length,
      }))
      .filter(({ count }) => count > 0);
    const total = perFile.reduce((sum, { count }) => sum + count, 0);
    const detail = perFile.map(({ rel, count }) => `${rel}=${count}`).join(', ');
    expect(total, `@property 分布:${detail}`).toBeLessThanOrEqual(PROPERTY_DECORATOR_BUDGET);
  });
});

// 门自证(v1.6 复盘教训⑥「先自证门再信门」;Codex R1 阻断①的两类漏报钉成永久回归)。
describe('architecture gates 自证', () => {
  const BANNED = /Math\.random|Date\.now|performance\.now/;
  const catches = (src: string): boolean => BANNED.test(stripComments(src));

  it('字符串内注释符骗不过禁词扫描(Codex 注入①)', () => {
    expect(catches("const auditMarker = '//'; Date.now(); void auditMarker;")).toBe(true);
    expect(catches('const s = "a // b"; Math.random();')).toBe(true);
    expect(catches("const s = '/*'; performance.now();")).toBe(true);
    expect(catches('const t = `tpl // x`; Date.now();')).toBe(true);
  });

  it('真注释仍然豁免,URL 不误伤', () => {
    expect(catches('// Math.random()')).toBe(false);
    expect(catches('/* Date.now() */')).toBe(false);
    expect(catches("const url = 'http://x'; // Date.now()")).toBe(false);
  });

  it('同行装饰器全计数,注释提及不计数(Codex 注入②)', () => {
    const sameLine = 'export class X extends Component { @property(Sprite) a: unknown = null;\n@property(Label) b: unknown = null; }';
    expect((stripComments(sameLine).match(/@property\b/g) ?? []).length).toBe(2);
    const comments = '// @property(background)\n/* @property(cardTemplate) */\nconst s = 1;';
    expect((stripComments(comments).match(/@property\b/g) ?? []).length).toBe(0);
  });
});
