#!/usr/bin/env node
/**
 * Deterministic integer SPSA search over the bounded AI tuning seams.
 *
 * Maximization update (k starts at 0):
 *   a_k = 0.6 / (k + 1)^0.602
 *   c_k = 1.0 / (k + 1)^0.101, integer perturbation s_k = max(1, round(c_k))
 *   delta_i in {-1,+1}, theta+/- = clip(round(theta +/- s_k * delta))
 *   g_i = (ADP+ - ADP-) / (2 * s_k * delta_i)
 *   theta_(k+1) = clip(round(theta_k + a_k * g_i))
 *
 * Integer bounds, in vector order:
 *   leadShedWeight [4,40], pimcLeadBand [50,400], highPressureMult [1,16],
 *   lowPressureMult [1,12], urgentThreshold [2,17], pass landlord/farmer [1,12],
 *   pass highTopShift [0,3].
 *
 * This script only searches and records candidates. It never writes DEFAULT_TUNING.
 */

import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const REPORT_DIR = join(REPO_ROOT, 'coordination/reports/ai-tuning/spsa');
const TRACE_PATH = join(REPORT_DIR, 'trace.jsonl');
const BEST_PATH = join(REPORT_DIR, 'best.json');
const MAX_ITERS = 150;
const MAX_TIME_BUDGET_MIN = 120;
const NO_IMPROVEMENT_LIMIT = 50;
const DEFAULT_SEEDS = 60;
const DEFAULT_SEED_BASE = 1;
const A = 0.6;
const C = 1;
const ALPHA = 0.602;
const GAMMA = 0.101;

const DIMENSIONS = [
  { name: 'leadShedWeight', initial: 20, min: 4, max: 40 },
  { name: 'pimcLeadBand', initial: 200, min: 50, max: 400 },
  { name: 'highPressureMult', initial: 7, min: 1, max: 16 },
  { name: 'lowPressureMult', initial: 3, min: 1, max: 12 },
  { name: 'urgentThreshold', initial: 8, min: 2, max: 17 },
  { name: 'passLandlord', initial: 4, min: 1, max: 12 },
  { name: 'passFarmer', initial: 4, min: 1, max: 12 },
  { name: 'passHighTopShift', initial: 0, min: 0, max: 3 },
];

const ACCEPTANCE_GATES = [
  '保留种子集 --seed-base=100000 --seeds=200：judgeStrengthCI 的 ADP 95% CI 下界 > 0',
  'w-ai-arena weights-only hard 镜像胜率差 >= +3pp',
  'full 三配对棘轮门与 selfplay 神圣门零回退',
  '维护者复核后另起 commit 写回 DEFAULT_TUNING，并完整复跑快慢门',
];

class TimeBudgetExceeded extends Error {
  constructor() {
    super('SPSA time budget exhausted');
    this.name = 'TimeBudgetExceeded';
  }
}

function parseArgs(argv) {
  const parsed = new Map();
  for (const raw of argv) {
    if (!raw.startsWith('--')) throw new Error(`unexpected positional argument: ${raw}`);
    const eq = raw.indexOf('=');
    parsed.set(raw.slice(2, eq < 0 ? undefined : eq), eq < 0 ? 'true' : raw.slice(eq + 1));
  }
  const iters = positiveInteger(parsed.get('iters') ?? '150', '--iters');
  const seeds = positiveInteger(parsed.get('seeds') ?? String(DEFAULT_SEEDS), '--seeds');
  const seedBase = nonNegativeInteger(parsed.get('seed-base') ?? String(DEFAULT_SEED_BASE), '--seed-base');
  const timeBudgetMin = positiveNumber(parsed.get('time-budget-min') ?? '120', '--time-budget-min');
  if (iters > MAX_ITERS) throw new Error(`--iters exceeds hard cap ${MAX_ITERS}`);
  if (timeBudgetMin > MAX_TIME_BUDGET_MIN) {
    throw new Error(`--time-budget-min exceeds hard cap ${MAX_TIME_BUDGET_MIN}`);
  }
  for (const key of parsed.keys()) {
    if (!['iters', 'seeds', 'seed-base', 'time-budget-min'].includes(key)) throw new Error(`unknown option --${key}`);
  }
  return { iters, seeds, seedBase, timeBudgetMin };
}

function positiveInteger(raw, name) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
  return value;
}

