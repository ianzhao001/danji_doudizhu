/**
 * W-AI-R3（B0 立度量）：困难档记牌资产利用率诊断门。
 * 三方审查 #21：无指标度量「多少决策帧里 pressureCtx 真的非空 / 底牌归因真的到位」。
 * 本门在确定性 Hard 自对弈里，用导出的 cardMemory 口径统计资产触达率——
 * 若 remainingByRank 常空或 certainLandlordByRank 常 null，说明记牌资产没喂到决策。
 *
 * ── 负向变异自证 ──
 *   ① history 线断（策略拿不到历史 / trackPlayed 恒空）→ memActiveRate 崩 → 红；
 *   ② 底牌归因线断（certainLandlordByRank 恒 null / 底牌未进快照）→ certainRate 崩 → 红。
 * 阈值为「资产在场」地板（非强度门）：触达率显著跌破即记牌线回归。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel, chooseBidByLevel, strategyFor } from '../../assets/scripts/ai';
import { certainLandlordByRank, trackPlayed } from '../../assets/scripts/ai/cardMemory';
import { runHeadlessRound, type BidPolicy, type PlayPolicy } from '../../assets/scripts/flow';

interface Usage {
  decisions: number;
  memActive: number;        // remainingByRank 承载真实出牌信息（history 非空）
  farmerDecisions: number;
  certainActive: number;    // 农民决策里底牌归因给出 ≥1 张「确定仍在地主手」的点
}

const SEEDS = Array.from({ length: 12 }, (_, i) => i + 1);

describe('W-AI-R3 困难档记牌资产利用率诊断', () => {
  it('Hard 自对弈：记牌 remainingByRank 触达 ≥0.8、底牌归因触达农民决策 ≥0.3', async () => {
    const usage: Usage = { decisions: 0, memActive: 0, farmerDecisions: 0, certainActive: 0 };
    const levels: [AiLevel, AiLevel, AiLevel] = [AiLevel.Hard, AiLevel.Hard, AiLevel.Hard];
    const playPolicy: PlayPolicy = ({ snapshot, rng, history }) => {
      const events = history ?? [];
      const hand = snapshot.viewerHand ?? [];
      usage.decisions += 1;
      if (trackPlayed(events, hand).playedCount > 0) usage.memActive += 1;
      if (snapshot.turn !== snapshot.landlord) {
        usage.farmerDecisions += 1;
        const certain = certainLandlordByRank(snapshot, events);
        if (certain && Object.values(certain).some((n) => n > 0)) usage.certainActive += 1;
      }
      return strategyFor(levels[snapshot.turn])(snapshot, rng, events);
    };
    const bidPolicy: BidPolicy = ({ seat, state, hand }) => chooseBidByLevel(hand, state, levels[seat]);
    for (const seed of SEEDS) await runHeadlessRound({ seed, playPolicy, bidPolicy });

    const memRate = usage.memActive / usage.decisions;
    const certainRate = usage.farmerDecisions > 0 ? usage.certainActive / usage.farmerDecisions : 0;
    console.log('[memory-usage]', JSON.stringify({ ...usage, memRate: Math.round(memRate * 1000) / 1000, certainRate: Math.round(certainRate * 1000) / 1000 }));

    expect(usage.decisions, '样本量 sanity').toBeGreaterThan(100);
    expect(usage.farmerDecisions, '农民决策 sanity').toBeGreaterThan(40);
    expect(memRate, '记牌 remainingByRank 触达率（history 线在场）').toBeGreaterThanOrEqual(0.8);
    expect(certainRate, '底牌归因触达农民决策率（底牌线在场）').toBeGreaterThanOrEqual(0.3);
  }, 120_000);
});
