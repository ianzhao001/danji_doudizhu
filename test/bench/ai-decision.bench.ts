import os from 'node:os';
import { performance } from 'node:perf_hooks';

import { AiLevel, adviseBestMove, chooseBidByLevel, rankHintCandidates, strategyFor } from '../../assets/scripts/ai';
import type { GameEvent, GameSnapshot } from '../../assets/scripts/game';
import { runHeadlessRound, type BidPolicy, type PlayPolicy } from '../../assets/scripts/flow';

const SEEDS = Array.from({ length: 30 }, (_, index) => index + 1);
const DECISION_P95_LIMIT_MS = 60;
const DECISION_MAX_LIMIT_MS = 250;
const HINT_MAX_LIMIT_MS = 400;

type BucketName = 'gt12' | '6to12' | 'lte5';

interface HintFixture {
  snapshot: GameSnapshot;
  history: GameEvent[];
}

function bucketFor(handCount: number): BucketName {
  if (handCount > 12) return 'gt12';
  if (handCount > 5) return '6to12';
  return 'lte5';
}

function percentile(sorted: readonly number[], ratio: number): number {
  if (sorted.length === 0) throw new Error('AI_BENCH_EMPTY_BUCKET');
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)]!;
}

function round(value: number): number {
  return Number(value.toFixed(3));
}

function stats(values: readonly number[]): { calls: number; p50Ms: number; p95Ms: number; maxMs: number } {
  const sorted = values.slice().sort((left, right) => left - right);
  return {
    calls: sorted.length,
    p50Ms: round(percentile(sorted, 0.5)),
    p95Ms: round(percentile(sorted, 0.95)),
    maxMs: round(sorted[sorted.length - 1]!),
  };
}

async function main(): Promise<void> {
  const hard = strategyFor(AiLevel.Hard);
  const timings: Record<BucketName, number[]> = { gt12: [], '6to12': [], lte5: [] };
  const hintCapture: { fixture: HintFixture | null; decisionMs: number } = { fixture: null, decisionMs: -1 };
  let turns = 0;
  const bidPolicy: BidPolicy = ({ seat, state, hand }) => chooseBidByLevel(hand, state, AiLevel.Hard);

  for (const seed of SEEDS) {
    const playPolicy: PlayPolicy = ({ snapshot, rng, history }) => {
      const handCount = snapshot.viewerHand?.length ?? 0;
      const started = performance.now();
      const action = hard(snapshot, rng, history ?? []);
      const elapsedMs = performance.now() - started;
      timings[bucketFor(handCount)].push(elapsedMs);
      if (snapshot.top === null && handCount > 12 && elapsedMs > hintCapture.decisionMs) {
        hintCapture.fixture = { snapshot, history: (history ?? []).slice() };
        hintCapture.decisionMs = elapsedMs;
      }
      turns += 1;
      return action;
    };
    await runHeadlessRound({ seed, bidPolicy, playPolicy });
  }

  const hintFixture = hintCapture.fixture;
  if (!hintFixture) throw new Error('AI_BENCH_HINT_FIXTURE_MISSING');
  const advisorHintTimings: number[] = [];
  const rankedHintTimings: number[] = [];
  for (let index = 0; index < 100; index += 1) {
    const started = performance.now();
    adviseBestMove({
      snapshot: hintFixture.snapshot,
      history: hintFixture.history,
      viewerSeat: hintFixture.snapshot.turn,
    });
    advisorHintTimings.push(performance.now() - started);

    const rankedStarted = performance.now();
    rankHintCandidates({
      snapshot: hintFixture.snapshot,
      history: hintFixture.history,
      viewerSeat: hintFixture.snapshot.turn,
    });
    rankedHintTimings.push(performance.now() - rankedStarted);
  }

  const decision = {
    gt12: stats(timings.gt12),
    '6to12': stats(timings['6to12']),
    lte5: stats(timings.lte5),
  };
  const advisorHint = stats(advisorHintTimings);
  const rankedHint = stats(rankedHintTimings);
  const decisionPass = Object.values(decision).every(
    (entry) => entry.p95Ms <= DECISION_P95_LIMIT_MS && entry.maxMs <= DECISION_MAX_LIMIT_MS,
  );
  const hintPass = advisorHint.maxMs <= HINT_MAX_LIMIT_MS && rankedHint.maxMs <= HINT_MAX_LIMIT_MS;
  const report = {
    task: 'W-AI-B2 decision bench',
    command: 'npm --prefix test exec tsx -- test/bench/ai-decision.bench.ts',
    seeds: SEEDS.length,
    turns,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuModel: os.cpus()[0]?.model ?? 'unknown',
      benchmarkConcurrency: 1,
    },
    thresholdsMs: {
      decisionP95: DECISION_P95_LIMIT_MS,
      decisionMax: DECISION_MAX_LIMIT_MS,
      hintMax: HINT_MAX_LIMIT_MS,
    },
    decision,
    advisorHint100: advisorHint,
    rankedHint100: rankedHint,
    pass: decisionPass && hintPass,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) throw new Error('W_AI_DECISION_BENCH_GATE_FAILED');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