function nonNegativeInteger(raw, name) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer`);
  return value;
}

function positiveNumber(raw, name) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be positive`);
  return value;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function clipVector(values) {
  return values.map((value, index) => {
    const dimension = DIMENSIONS[index];
    return Math.max(dimension.min, Math.min(dimension.max, Math.round(value)));
  });
}

function namedTheta(vector) {
  return Object.fromEntries(DIMENSIONS.map((dimension, index) => [dimension.name, vector[index]]));
}

function toTuning(vector) {
  const theta = namedTheta(vector);
  return {
    hardLeadShedWeight: theta.leadShedWeight,
    pimcLeadBand: theta.pimcLeadBand,
    highCardSpendPressureMultiplier: theta.highPressureMult,
    highCardSpendBaseMultiplier: theta.lowPressureMult,
    urgentThreshold: theta.urgentThreshold,
    passUnits: {
      landlord: theta.passLandlord,
      farmer: theta.passFarmer,
      highTopShift: theta.passHighTopShift,
    },
  };
}

function commandFailure(command, args, result) {
  const detail = [result.error?.message, result.stderr, result.stdout].filter(Boolean).join('\n').slice(-4000);
  return new Error(`${command} ${args.join(' ')} exited ${result.status ?? 'unknown'}${detail ? `\n${detail}` : ''}`);
}

function run(command, args, timeoutMs, allowGateFailure = false) {
  const result = spawnSync(command, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    timeout: Math.max(1, timeoutMs),
  });
  if (result.error?.code === 'ETIMEDOUT') throw new TimeBudgetExceeded();
  if (result.error) throw commandFailure(command, args, result);
  if (result.status !== 0 && !(allowGateFailure && result.status === 1)) {
    throw commandFailure(command, args, result);
  }
  return result;
}

function remainingMs(deadline) {
  return Math.max(1, deadline - Date.now());
}

function evaluate(vector, label, options, tempRoot, deadline) {
  const tuningPath = join(tempRoot, `${label}-tuning.json`);
  const shardPath = join(tempRoot, `${label}-games.json`);
  const reportPath = join(tempRoot, `${label}-report.json`);
  writeFileSync(tuningPath, `${JSON.stringify(toTuning(vector), null, 2)}\n`, 'utf8');

  run('npm', [
    '--prefix', 'test', 'exec', 'tsx', '--', 'test/arena/arena.ts',
    '--pairing=hard',
    '--profile=full',
    '--baseline=v19',
    '--fixed-bid=v19',
    `--seed-base=${options.seedBase}`,
    `--seeds=${options.seeds}`,
    `--tuning=${tuningPath}`,
    '--shard=0/1',
    `--out=${shardPath}`,
  ], remainingMs(deadline));

  // Small search batches often fail the CI adoption gate. The judge still writes a
  // complete deterministic summary; status 1 is therefore data, not an SPSA error.
  run('npm', [
    '--prefix', 'test', 'exec', 'tsx', '--', 'test/arena/arena.ts',
    '--judge',
    '--pairing=hard',
    '--profile=full',
    '--baseline=v19',
    `--tuning=${tuningPath}`,
    `--inputs=${shardPath}`,
    `--out=${reportPath}`,
  ], remainingMs(deadline), true);

  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const score = report?.summary?.avgPairedScoreDiff;
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    throw new Error(`${label}: arena report has no finite avgPairedScoreDiff`);
  }
  return score;
}

function holdoutCommands() {
  const bestRelative = relative(REPO_ROOT, BEST_PATH);
  return [
    `npm --prefix test exec tsx -- test/arena/arena.ts --pairing=hard --profile=full --baseline=v19 --fixed-bid=v19 --seed-base=100000 --seeds=200 --tuning=${bestRelative} --shard=0/1 --out=/tmp/spsa-holdout-games.json`,
    `npm --prefix test exec tsx -- test/arena/arena.ts --judge --pairing=hard --profile=full --baseline=v19 --tuning=${bestRelative} --inputs=/tmp/spsa-holdout-games.json --out=/tmp/spsa-holdout-report.json`,
  ];
}

