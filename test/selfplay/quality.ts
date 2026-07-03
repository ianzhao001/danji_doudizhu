/**
 * T-AI 自对弈质量指标 runner（纯测试代码·架构维护——实现方只读不改）。
 * 全链确定性（策略确定 + seed 化 rng）→ 指标是**确定性回归门**，不是统计检验，不会 CI 抖动。
 * 指标定义（T-AI-1 spec §质量指标门）：
 * - 组合首出率：领出且 enumerateMoves 存在 ≥2 张非炸组合机会时，实际打出 ≥2 张的占比。
 * - 压队友率：农民回合、顶牌来自队友农民、地主手牌 >2、且存在合法压牌时，选择压过（非 pass）的占比。
 * - 胜率差：winRate(单席 A 对双席 B，三席轮换) − winRate(单席 B 对双席 A)。
 */
import { AiLevel, chooseBidByLevel, strategyFor } from '../../assets/scripts/ai';
import { runHeadlessRound, type BidPolicy, type PlayPolicy } from '../../assets/scripts/flow';
import { enumerateMoves, isBombLike, legalFollows } from '../../assets/scripts/rules';

export const QUALITY_SEEDS: number[] = Array.from({ length: 30 }, (_, i) => i + 1);

export interface LevelPlayMetrics {
  comboLeadRate: number | null;
  teammateOverrideRate: number | null;
  leadComboOps: number;
  teammateBeatOps: number;
  rounds: number;
}

interface PlayStats {
  leadOps: number;
  leadCombos: number;
  teamOps: number;
  teamBeats: number;
}

function statsPolicy(levels: [AiLevel, AiLevel, AiLevel], stats: PlayStats | null): PlayPolicy {
  return ({ snapshot, rng }) => {
    const action = strategyFor(levels[snapshot.turn])(snapshot, rng);
    if (stats) {
      const hand = snapshot.viewerHand ?? [];
      if (snapshot.top === null) {
        const moves = enumerateMoves(hand);
        const hasCombo = moves.some((m) => m.cards.length >= 2 && !isBombLike(m.pattern.category));
        if (hasCombo) {
          stats.leadOps += 1;
          if (action.type === 'play' && action.cards.length >= 2) stats.leadCombos += 1;
        }
      } else {
        const isFarmer = snapshot.turn !== snapshot.landlord;
        const teammateTop =
          isFarmer && snapshot.top.seat !== snapshot.landlord && snapshot.top.seat !== snapshot.turn;
        if (
          teammateTop &&
          snapshot.handCounts[snapshot.landlord] > 2 &&
          legalFollows(hand, snapshot.top.pattern).length > 0
        ) {
          stats.teamOps += 1;
          if (action.type === 'play') stats.teamBeats += 1;
        }
      }
    }
    return action;
  };
}

function levelBidPolicy(levels: [AiLevel, AiLevel, AiLevel]): BidPolicy {
  return ({ seat, state, hand }) => chooseBidByLevel(hand, state, levels[seat]);
}

/** 同质三席自对弈，测该档的组合首出率与压队友率。 */
export async function measureLevelPlay(level: AiLevel, seeds: number[]): Promise<LevelPlayMetrics> {
  const levels: [AiLevel, AiLevel, AiLevel] = [level, level, level];
  const stats: PlayStats = { leadOps: 0, leadCombos: 0, teamOps: 0, teamBeats: 0 };
  const playPolicy = statsPolicy(levels, stats);
  const bidPolicy = levelBidPolicy(levels);
  for (const seed of seeds) {
    await runHeadlessRound({ seed, playPolicy, bidPolicy });
  }
  return {
    comboLeadRate: stats.leadOps > 0 ? stats.leadCombos / stats.leadOps : null,
    teammateOverrideRate: stats.teamOps > 0 ? stats.teamBeats / stats.teamOps : null,
    leadComboOps: stats.leadOps,
    teammateBeatOps: stats.teamOps,
    rounds: seeds.length,
  };
}

export interface WinRateGap {
  targetA: number;
  targetB: number;
  diff: number;
  roundsPerSide: number;
}

async function winRateSingleTarget(target: AiLevel, others: AiLevel, seeds: number[]): Promise<number> {
  let wins = 0;
  let rounds = 0;
  for (const targetSeat of [0, 1, 2] as const) {
    const levels: [AiLevel, AiLevel, AiLevel] = [others, others, others];
    levels[targetSeat] = target;
    const playPolicy = statsPolicy(levels, null);
    const bidPolicy = levelBidPolicy(levels);
    for (const seed of seeds) {
      const result = await runHeadlessRound({ seed, playPolicy, bidPolicy });
      rounds += 1;
      if (result.settlement.scores[targetSeat] > 0) wins += 1;
    }
  }
  return wins / rounds;
}

/** 单席 target 对双席 others 的胜率差（A 视角减 B 视角）。 */
export async function measureWinRateGap(a: AiLevel, b: AiLevel, seeds: number[]): Promise<WinRateGap> {
  const targetA = await winRateSingleTarget(a, b, seeds);
  const targetB = await winRateSingleTarget(b, a, seeds);
  return { targetA, targetB, diff: targetA - targetB, roundsPerSide: seeds.length * 3 };
}
