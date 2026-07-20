#!/usr/bin/env node
/**
 * W-AI-R3 v1.9 冻结基线快照器（sota2 · B0 立度量）。
 *
 * 把当刻 `assets/scripts/ai/**.ts` 逐字节快照进 `test/fixtures/ai-v19/`，
 * 仅重定向 `rules`/`game` 进口指向活体 `assets/scripts/`（rules/game 是共享稳定契约，不冻结），
 * 生成入口桶 `v19.ts` 与 sha256 `manifest.json`。之后 `ai-v19-freeze.test.ts` 以 manifest 钉死防漂移。
 *
 *   node coordination/scripts/w-ai-freeze-baseline.mjs
 *
 * **只在冻结当刻跑一次**（与 legacy-ai 同规矩）：跑完提交冻结件后，任何对 fixture 的改动都会撞冻结门。
 * 内部零时基零随机（纯文件操作）。与 legacy-ai/ 的重定向口径逐字对齐（levels 深一层）。
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const AI_SRC = join(REPO, 'assets', 'scripts', 'ai');
const OUT = join(REPO, 'test', 'fixtures', 'ai-v19');

/** 收集 ai/ 下全部 .ts（递归），相对 ai/ 的 posix 路径。 */
function sourceFiles() {
  return readdirSync(AI_SRC, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.ts'))
    .map((e) => relative(AI_SRC, join(e.parentPath, e.name)).split('\\').join('/'))
    .sort();
}

/**
 * 把 `from '(../)+rules|game...'` 重定向到活体 assets/scripts。
 * 文件在 ai/ 下深度 d（根=0，levels/=1）：原前缀 = '../'×(d+1)，目标 = '../'×(d+3)+'assets/scripts/'。
 * 只改 rules/game，ai 内部相对进口（../decompose 等）原样保留，解析到 fixture 自身拷贝。
 */
function redirect(source, rel) {
  const depth = rel.split('/').length - 1;
  const orig = '../'.repeat(depth + 1);
  const target = `${'../'.repeat(depth + 3)}assets/scripts/`;
  const escaped = orig.replace(/[.]/g, '\\.');
  const re = new RegExp(`from '${escaped}(rules|game)(['/])`, 'g');
  return source.replace(re, (_m, mod, tail) => `from '${target}${mod}${tail}`);
}

const V19_BARREL = `/**
 * W-AI-R3 v1.9 冻结基线桶（sota2 · B0 立度量）。
 * 本目录是 v1.9 收版当刻 assets/scripts/ai 层的逐字节拷贝（仅 rules/game import 重定向），
 * 作竞技场 candidate-vs-v19 的旧引擎一侧。**任何人不得改动**——ai-v19-freeze.test.ts 以 sha256 钉死。
 * 由 coordination/scripts/w-ai-freeze-baseline.mjs 生成，冻结当刻跑一次。
 */
import { AiLevel, strategyFor, type AiStrategy } from './strategy';
import { chooseBidByLevel } from './bidding-levels';
import type { BidAction, BiddingState } from '../../../assets/scripts/game';
import type { Card } from '../../../assets/scripts/rules';

export type V19LevelName = 'simple' | 'normal' | 'hard';

function v19LevelOf(name: V19LevelName): AiLevel {
  switch (name) {
    case 'simple':
      return AiLevel.Simple;
    case 'normal':
      return AiLevel.Normal;
    case 'hard':
      return AiLevel.Hard;
    default: {
      const exhaustive: never = name;
      throw new Error(\`unknown v19 level: \${String(exhaustive)}\`);
    }
  }
}

export function v19StrategyByName(name: V19LevelName): AiStrategy {
  return strategyFor(v19LevelOf(name));
}

export function v19BidByName(hand: Card[], state: BiddingState, name: V19LevelName): BidAction {
  return chooseBidByLevel(hand, state, v19LevelOf(name));
}
`;

function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const files = sourceFiles();
  let copied = 0;
  for (const rel of files) {
    const source = readFileSync(join(AI_SRC, rel), 'utf8');
    const out = redirect(source, rel);
    const dest = join(OUT, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, out);
    copied += 1;
  }
  writeFileSync(join(OUT, 'v19.ts'), V19_BARREL);

  // sha256 manifest（仅 .ts，与冻结门口径一致；manifest.json 不自哈希）。
  const all = readdirSync(OUT, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.ts'))
    .map((e) => relative(OUT, join(e.parentPath, e.name)).split('\\').join('/'))
    .sort();
  const manifest = {};
  for (const rel of all) {
    manifest[rel] = createHash('sha256').update(readFileSync(join(OUT, rel))).digest('hex');
  }
  writeFileSync(join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`[w-ai-freeze] snapshot ${copied} ai file(s) + v19.ts barrel → test/fixtures/ai-v19/`);
  console.log(`[w-ai-freeze] manifest: ${all.length} frozen .ts file(s)`);
}

main();