function renderBest(best, options, completedIterations, stopReason) {
  return {
    status: 'research-candidate-not-adopted',
    theta: namedTheta(best.vector),
    tuning: toTuning(best.vector),
    avgPairedScoreDiff: best.score,
    foundAtIteration: best.iteration,
    search: {
      completedIterations,
      stopReason,
      seeds: options.seeds,
      seedBase: options.seedBase,
      objective: 'hard candidate-vs-v19 mirrored ADP with fixed-bid=v19',
    },
    holdoutCommands: holdoutCommands(),
    acceptanceGates: ACCEPTANCE_GATES,
    warning: 'Do not write this candidate into DEFAULT_TUNING unless every acceptance gate passes.',
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const deadline = Date.now() + options.timeBudgetMin * 60_000;
  const random = mulberry32(options.seedBase);
  const tempRoot = mkdtempSync(join(tmpdir(), 'ddz-spsa-'));
  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(TRACE_PATH, '', 'utf8');

  let theta = DIMENSIONS.map((dimension) => dimension.initial);
  let best = null;
  let noImprovement = 0;
  let completedIterations = 0;
  let stopReason = 'iteration-limit';

  try {
    for (let iteration = 1; iteration <= options.iters; iteration += 1) {
      if (Date.now() >= deadline) {
        stopReason = 'time-budget';
        break;
      }
      const aK = A / Math.pow(iteration, ALPHA);
      const cK = C / Math.pow(iteration, GAMMA);
      const perturbation = Math.max(1, Math.round(cK));
      const delta = DIMENSIONS.map(() => (random() < 0.5 ? -1 : 1));
      const thetaBefore = theta.slice();
      const plus = clipVector(theta.map((value, index) => value + perturbation * delta[index]));
      const minus = clipVector(theta.map((value, index) => value - perturbation * delta[index]));
      let plusScore;
      let minusScore;
      try {
        plusScore = evaluate(plus, `iter-${iteration}-plus`, options, tempRoot, deadline);
        minusScore = evaluate(minus, `iter-${iteration}-minus`, options, tempRoot, deadline);
      } catch (error) {
        if (error instanceof TimeBudgetExceeded) {
          stopReason = 'time-budget';
          break;
        }
        throw error;
      }
      const scoreDiff = plusScore - minusScore;
      const gradient = delta.map((direction) => scoreDiff / (2 * perturbation * direction));
      theta = clipVector(theta.map((value, index) => value + aK * gradient[index]));

      let improved = false;
      for (const candidate of [
        { vector: plus, score: plusScore, side: 'plus' },
        { vector: minus, score: minusScore, side: 'minus' },
      ]) {
        if (best === null || candidate.score > best.score) {
          best = { ...candidate, iteration };
          improved = true;
        }
      }
      noImprovement = improved ? 0 : noImprovement + 1;
      completedIterations = iteration;
      const row = {
        iteration,
        theta: namedTheta(thetaBefore),
        delta,
        aK,
        cK,
        perturbation,
        plus: { theta: namedTheta(plus), avgPairedScoreDiff: plusScore },
        minus: { theta: namedTheta(minus), avgPairedScoreDiff: minusScore },
        gradient,
        nextTheta: namedTheta(theta),
        best: {
          theta: namedTheta(best.vector),
          avgPairedScoreDiff: best.score,
          iteration: best.iteration,
          side: best.side,
        },
        consecutiveIterationsWithoutImprovement: noImprovement,
      };
      appendFileSync(TRACE_PATH, `${JSON.stringify(row)}\n`, 'utf8');
      console.log(`[spsa] iter=${iteration}/${options.iters} plus=${plusScore} minus=${minusScore} best=${best.score}`);

      if (noImprovement >= NO_IMPROVEMENT_LIMIT) {
        stopReason = '50-iterations-without-improvement';
        break;
      }
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }

  if (best === null) throw new Error(`search stopped before one complete iteration (${stopReason})`);
  const bestDocument = renderBest(best, options, completedIterations, stopReason);
  writeFileSync(BEST_PATH, `${JSON.stringify(bestDocument, null, 2)}\n`, 'utf8');
  console.log(`[spsa] trace=${relative(REPO_ROOT, TRACE_PATH)}`);
  console.log(`[spsa] best=${relative(REPO_ROOT, BEST_PATH)} ADP=${best.score}`);
  console.log('[spsa] candidate is NOT adopted; all acceptance gates must pass:');
  ACCEPTANCE_GATES.forEach((gate, index) => console.log(`  ${index + 1}. ${gate}`));
}

try {
  main();
} catch (error) {
  console.error(`[spsa] FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
