/**
 * W-AI 竞技场入口（规划者直落 main · 2026-07-17 · sota2）。tsx 运行，两种模式：
 *
 *   跑局（分片）：
 *     npm --prefix test exec tsx -- test/arena/arena.ts \
 *       --pairing=hard --seeds=200 --shard=0/4 --profile=full --out=/tmp/hard-0.json
 *   归并判门：
 *     npm --prefix test exec tsx -- test/arena/arena.ts \
 *       --judge --pairing=hard --profile=full --inputs=/tmp/hard-0.json,/tmp/hard-1.json --out=/tmp/hard-report.json
 *
 * 赛制：镜像换位（arena-lib）。pairing ∈ hard|normal|simple（new-vs-legacy 同档）、
 * self（new-vs-new 框架自证）、crippled（弱桩必须被门抓住）。
 * profile ∈ full|weights-only（后者 hard 档去 PIMC——消融底线）。
 * 阈值（BOARD 裁决）：hard≥+8pp、normal≥+8pp、simple≥+10pp；weights-only 时 hard≥+3pp。
 * 确定性：本文件零时基零随机（时间戳由 coordination/scripts/w-ai-arena.mjs 外层盖）。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { AiLevel, chooseBidByLevel, strategyFor } from '../../assets/scripts/ai';
import type { AiStrategy } from '../../assets/scripts/ai';
import { runHeadlessRound, type BidPolicy, type PlayPolicy } from '../../assets/scripts/flow';
import { enumerateMoves, legalFollows } from '../../assets/scripts/rules';
import { legacyBidByName, legacyStrategyByName, type LegacyLevelName } from '../fixtures/legacy-ai/legacy';
import { judgeCrippledCaught, judgeSelftest, judgeStrength, summarizeMirror, type ArenaGame, type ArenaSide } from './arena-lib';

type Pairing = 'hard' | 'normal' | 'simple' | 'self' | 'crippled';
type Profile = 'full' | 'weights-only';

// W-AI-R2 棘轮(BOARD 2026-07-17):hard 8→9(已交付 +10.17pp,R2 不得回吐;签收目标 +12)。
const STRENGTH_GATE_PP: Record<'hard' | 'normal' | 'simple', number> = { hard: 9, normal: 8, simple: 10 };
const WEIGHTS_ONLY_HARD_GATE_PP = 3;

function parseArgs(argv: string[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const eq = raw.indexOf('=');
    if (eq < 0) out.set(raw.slice(2), 'true');
    else out.set(raw.slice(2, eq), raw.slice(eq + 1));
  }
  return out;
}

function levelOf(pairing: Pairing): AiLevel {
  if (pairing === 'normal') return AiLevel.Normal;
  if (pairing === 'simple') return AiLevel.Simple;
  return AiLevel.Hard; // hard / self / crippled 都在 hard 档上跑
}

const crippledStrategy: AiStrategy = (snapshot) => {
  const hand = snapshot.viewerHand ?? [];
  const moves = snapshot.top ? legalFollows(hand, snapshot.top.pattern) : enumerateMoves(hand);
  if (snapshot.top && moves.length === 0) return { type: 'pass', seat: snapshot.turn };
  const smallest = moves.slice().sort((a, b) => a.cards.length - b.cards.length
    || a.pattern.category - b.pattern.category || a.pattern.mainRank - b.pattern.mainRank)[0]!;
  return { type: 'play', seat: snapshot.turn, cards: smallest.cards.slice() };
};

/** weights-only 消融档：动态解析 B2 的工厂——落地前请求该档给出清晰失败，不拖垮 main 静态类型。 */
async function resolveWeightsOnlyHard(): Promise<AiStrategy> {
  const mod = (await import('../../assets/scripts/ai/levels/hard')) as {
    hardStrategyWithProfile?: (profile: { samples: number; maxCandidates: number }) => AiStrategy;
  };
  if (!mod.hardStrategyWithProfile) {
    throw new Error('weights-only 档需要 B2 落地 hardStrategyWithProfile 后才可用');
  }
  return mod.hardStrategyWithProfile({ samples: 0, maxCandidates: 8 });
}

function newPlayStrategy(pairing: Pairing, level: AiLevel, weightsOnlyHard: AiStrategy | null) {
  if (pairing === 'crippled') return crippledStrategy;
  if (level === AiLevel.Hard && weightsOnlyHard) return weightsOnlyHard;
  return strategyFor(level);
}

