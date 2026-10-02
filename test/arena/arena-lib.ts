/**
 * W-AI 竞技场纯函数库（规划者直落 main · 2026-07-17 · sota2 · W-AI-R3 扩展）。
 * 赛制思想吸收 kwai/DouZero(Apache-2.0) evaluate 的镜像换位法：同一副牌（同 seed）
 * 在同一目标席位上分别由「新引擎目标 vs 旧引擎陪练」与「旧引擎目标 vs 新引擎陪练」
 * 各打一局，配对分差在同 (seed,seat) 内相减——发牌运气在配对内抵消。
 * 本文件只放纯判定逻辑（node 可测，见 arena-selftest.test.ts）；跑局在 arena.ts。
 *
 * W-AI-R3（B0 立度量）新增（全部 additive，不改既有点估门口径）：
 *  ① 每局补记 landlord → 按目标相对角色（地主/上家/下家）分层汇总；
 *  ② seed 聚类配对 bootstrap 置信区间（胜率差 pp / 配对分差），确定性走 createRng；
 *  ③ landlordSplitPairs：镜像两向落不同地主的对数（叫牌未固定时的分层污染信号）。
 */
import { createRng } from '../../assets/scripts/rules';

export type ArenaSide = 'new' | 'legacy';
export type ArenaRole = 'landlord' | 'upper' | 'lower';

export interface ArenaGame {
  seed: number;
  targetSeat: 0 | 1 | 2;
  targetSide: ArenaSide;
  /** 目标席该局结算分（正=赢）。 */
  targetScore: number;
  /** 该局地主席（W-AI-R3 补记，用于角色分层；旧数据/自证合成集可缺省）。 */
  landlord?: 0 | 1 | 2;
}

export interface ConfidenceInterval {
  /** 95% seed 聚类配对 bootstrap 区间。 */
  lo: number;
  hi: number;
}

export interface RoleSummary {
  role: ArenaRole;
  pairs: number;
  mirrorWinRateDiffPp: number;
  avgPairedScoreDiff: number;
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
  /** seed 聚类 bootstrap 95% 区间（配对完整且至少两个独立 seed 时给出）。 */
  mirrorWinRateDiffPpCI?: ConfidenceInterval;
  avgPairedScoreDiffCI?: ConfidenceInterval;
  /** W-AI-R3 additive：按目标相对地主的角色分层（仅统计两向同地主的干净对）。 */
  byRole?: RoleSummary[];
  /** W-AI-R3 additive：镜像两向落不同地主的对数（叫牌未固定时>0，分层被污染）。 */
  landlordSplitPairs?: number;
  /** 独立发牌 seed 数；CI 按 seed 整组重采样，保留席位间相关性。 */
  seedClusters?: number;
  ciMethod?: 'seed-cluster-bootstrap';
  /** 未舍入的逐对分数不相等数量；self 门必须有此证据。 */
  selfMismatchPairs?: number;
}

export interface GateVerdict {
  pass: boolean;
  reasons: string[];
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

/** 目标席相对地主的角色：地主 / 上家(地主上手) / 下家(地主下手)。 */
export function roleOf(targetSeat: 0 | 1 | 2, landlord: 0 | 1 | 2): ArenaRole {
  if (targetSeat === landlord) return 'landlord';
  return (landlord + 1) % 3 === targetSeat ? 'lower' : 'upper';
}

interface Pair {
  seed: number;
  scoreDiff: number;
  newWin: boolean;
  legacyWin: boolean;
  role: ArenaRole | null;
}

/** 按 seed 重采样整组配对；组内席位共享发牌，不能作为独立样本。 */
function bootstrapCI(clusters: readonly Pair[][], value: (pair: Pair) => number, seedBase: number): ConfidenceInterval {
  const n = clusters.length;
  const totals = clusters.map((rows) => ({ sum: rows.reduce((sum, pair) => sum + value(pair), 0), count: rows.length }));
  const B = 2000;
  const rng = createRng(seedBase >>> 0);
  const means: number[] = [];
  for (let b = 0; b < B; b += 1) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < n; i += 1) {
      const cluster = totals[Math.floor(rng.next() * n)]!;
      sum += cluster.sum;
      count += cluster.count;
    }
    means.push(sum / count);
  }
  means.sort((a, b) => a - b);
  const at = (q: number): number => means[Math.min(B - 1, Math.max(0, Math.floor(q * B)))]!;
  return { lo: round4(at(0.025)), hi: round4(at(0.975)) };
}

