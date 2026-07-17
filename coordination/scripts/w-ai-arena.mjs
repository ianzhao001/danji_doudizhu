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
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = new Map(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
  const eq = a.indexOf('=');
  return eq < 0 ? [a.slice(2), 'true'] : [a.slice(2, eq), a.slice(eq + 1)];
}));

const SEEDS = Number(args.get('seeds') ?? 200);
const WORKERS = Math.max(1, Number(args.get('workers') ?? 7));
const PROFILE = args.get('profile') ?? 'full';
const PAIRINGS = (args.get('pairings') ?? 'hard,normal,simple,self,crippled').split(',').filter(Boolean);
const SELF_SEEDS = Number(args.get('selfSeeds') ?? 20); // self/crippled 自证用小样本即可
const OUT_DIR = join('coordination', 'reports', 'w-ai-arena');

mkdirSync(OUT_DIR, { recursive: true });

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
    const out = join(OUT_DIR, `${pairing}-${PROFILE}-shard-${shard}.json`);
    shardOuts.push(out);
    jobs.push(tsx([
      'test/arena/arena.ts',
      `--pairing=${pairing}`,
      `--profile=${PROFILE}`,
      `--seeds=${seeds}`,
      `--shard=${shard}/${workers}`,
      `--out=${out}`,
    ]));
  }
  await Promise.all(jobs);

  const report = join(OUT_DIR, `${pairing}-${PROFILE}-report.json`);
  let gatePassed = true;
  try {
    await tsx([
      'test/arena/arena.ts',
      '--judge',
      `--pairing=${pairing}`,
      `--profile=${PROFILE}`,
      `--inputs=${shardOuts.join(',')}`,
      `--out=${report}`,
    ]);
  } catch {
    gatePassed = false;
  }
  const parsed = JSON.parse(readFileSync(report, 'utf8'));
  return { pairing, seeds, report, gatePassed, summary: parsed.summary, verdict: parsed.verdict };
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