function sidePolicies(
  pairing: Pairing,
  seatSides: [ArenaSide, ArenaSide, ArenaSide],
  weightsOnlyHard: AiStrategy | null,
): { playPolicy: PlayPolicy; bidPolicy: BidPolicy } {
  const level = levelOf(pairing);
  const legacyName = (pairing === 'normal' ? 'normal' : pairing === 'simple' ? 'simple' : 'hard') as LegacyLevelName;
  const newPlay = newPlayStrategy(pairing, level, weightsOnlyHard);
  const legacyPlay = pairing === 'self' ? strategyFor(level) : legacyStrategyByName(legacyName);
  return {
    playPolicy: ({ snapshot, rng, history }) => (
      seatSides[snapshot.turn] === 'new'
        ? newPlay(snapshot, rng, history ?? [])
        : legacyPlay(snapshot, rng, history ?? [])
    ),
    bidPolicy: ({ seat, state, hand }) => {
      if (pairing === 'self' || seatSides[seat] === 'new') return chooseBidByLevel(hand, state, level);
      return legacyBidByName(hand, state, legacyName);
    },
  };
}

async function runShard(args: Map<string, string>): Promise<void> {
  const pairing = (args.get('pairing') ?? 'hard') as Pairing;
  const profile = (args.get('profile') ?? 'full') as Profile;
  const seedCount = Number(args.get('seeds') ?? 200);
  const [shardIndex, shardTotal] = (args.get('shard') ?? '0/1').split('/').map(Number);
  const out = args.get('out');
  if (!out) throw new Error('--out required in run mode');
  const weightsOnlyHard = profile === 'weights-only' && levelOf(pairing) === AiLevel.Hard
    ? await resolveWeightsOnlyHard()
    : null;

  const games: ArenaGame[] = [];
  for (let seed = 1; seed <= seedCount; seed += 1) {
    if ((seed - 1) % shardTotal !== shardIndex) continue;
    for (const targetSeat of [0, 1, 2] as const) {
      for (const targetSide of ['new', 'legacy'] as const) {
        const filler: ArenaSide = targetSide === 'new' ? 'legacy' : 'new';
        const seatSides: [ArenaSide, ArenaSide, ArenaSide] = [filler, filler, filler];
        seatSides[targetSeat] = targetSide;
        const { playPolicy, bidPolicy } = sidePolicies(pairing, seatSides, weightsOnlyHard);
        const result = await runHeadlessRound({ seed, playPolicy, bidPolicy });
        games.push({ seed, targetSeat, targetSide, targetScore: result.settlement.scores[targetSeat] });
      }
    }
  }
  writeFileSync(out, `${JSON.stringify({ pairing, profile, shard: `${shardIndex}/${shardTotal}`, games }, null, 1)}\n`);
  console.log(`[arena] shard done pairing=${pairing} profile=${profile} shard=${shardIndex}/${shardTotal} games=${games.length}`);
}

function judgeMerged(args: Map<string, string>): void {
  const pairing = (args.get('pairing') ?? 'hard') as Pairing;
  const profile = (args.get('profile') ?? 'full') as Profile;
  const inputs = (args.get('inputs') ?? '').split(',').filter(Boolean);
  const out = args.get('out');
  if (inputs.length === 0) throw new Error('--inputs required in judge mode');

  const games: ArenaGame[] = [];
  for (const path of inputs) {
    const shard = JSON.parse(readFileSync(path, 'utf8')) as { pairing: Pairing; profile: Profile; games: ArenaGame[] };
    if (shard.pairing !== pairing || shard.profile !== profile) {
      throw new Error(`shard mismatch: ${path} is ${shard.pairing}/${shard.profile}, expected ${pairing}/${profile}`);
    }
    games.push(...shard.games);
  }
  games.sort((a, b) => a.seed - b.seed || a.targetSeat - b.targetSeat || a.targetSide.localeCompare(b.targetSide));

  const summary = summarizeMirror(games);
  const verdict = pairing === 'self'
    ? judgeSelftest(summary)
    : pairing === 'crippled'
      ? judgeCrippledCaught(summary, STRENGTH_GATE_PP.hard)
      : judgeStrength(summary, profile === 'weights-only' && pairing === 'hard'
        ? WEIGHTS_ONLY_HARD_GATE_PP
        : STRENGTH_GATE_PP[pairing]);

  const report = { pairing, profile, summary, verdict };
  const rendered = `${JSON.stringify(report, null, 1)}\n`;
  if (out) writeFileSync(out, rendered);
  console.log(rendered.trimEnd());
  if (!verdict.pass) {
    console.error(`[arena] GATE FAIL pairing=${pairing} profile=${profile}: ${verdict.reasons.join(' ; ')}`);
    process.exitCode = 1;
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.get('judge') === 'true') judgeMerged(args);
  else await runShard(args);
}

void main();
