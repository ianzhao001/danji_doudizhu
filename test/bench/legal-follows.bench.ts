import os from 'node:os';
import { performance } from 'node:perf_hooks';

import { AiLevel, chooseBidByLevel, strategyFor } from '../../assets/scripts/ai';
import { levelPolicies, runHeadlessRound, type BidPolicy, type PlayPolicy } from '../../assets/scripts/flow';
import type { GameSnapshot, SeatIndex } from '../../assets/scripts/game';
import {
  Category,
  RANK_LABEL,
  legalFollows,
  type Card,
  type HandPattern,
  type Move,
} from '../../assets/scripts/rules';

const SEEDS = Array.from({ length: 60 }, (_, index) => index + 1);
const LEVEL_ROTATIONS: ReadonlyArray<readonly [AiLevel, AiLevel, AiLevel]> = [
  [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard],
  [AiLevel.Normal, AiLevel.Hard, AiLevel.Simple],
  [AiLevel.Hard, AiLevel.Simple, AiLevel.Normal],
];
const LEGAL_RATIO_THRESHOLD = 0.4;
const SELFPLAY_MS_THRESHOLD = 30_000;

interface HeavyCall {
  elapsedMs: number;
  seed: number;
  turnIndex: number;
  seat: SeatIndex;
  level: AiLevel;
  handCount: number;
  handShape: string;
  currentShape: string;
  resultMoves: number;
}

interface CategoryStats {
  calls: number;
  totalMs: number;
  maxMs: number;
}

interface LegalProfile {
  calls: number;
  totalMs: number;
  resultMoves: number;
  zeroResultCalls: number;
  byCategory: Record<string, CategoryStats>;
  top5: HeavyCall[];
}

interface RoundTotals {
  wallMs: number;
  turns: number;
  landlords: [number, number, number];
  winners: Record<string, number>;
}

function levelsForSeedIndex(index: number): [AiLevel, AiLevel, AiLevel] {
  const rotation = LEVEL_ROTATIONS[index % LEVEL_ROTATIONS.length];
  return [rotation[0], rotation[1], rotation[2]];
}

function categoryName(category: Category): string {
  return Category[category] ?? String(category);
}

function rankLabel(card: Card): string {
  return RANK_LABEL[card.rank];
}

function cardSort(left: Card, right: Card): number {
  if (left.rank !== right.rank) return left.rank - right.rank;
  return left.suit.localeCompare(right.suit);
}

function cardsText(cards: readonly Card[]): string {
  return cards.slice().sort(cardSort).map(rankLabel).join(' ');
}

function handShape(cards: readonly Card[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    const label = rankLabel(card);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([rank, count]) => `${rank}x${count}`)
    .join(' ');
}

function patternShape(pattern: HandPattern): string {
  return [
    categoryName(pattern.category),
    `len=${pattern.length}`,
    `main=${RANK_LABEL[pattern.mainRank]}`,
    `cards=[${cardsText(pattern.cards)}]`,
  ].join(' ');
}

function rememberHeavyCall(profile: LegalProfile, call: HeavyCall): void {
  profile.top5.push(call);
  profile.top5.sort((left, right) => right.elapsedMs - left.elapsedMs);
  if (profile.top5.length > 5) profile.top5.length = 5;
}

function addCategoryStats(profile: LegalProfile, category: Category, elapsedMs: number): void {
  const key = categoryName(category);
  const current = profile.byCategory[key] ?? { calls: 0, totalMs: 0, maxMs: 0 };
  current.calls += 1;
  current.totalMs += elapsedMs;
  current.maxMs = Math.max(current.maxMs, elapsedMs);
  profile.byCategory[key] = current;
}

function createProfile(): LegalProfile {
  return {
    calls: 0,
    totalMs: 0,
    resultMoves: 0,
    zeroResultCalls: 0,
    byCategory: {},
    top5: [],
  };
}

function profiledLegalFollows(args: {
  profile: LegalProfile;
  hand: Card[];
  current: HandPattern;
  seed: number;
  turnIndex: number;
  seat: SeatIndex;
  level: AiLevel;
}): Move[] {
  const started = performance.now();
  const moves = legalFollows(args.hand, args.current);
  const elapsedMs = performance.now() - started;

  args.profile.calls += 1;
  args.profile.totalMs += elapsedMs;
  args.profile.resultMoves += moves.length;
  if (moves.length === 0) args.profile.zeroResultCalls += 1;
  addCategoryStats(args.profile, args.current.category, elapsedMs);
  rememberHeavyCall(args.profile, {
    elapsedMs,
    seed: args.seed,
    turnIndex: args.turnIndex,
    seat: args.seat,
    level: args.level,
    handCount: args.hand.length,
    handShape: handShape(args.hand),
    currentShape: patternShape(args.current),
    resultMoves: moves.length,
  });

  return moves;
}

function levelBidPolicy(levels: [AiLevel, AiLevel, AiLevel]): BidPolicy {
  return ({ seat, state, hand }) => chooseBidByLevel(hand, state, levels[seat]);
}

