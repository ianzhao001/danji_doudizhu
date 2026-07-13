import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import { runDifficultyMatchup } from './difficulty';

/**
 * 困难档增强门：
 * 通过固定 seed 的自对弈统计，验证困难档对简单档与普通档的分层没有回退。
 * 重跑成本较高，默认跳过；`SELFPLAY_GATE=1` 开启，`SELFPLAY_SEEDS` 可调。
 */
const GATE = process.env.SELFPLAY_GATE === '1';
const SEED_COUNT = Number(process.env.SELFPLAY_SEEDS ?? 100);
const seeds = Array.from({ length: SEED_COUNT }, (_, i) => i + 1);

interface TargetStats {
  winRate: number;
  landlordWinRate: number;
}

async function targetStats(target: AiLevel, filler: AiLevel): Promise<TargetStats> {
  let wins = 0;
  let total = 0;
  let llWins = 0;
  let llTotal = 0;
  for (const seat of [0, 1, 2] as const) {
    const levels = [filler, filler, filler] as [AiLevel, AiLevel, AiLevel];
    levels[seat] = target;
    const summaries = await runDifficultyMatchup(levels, seeds);
    for (const s of summaries) {
      const targetIsLandlord = s.landlord === seat;
      const landlordWon = s.winner === 'landlord';
      const targetWon = targetIsLandlord === landlordWon;
      if (targetWon) wins += 1;
      total += 1;
      if (targetIsLandlord) {
        llTotal += 1;
        if (targetWon) llWins += 1;
      }
    }
  }
  return { winRate: wins / total, landlordWinRate: llWins / Math.max(1, llTotal) };
}

describe.skipIf(!GATE)('T-AI-DEPTH2 selfplay 验收门（三门）', () => {
  it(`G1/G2/G3 @ ${SEED_COUNT} seed × 3 席`, async () => {
    const hardInNormal = await targetStats(AiLevel.Hard, AiLevel.Normal);
    const normalInHard = await targetStats(AiLevel.Normal, AiLevel.Hard);
    const hardInSimple = await targetStats(AiLevel.Hard, AiLevel.Simple);
    const simpleInHard = await targetStats(AiLevel.Simple, AiLevel.Hard);
    const gates = {
      seeds: SEED_COUNT,
      g1HardSimpleDiff: hardInSimple.winRate - simpleInHard.winRate,
      g2LandlordDiff: hardInNormal.landlordWinRate - normalInHard.landlordWinRate,
      g3HardNormalDiff: hardInNormal.winRate - normalInHard.winRate,
      detail: {
        hardInNormal, normalInHard, hardInSimple, simpleInHard,
      },
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(gates));
    // W-AUDIT-AI 门槛收紧(2026-07-13):拆解内核+结构化叫分落地后,
    // G2 从「容忍 −0.03」升为「地主角色正差 ≥ +0.03」(消灭登记过的地主角色反转),
    // G3 从「容忍 Hard 弱 12pp 的过渡态」收为「Hard 不得弱于 Normal(≥0)」。
    // 跌破即强度回归,不许调低门槛消红。
    expect(gates.g1HardSimpleDiff).toBeGreaterThanOrEqual(0.4);
    expect(gates.g2LandlordDiff).toBeGreaterThanOrEqual(0.03);
    expect(gates.g3HardNormalDiff).toBeGreaterThanOrEqual(0);
  }, 1800000);
});