export function summarizeMirror(games: ArenaGame[]): PairingSummary {
  const byPair = new Map<string, Partial<Record<ArenaSide, ArenaGame>>>();
  for (const game of games) {
    // JSON 输入不受 TypeScript 类型保护；非法分数不能借 NaN 比较绕过门。
    if (!game || !Number.isSafeInteger(game.seed) || game.seed < 0 || game.seed > 0xffff_ffff
      || ![0, 1, 2].includes(game.targetSeat)
      || (game.targetSide !== 'new' && game.targetSide !== 'legacy')
      || !Number.isSafeInteger(game.targetScore) || game.targetScore === 0
      || (game.landlord !== undefined && ![0, 1, 2].includes(game.landlord))) {
      throw new Error('Invalid arena game: expected uint32 seed, valid seats/side and nonzero safe integer score');
    }
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
  let landlordSplitPairs = 0;
  const collected: Pair[] = [];
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
    const split = fresh.landlord !== undefined && old.landlord !== undefined && fresh.landlord !== old.landlord;
    if (split) landlordSplitPairs += 1;
    collected.push({
      seed: fresh.seed,
      scoreDiff: fresh.targetScore - old.targetScore,
      newWin: fresh.targetScore > 0,
      legacyWin: old.targetScore > 0,
      // 角色仅在两向同地主（干净对）时判定，避免叫牌分叉污染分层。
      role: fresh.landlord !== undefined && old.landlord !== undefined && !split ? roleOf(fresh.targetSeat, fresh.landlord) : null,
    });
  }

  const newWinRate = pairs > 0 ? newWins / pairs : 0;
  const legacyWinRate = pairs > 0 ? legacyWins / pairs : 0;
  const summary: PairingSummary = {
    pairs,
    games: games.length,
    complete,
    newWinRate: round4(newWinRate),
    legacyWinRate: round4(legacyWinRate),
    mirrorWinRateDiffPp: round4((newWinRate - legacyWinRate) * 100),
    avgPairedScoreDiff: round4(pairs > 0 ? diffSum / pairs : 0),
    selfMismatchPairs: collected.filter((pair) => pair.scoreDiff !== 0).length,
  };

  if (pairs > 0) {
    const bySeed = new Map<number, Pair[]>();
    for (const pair of collected) {
      const rows = bySeed.get(pair.seed) ?? [];
      rows.push(pair);
      bySeed.set(pair.seed, rows);
    }
    const clusters = [...bySeed.entries()].sort(([a], [b]) => a - b).map(([, rows]) => rows);
    summary.seedClusters = clusters.length;
    summary.ciMethod = 'seed-cluster-bootstrap';
    // 单一独立发牌无法估计发牌间不确定性，CI 留空以让强度 CI 门拒绝。
    if (complete && clusters.length >= 2) {
      summary.avgPairedScoreDiffCI = bootstrapCI(clusters, (p) => p.scoreDiff, 0x5eed_5c04);
      summary.mirrorWinRateDiffPpCI = bootstrapCI(
        clusters, (p) => ((p.newWin ? 1 : 0) - (p.legacyWin ? 1 : 0)) * 100, 0x5eed_9d17,
      );
    }
    const roles: ArenaRole[] = ['landlord', 'upper', 'lower'];
    const byRole: RoleSummary[] = [];
    for (const role of roles) {
      const rows = collected.filter((p) => p.role === role);
      if (rows.length === 0) continue;
      const rNew = rows.filter((p) => p.newWin).length / rows.length;
      const rOld = rows.filter((p) => p.legacyWin).length / rows.length;
      byRole.push({
        role,
        pairs: rows.length,
        mirrorWinRateDiffPp: round4((rNew - rOld) * 100),
        avgPairedScoreDiff: round4(rows.reduce((s, p) => s + p.scoreDiff, 0) / rows.length),
      });
    }
    if (byRole.length > 0) summary.byRole = byRole;
    summary.landlordSplitPairs = landlordSplitPairs;
  }

  return summary;
}

/** 强度门：镜像胜率差 ≥ 阈值(pp) 且配对分差为正 且配对完整。 */
export function judgeStrength(summary: PairingSummary, minDiffPp: number): GateVerdict {
  const reasons: string[] = [];
  if (!Number.isFinite(minDiffPp) || !Number.isFinite(summary.mirrorWinRateDiffPp)
    || !Number.isFinite(summary.avgPairedScoreDiff)) reasons.push('强度统计必须为有限数值');
  if (!summary.complete || summary.pairs === 0) reasons.push(`配对不完整: pairs=${summary.pairs} games=${summary.games}`);
  if (summary.mirrorWinRateDiffPp < minDiffPp) {
    reasons.push(`镜像胜率差不足: ${summary.mirrorWinRateDiffPp}pp < ${minDiffPp}pp`);
  }
  if (summary.avgPairedScoreDiff <= 0) {
    reasons.push(`配对分差非正: ${summary.avgPairedScoreDiff}`);
  }
  return { pass: reasons.length === 0, reasons };
}

/**
 * W-AI-R3 强度门（置信下界版·additive）：在既有点估门之上叠 CI 下界闭合，
 * 用于「候选 vs v1.9」出牌隔离度量——点估达标还不够，还要 95% 区间下界 > 0，
 * 才承认是真增益而非采样噪声。既有 judgeStrength 保持不变。
 */
export function judgeStrengthCI(summary: PairingSummary, minDiffPp: number): GateVerdict {
  const base = judgeStrength(summary, minDiffPp);
  const reasons = [...base.reasons];
  for (const [label, ci] of [
    ['配对分差', summary.avgPairedScoreDiffCI], ['胜率差', summary.mirrorWinRateDiffPpCI],
  ] as const) {
    if (!ci || !Number.isFinite(ci.lo) || !Number.isFinite(ci.hi) || ci.lo > ci.hi) {
      reasons.push(`${label} CI 缺失或无效`);
    } else if (ci.lo <= 0) {
      reasons.push(`${label} CI 下界非正: ${ci.lo}`);
    }
  }
  return { pass: reasons.length === 0, reasons };
}

/** 自证门（new-vs-new）：两向引擎同一 → 逐对分数必须严格相等（差恒 0）。 */
export function judgeSelftest(summary: PairingSummary): GateVerdict {
  const reasons: string[] = [];
  if (!summary.complete || summary.pairs === 0) reasons.push(`配对不完整: pairs=${summary.pairs}`);
  if (summary.selfMismatchPairs !== 0) reasons.push(`逐对分数不一致或缺少证据: ${summary.selfMismatchPairs}`);
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