async function runBaseline(): Promise<RoundTotals> {
  const started = performance.now();
  const totals: RoundTotals = {
    wallMs: 0,
    turns: 0,
    landlords: [0, 0, 0],
    winners: {},
  };

  for (const [index, seed] of SEEDS.entries()) {
    const levels = levelsForSeedIndex(index);
    const { bidPolicy, playPolicy } = levelPolicies(levels);
    const result = await runHeadlessRound({ seed, bidPolicy, playPolicy });
    totals.turns += result.turns;
    totals.landlords[result.landlord] += 1;
    totals.winners[result.winner] = (totals.winners[result.winner] ?? 0) + 1;
  }

  totals.wallMs = performance.now() - started;
  return totals;
}

async function runProfiled(): Promise<RoundTotals & { legalFollows: LegalProfile }> {
  const profile = createProfile();
  const started = performance.now();
  const totals: RoundTotals = {
    wallMs: 0,
    turns: 0,
    landlords: [0, 0, 0],
    winners: {},
  };

  for (const [index, seed] of SEEDS.entries()) {
    const levels = levelsForSeedIndex(index);
    let turnIndex = 0;
    const playPolicy: PlayPolicy = ({ snapshot, rng, history }) => {
      if (snapshot.top !== null) {
        const hand = requireViewerHand(snapshot);
        profiledLegalFollows({
          profile,
          hand,
          current: snapshot.top.pattern,
          seed,
          turnIndex,
          seat: snapshot.turn,
          level: levels[snapshot.turn],
        });
      }
      turnIndex += 1;
      return strategyFor(levels[snapshot.turn])(snapshot, rng, history ?? []);
    };
    const result = await runHeadlessRound({
      seed,
      bidPolicy: levelBidPolicy(levels),
      playPolicy,
    });
    totals.turns += result.turns;
    totals.landlords[result.landlord] += 1;
    totals.winners[result.winner] = (totals.winners[result.winner] ?? 0) + 1;
  }

  totals.wallMs = performance.now() - started;
  return { ...totals, legalFollows: profile };
}

function requireViewerHand(snapshot: GameSnapshot): Card[] {
  if (!snapshot.viewerHand) throw new Error(`missing viewerHand for seat=${snapshot.turn}`);
  return snapshot.viewerHand;
}

function round(value: number): number {
  return Number(value.toFixed(3));
}

function roundedCategoryStats(stats: Record<string, CategoryStats>): Record<string, CategoryStats> {
  return Object.fromEntries(
    Object.entries(stats).map(([category, value]) => [
      category,
      {
        calls: value.calls,
        totalMs: round(value.totalMs),
        maxMs: round(value.maxMs),
      },
    ]),
  );
}

function cpuModel(): string {
  return os.cpus()[0]?.model ?? 'unknown';
}

async function main(): Promise<void> {
  const baseline = await runBaseline();
  const profiled = await runProfiled();
  const legalRatioOfBaseline = profiled.legalFollows.totalMs / baseline.wallMs;
  const legalRatioOfProfiled = profiled.legalFollows.totalMs / profiled.wallMs;
  const secondStage =
    legalRatioOfBaseline > LEGAL_RATIO_THRESHOLD || baseline.wallMs > SELFPLAY_MS_THRESHOLD;

  const summary = {
    task: 'T-PROFILE-FOLLOWS',
    command: 'npm --prefix test exec tsx test/bench/legal-follows.bench.ts',
    seeds: {
      count: SEEDS.length,
      first: SEEDS[0],
      last: SEEDS[SEEDS.length - 1],
    },
    levelRotation: LEVEL_ROTATIONS,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuModel: cpuModel(),
      cpuCount: os.cpus().length,
      loadavg: os.loadavg().map(round),
      benchmarkConcurrency: 1,
    },
    baseline: {
      selfplay60SeedsMs: round(baseline.wallMs),
      avgMsPerSeed: round(baseline.wallMs / SEEDS.length),
      turns: baseline.turns,
      avgTurnsPerSeed: round(baseline.turns / SEEDS.length),
      landlords: baseline.landlords,
      winners: baseline.winners,
    },
    profiled: {
      instrumentedWallMs: round(profiled.wallMs),
      turns: profiled.turns,
      legalFollows: {
        calls: profiled.legalFollows.calls,
        totalMs: round(profiled.legalFollows.totalMs),
        avgMsPerCall: round(profiled.legalFollows.totalMs / profiled.legalFollows.calls),
        ratioOfBaselineWall: round(legalRatioOfBaseline),
        ratioOfInstrumentedWall: round(legalRatioOfProfiled),
        zeroResultCalls: profiled.legalFollows.zeroResultCalls,
        avgResultMoves: round(profiled.legalFollows.resultMoves / profiled.legalFollows.calls),
        byCategory: roundedCategoryStats(profiled.legalFollows.byCategory),
        top5: profiled.legalFollows.top5.map((call) => ({
          ...call,
          elapsedMs: round(call.elapsedMs),
        })),
      },
    },
    decision: {
      thresholds: {
        legalRatio: LEGAL_RATIO_THRESHOLD,
        selfplay60SeedsMs: SELFPLAY_MS_THRESHOLD,
      },
      secondStageRecommended: secondStage,
      reason: secondStage
        ? 'legalFollows ratio or selfplay wall time exceeded planner threshold'
        : 'both legalFollows ratio and selfplay wall time stayed below planner thresholds',
    },
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
