/**
 * W-AI 修订版：困难档大样本分层门（规划者修订种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/selfplay/hard-depth2-gate.test.ts，独立 seed commit（B2 棒）。
 *
 * ── 修订依据（用户裁决「全体上移一档」的语义重定义，BOARD 已披露）──
 *   G1（Hard vs Simple 对称差）0.4 → **0.25**：Simple≈旧 Normal 后对 Simple 的绝对差必然压缩；
 *   G2（地主角色正差）≥ +0.03 保留；
 *   G3（Hard vs Normal 对称差）0 → **≥ +0.05** 收紧（新引擎不许吃掉分层）。
 *   仍为 env 门控大样本门（SELFPLAY_GATE=1），与竞技场 new-vs-legacy 强度门互补：
 *   本门守「新引擎内三档分层」，竞技场门守「相对旧引擎的提升幅度」。
 *
 * ── 预期红 ── 门控默认跳过；B2 开 SELFPLAY_GATE=1 跑数归档，跌破即阻断。
 * ── 负向变异自证：把 Hard 档路由临时换成 Normal（同策略）→ G3 红（差≈0 < 0.05）。
 */
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

describe.skipIf(!GATE)('T-AI-DEPTH2 selfplay 验收门（三门·W-AI re-baseline）', () => {
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
    // W-AI re-baseline(2026-07-17,BOARD 披露):全体上移后 Simple≈旧 Normal——
    // G1 由 0.4 重定标为 0.25(对 Simple 绝对差压缩);G3 由 ≥0 收紧为 ≥0.05(分层不许被吃掉);
    // G2 地主角色正差不变。跌破即强度回归,不许调低门槛消红。
    expect(gates.g1HardSimpleDiff).toBeGreaterThanOrEqual(0.25);
    expect(gates.g2LandlordDiff).toBeGreaterThanOrEqual(0.03);
    expect(gates.g3HardNormalDiff).toBeGreaterThanOrEqual(0.05);
  }, 1800000);
});
