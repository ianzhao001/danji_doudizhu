/**
 * W-AI-R3（B0 立度量）：困难档决策 + 提示延迟测量与回归门（tsx 运行）。
 *   npm --prefix test exec tsx -- test/bench/ai-latency.ts [--low-end-factor=4]
 *
 * 在真实自对弈帧上计时 hardStrategy(HARD_PIMC) 与 adviseBestMove(HINT_PIMC)，报 p50/p95/max。
 * 门＝本机(M4 基线)既有天花板回归：决策 p95<60ms·max<250ms、提示 max<400ms（KNOWN_LIMITATIONS）。
 * 低端机：额外报「实测 × low-end-factor」为代理估计——**需真机校准，不作硬门**（三方审查 #21）。
 */
import { AiLevel, chooseBidByLevel, strategyFor } from '../../assets/scripts/ai';
import { adviseBestMove } from '../../assets/scripts/ai/hint';
import { runHeadlessRound, type BidPolicy, type PlayPolicy } from '../../assets/scripts/flow';
import type { GameEvent, GameSnapshot } from '../../assets/scripts/game';

const factorArg = process.argv.find((a) => a.startsWith('--low-end-factor='));
const LOW_END_FACTOR = factorArg ? Number(factorArg.split('=')[1]) : 4;
const FRAME_CAP = 60;
const HINT_FRAMES = 24;

interface Frame { snapshot: GameSnapshot; history: GameEvent[]; }

function pct(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]!;
}
function stats(xs: number[]) {
  const s = xs.slice().sort((a, b) => a - b);
  const round = (v: number) => Math.round(v * 100) / 100;
  return { p50: round(pct(s, 0.5)), p95: round(pct(s, 0.95)), max: round(s[s.length - 1] ?? 0) };
}

async function main(): Promise<void> {
  const frames: Frame[] = [];
  const levels: [AiLevel, AiLevel, AiLevel] = [AiLevel.Hard, AiLevel.Hard, AiLevel.Hard];
  const bidPolicy: BidPolicy = ({ seat, state, hand }) => chooseBidByLevel(hand, state, levels[seat]);
  const playPolicy: PlayPolicy = ({ snapshot, rng, history }) => {
    const events = history ?? [];
    if (frames.length < FRAME_CAP && (snapshot.viewerHand?.length ?? 0) > 0) {
      frames.push(JSON.parse(JSON.stringify({ snapshot, history: events })) as Frame);
    }
    return strategyFor(levels[snapshot.turn])(snapshot, rng, events);
  };
  for (let seed = 1; frames.length < FRAME_CAP && seed <= 20; seed += 1) {
    await runHeadlessRound({ seed, playPolicy, bidPolicy });
  }

  const hard = strategyFor(AiLevel.Hard);
  const decisionMs: number[] = [];
  for (const fx of frames) {
    const t = performance.now();
    hard(fx.snapshot, { next: () => 0 }, fx.history);
    decisionMs.push(performance.now() - t);
  }
  const hintMs: number[] = [];
  for (const fx of frames.slice(0, HINT_FRAMES)) {
    const t = performance.now();
    adviseBestMove({ snapshot: fx.snapshot, history: fx.history, viewerSeat: fx.snapshot.turn });
    hintMs.push(performance.now() - t);
  }

  const decision = stats(decisionMs);
  const hint = stats(hintMs);
  const lowEnd = {
    decisionP95: Math.round(decision.p95 * LOW_END_FACTOR * 100) / 100,
    hintMax: Math.round(hint.max * LOW_END_FACTOR * 100) / 100,
  };
  console.log(JSON.stringify({ frames: frames.length, decision, hint, lowEndFactor: LOW_END_FACTOR, lowEnd }, null, 1));

  const reasons: string[] = [];
  if (decision.p95 >= 60) reasons.push(`决策 p95 回归: ${decision.p95}ms ≥ 60ms`);
  if (decision.max >= 250) reasons.push(`决策 max 回归: ${decision.max}ms ≥ 250ms`);
  if (hint.max >= 400) reasons.push(`提示 max 回归: ${hint.max}ms ≥ 400ms`);
  if (reasons.length > 0) {
    console.error(`[latency] GATE FAIL (M4 基线天花板): ${reasons.join(' ; ')}`);
    process.exitCode = 1;
  } else {
    console.log('[latency] PASS (M4 基线天花板)；低端代理见 lowEnd，需真机校准');
  }
}

void main();
