#!/usr/bin/env node
/**
 * W-AI 竞技场包装脚本（规划者直落 main · 2026-07-17 · sota2）。
 * 职责：按 seed 分片并行拉起 tsx 跑局进程 → 归并判门 → 汇总报告落 coordination/reports/。
 * 全部对局数据由 test/arena/arena.ts 产出（零时基零随机，双跑可 hash 对账）；
 * 本包装只做进程编排与外层时间戳（工具层，允许 Date）。
 *
 * 用法（仓库根）：
 *   node coordination/scripts/w-ai-arena.mjs                       # 3 配对全量 + self/crippled 自证
 *   node coordination/scripts/w-ai-arena.mjs --seeds=200 --workers=7
 *   node coordination/scripts/w-ai-arena.mjs --pairings=hard --profile=weights-only   # 消融档
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = new Map(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
  const eq = a.indexOf('=');
  return eq < 0 ? [a.slice(2), 'true'] : [a.slice(2, eq), a.slice(eq + 1)];
}));

const SEEDS = Number(args.get('seeds') ?? 200);
const WORKERS = Number(args.get('workers') ?? 7);
const PROFILE = args.get('profile') ?? 'full';
const BASELINE = args.get('baseline') ?? 'legacy';
const FIXED_BID = args.get('fixed-bid') ?? 'none';
const SEED_BASE = Number(args.get('seed-base') ?? 0);
const TUNING = args.get('tuning');
const PAIRINGS = (args.get('pairings') ?? 'hard,normal,simple,self,crippled').split(',').filter(Boolean);
const SELF_SEEDS = Number(args.get('selfSeeds') ?? 20); // self/crippled 自证用小样本即可
const OUT_DIR = join('coordination', 'reports', 'w-ai-arena');

for (const [name, value] of [['seeds', SEEDS], ['workers', WORKERS], ['selfSeeds', SELF_SEEDS]]) {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`--${name} must be a positive integer`);
}
if (!Number.isSafeInteger(SEED_BASE) || SEED_BASE < 0 || SEED_BASE + Math.max(SEEDS, SELF_SEEDS) > 0xffff_ffff) {
  throw new Error('--seed-base and seed counts must fit the unsigned 32-bit seed range');
}
if (!['full', 'weights-only'].includes(PROFILE)) throw new Error('invalid --profile');
if (!['legacy', 'v19'].includes(BASELINE)) throw new Error('invalid --baseline');
if (!['none', 'new', 'legacy', 'v19'].includes(FIXED_BID)) throw new Error('invalid --fixed-bid');
if (PAIRINGS.length === 0 || new Set(PAIRINGS).size !== PAIRINGS.length
  || PAIRINGS.some((pairing) => !['hard', 'normal', 'simple', 'self', 'crippled'].includes(pairing))) {
  throw new Error('--pairings must contain unique valid pairing names');
}
mkdirSync(OUT_DIR, { recursive: true });
// Each invocation owns its files, so a failed judge cannot accidentally read an older successful report.
const RUN_DIR = mkdtempSync(join(OUT_DIR, 'run-'));
const EXPERIMENT_ARGS = [
  `--profile=${PROFILE}`, `--baseline=${BASELINE}`, `--fixed-bid=${FIXED_BID}`, `--seed-base=${SEED_BASE}`,
  ...(TUNING ? [`--tuning=${TUNING}`] : []),
];

function tsx(argv) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['--prefix', 'test', 'exec', 'tsx', '--', ...argv], {
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    child.on('exit', (code) => (code === 0 ? resolve(0) : reject(new Error(`tsx exited ${code}: ${argv.join(' ')}`))));
    child.on('error', reject);
  });
}

async function runPairing(pairing) {
  const seeds = pairing === 'self' || pairing === 'crippled' ? SELF_SEEDS : SEEDS;
  const workers = Math.min(WORKERS, seeds);
  const shardOuts = [];
  const jobs = [];
  for (let shard = 0; shard < workers; shard += 1) {
    const out = join(RUN_DIR, `${pairing}-${PROFILE}-shard-${shard}.json`);
    shardOuts.push(out);
    jobs.push(tsx([
      'test/arena/arena.ts',
      `--pairing=${pairing}`,
      ...EXPERIMENT_ARGS,
      `--seeds=${seeds}`,
      `--shard=${shard}/${workers}`,
      `--out=${out}`,
    ]));
  }
  await Promise.all(jobs);

  const report = join(RUN_DIR, `${pairing}-${PROFILE}-report.json`);
  let gatePassed = true;
  try {
    await tsx([
      'test/arena/arena.ts',
      '--judge',
      `--pairing=${pairing}`,
      ...EXPERIMENT_ARGS,
      `--seeds=${seeds}`,
      `--shards=${workers}`,
      `--inputs=${shardOuts.join(',')}`,
      `--out=${report}`,
    ]);
  } catch (error) {
    if (!existsSync(report)) throw error;
    gatePassed = false;
  }
  const parsed = JSON.parse(readFileSync(report, 'utf8'));
  return { pairing, seeds, report, gatePassed, manifest: parsed.manifest, summary: parsed.summary, verdict: parsed.verdict };
}

const startedAt = new Date().toISOString();
const results = [];
let allPassed = true;
for (const pairing of PAIRINGS) {
  // 配对串行、配对内分片并行：避免超订 CPU 影响墙钟观测。
  // eslint-disable-next-line no-await-in-loop
  const result = await runPairing(pairing);
  results.push(result);
  if (!result.gatePassed) allPassed = false;
}

const final = {
  startedAt,
  finishedAt: new Date().toISOString(),
  profile: PROFILE,
  baseline: BASELINE,
  fixedBid: FIXED_BID,
  seedBase: SEED_BASE,
  tuning: TUNING ?? null,
  seeds: SEEDS,
  workers: WORKERS,
  results,
  allPassed,
};
const finalPath = join(OUT_DIR, `w-ai-arena-${PROFILE}.json`);
writeFileSync(finalPath, `${JSON.stringify(final, null, 1)}\n`);
console.log(`\n[w-ai-arena] ${allPassed ? 'ALL GATES PASS' : 'GATE FAILURES PRESENT'} → ${finalPath}`);
for (const r of results) {
  console.log(`  - ${r.pairing}(${r.seeds} seeds): ${r.gatePassed ? 'PASS' : `FAIL (${r.verdict.reasons.join(' ; ')})`}`);
}
process.exit(allPassed ? 0 : 1);
