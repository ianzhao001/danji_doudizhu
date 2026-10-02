/**
 * Latency inputs must not move when the candidate AI changes. Both bidding and
 * play use the immutable v1.9 fixture; shared rule/flow changes remain visible
 * in the corpus digest. Select across complete rounds, roles and game phases.
 */
import { createHash } from 'node:crypto';
import { runHeadlessRound, type BidPolicy, type PlayPolicy } from '../../assets/scripts/flow';
import type { GameEvent, GameSnapshot } from '../../assets/scripts/game';
import { v19BidByName, v19StrategyByName } from '../fixtures/ai-v19/v19';

export const LATENCY_SEEDS = [1, 2, 3, 4] as const;
const ROLES = ['landlord', 'lower', 'upper'] as const;
const PHASES = ['opening', 'middle', 'endgame'] as const;
const STRATA = PHASES.flatMap((phase) => ROLES.map((role) => `${phase}/${role}`));

export interface LatencyFrame {
  seed: number;
  turnIndex: number;
  snapshot: GameSnapshot;
  history: GameEvent[];
}

export function latencyStratum(frame: LatencyFrame): string {
  const { snapshot } = frame;
  const remaining = snapshot.handCounts.reduce((sum, count) => sum + count, 0);
  const phase = remaining > 36 ? 'opening' : remaining > 18 ? 'middle' : 'endgame';
  const role = snapshot.turn === snapshot.landlord ? 'landlord'
    : snapshot.turn === (snapshot.landlord + 1) % 3 ? 'lower' : 'upper';
  return `${phase}/${role}`;
}

/** Equal quotas per role, then phase; evenly spaced frames within each bucket. */
function stratifiedFrames(frames: LatencyFrame[], count: number): LatencyFrame[] {
  const buckets = STRATA.map((stratum) => frames.filter((frame) => latencyStratum(frame) === stratum));
  const selected = buckets.map((bucket, index) => {
    const quota = Math.floor(count / STRATA.length) + (index < count % STRATA.length ? 1 : 0);
    if (bucket.length < quota) throw new Error(`LATENCY_CORPUS_INSUFFICIENT: ${STRATA[index]} (${bucket.length}/${quota})`);
    return Array.from({ length: quota }, (_, slot) => bucket[Math.floor((slot + 0.5) * bucket.length / quota)]!);
  });
  // Interleave strata so a prefix does not accidentally contain only one role/phase.
  return Array.from({ length: Math.ceil(count / STRATA.length) }, (_, slot) =>
    selected.flatMap((bucket) => bucket[slot] ? [bucket[slot]!] : [])).flat();
}

function coverage(frames: LatencyFrame[]): Record<string, number> {
  return Object.fromEntries(STRATA.map((stratum) =>
    [stratum, frames.filter((frame) => latencyStratum(frame) === stratum).length]));
}

export async function buildLatencyCorpus() {
  const collected: LatencyFrame[] = [];
  const frozenHard = v19StrategyByName('hard');
  const bidPolicy: BidPolicy = ({ state, hand }) => v19BidByName(hand, state, 'hard');
  for (const seed of LATENCY_SEEDS) {
    let turnIndex = 0;
    const playPolicy: PlayPolicy = ({ snapshot, rng, history }) => {
      const events = history ?? [];
      collected.push(JSON.parse(JSON.stringify({ seed, turnIndex, snapshot, history: events })) as LatencyFrame);
      turnIndex += 1;
      return frozenHard(snapshot, rng, events);
    };
    await runHeadlessRound({ seed, playPolicy, bidPolicy });
  }
  const frames = stratifiedFrames(collected, 60);
  const hintFrames = stratifiedFrames(frames, 24);
  const source = 'ai-v19-hard-bid-and-play/role-phase-v1';
  const sha256 = createHash('sha256').update(JSON.stringify({ source, seeds: LATENCY_SEEDS, frames, hintFrames })).digest('hex');
  return {
    frames,
    hintFrames,
    metadata: {
      source,
      seeds: LATENCY_SEEDS,
      sha256,
      collectedFrames: collected.length,
      phaseDefinition: 'opening: total cards >36; middle: 19..36; endgame: <=18',
      decisionCoverage: coverage(frames),
      hintCoverage: coverage(hintFrames),
    },
  };
}
