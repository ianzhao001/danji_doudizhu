/**
 * W-AI 竞技场纯函数库（规划者直落 main · 2026-07-17 · sota2）。
 * 赛制思想吸收 kwai/DouZero(Apache-2.0) evaluate 的镜像换位法：同一副牌（同 seed）
 * 在同一目标席位上分别由「新引擎目标 vs 旧引擎陪练」与「旧引擎目标 vs 新引擎陪练」
 * 各打一局，配对分差在同 (seed,seat) 内相减——发牌运气在配对内抵消。
 * 本文件只放纯判定逻辑（node 可测，见 arena-selftest.test.ts）；跑局在 arena.ts。
 */

export type ArenaSide = 'new' | 'legacy';

export interface ArenaGame {
  seed: number;
  targetSeat: 0 | 1 | 2;
  targetSide: ArenaSide;
  /** 目标席该局结算分（正=赢）。 */
  targetScore: number;
}

export interface PairingSummary {
  pairs: number;
  games: number;
  /** 每个 (seed,seat) 恰好一新一旧两局。 */
  complete: boolean;
  newWinRate: number;
  legacyWinRate: number;
  /** (newWinRate − legacyWinRate) × 100，百分点。 */
  mirrorWinRateDiffPp: number;
  /** mean(new.targetScore − legacy.targetScore)，配对分差。 */
  avgPairedScoreDiff: number;
}

export interface GateVerdict {
  pass: boolean;
  reasons: string[];
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export function summarizeMirror(games: ArenaGame[]): PairingSummary {
  const byPair = new Map<string, Partial<Record<ArenaSide, ArenaGame>>>();
  for (const game of games) {
    const key = `${game.seed}|${game.targetSeat}`;
    const slot = byPair.get(key) ?? {};
    if (slot[game.targetSide]) {
      // 同 (seed,seat,side) 重复 → 配对失真，判不完整。
      return {
        pairs: byPair.size, games: games.length, complete: false,
        newWinRate: 0, legacyWinRate: 0, mirrorWinRateDiffPp: 0, avgPairedScoreDiff: 0,
      };
    }
    slot[game.targetSide] = game;
    byPair.set(key, slot);
  }

  let complete = byPair.size > 0;
  let newWins = 0;
  let legacyWins = 0;
  let diffSum = 0;
  let pairs = 0;
  for (const slot of byPair.values()) {
    const fresh = slot.new;
    const old = slot.legacy;
    if (!fresh || !old) {
      complete = false;
      continue;
    }
    pairs += 1;
    if (fresh.targetScore > 0) newWins += 1;
    if (old.targetScore > 0) legacyWins += 1;
    diffSum += fresh.targetScore - old.targetScore;
  }

  const newWinRate = pairs > 0 ? newWins / pairs : 0;
  const legacyWinRate = pairs > 0 ? legacyWins / pairs : 0;
  return {
    pairs,
    games: games.length,
    complete,
    newWinRate: round4(newWinRate),
    legacyWinRate: round4(legacyWinRate),
    mirrorWinRateDiffPp: round4((newWinRate - legacyWinRate) * 100),
    avgPairedScoreDiff: round4(pairs > 0 ? diffSum / pairs : 0),
  };
}

/** 强度门：镜像胜率差 ≥ 阈值(pp) 且配对分差为正 且配对完整。 */
export function judgeStrength(summary: PairingSummary, minDiffPp: number): GateVerdict {
  const reasons: string[] = [];
  if (!summary.complete || summary.pairs === 0) reasons.push(`配对不完整: pairs=${summary.pairs} games=${summary.games}`);
  if (summary.mirrorWinRateDiffPp < minDiffPp) {
    reasons.push(`镜像胜率差不足: ${summary.mirrorWinRateDiffPp}pp < ${minDiffPp}pp`);
  }
  if (summary.avgPairedScoreDiff <= 0) {
    reasons.push(`配对分差非正: ${summary.avgPairedScoreDiff}`);
  }
  return { pass: reasons.length === 0, reasons };
}

/** 自证门（new-vs-new）：两向引擎同一 → 逐对分数必须严格相等（差恒 0）。 */
export function judgeSelftest(summary: PairingSummary): GateVerdict {
  const reasons: string[] = [];
  if (!summary.complete || summary.pairs === 0) reasons.push(`配对不完整: pairs=${summary.pairs}`);
  if (summary.mirrorWinRateDiffPp !== 0) reasons.push(`同引擎镜像差应为 0，实测 ${summary.mirrorWinRateDiffPp}pp`);
  if (summary.avgPairedScoreDiff !== 0) reasons.push(`同引擎配对分差应为 0，实测 ${summary.avgPairedScoreDiff}`);
  return { pass: reasons.length === 0, reasons };
}

/** crippled 自证：弱桩目标必须被强度门抓住（gate 能抓弱 = gate 不是摆设）。 */
export function judgeCrippledCaught(summary: PairingSummary, minDiffPp: number): GateVerdict {
  const strength = judgeStrength(summary, minDiffPp);
  if (strength.pass) {
    return { pass: false, reasons: ['弱桩未被强度门拦下——门自证失败'] };
  }
  if (!summary.complete) return { pass: false, reasons: ['配对不完整，自证无效'] };
  return { pass: true, reasons: [] };
}
