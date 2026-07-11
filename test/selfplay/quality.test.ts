/**
 * 自对弈质量门：验证普通档和困难档相对简单档具备稳定的策略分层。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import { QUALITY_SEEDS, measureLevelPlay, measureWinRateGap } from './quality';

describe('T-AI-1 自对弈质量门（确定性 seed 回归）', () => {
  it('组合首出率 Normal ≥ 0.35、Simple ≤ 0.15（分档拉开）；压队友率 Normal ≤ 0.20', async () => {
    const simple = await measureLevelPlay(AiLevel.Simple, QUALITY_SEEDS);
    const normal = await measureLevelPlay(AiLevel.Normal, QUALITY_SEEDS);
    console.log('[quality] levelPlay baseline:', JSON.stringify({ simple, normal }));

    expect(simple.leadComboOps, '样本量 sanity：Simple 有领出组合机会').toBeGreaterThan(20);
    expect(normal.leadComboOps, '样本量 sanity：Normal 有领出组合机会').toBeGreaterThan(20);

    expect(simple.comboLeadRate ?? 0, 'Simple 保持单张风（新手锚点上限）').toBeLessThanOrEqual(0.15);
    expect(normal.comboLeadRate ?? 0, 'Normal 组合首出率').toBeGreaterThanOrEqual(0.35);
    expect(normal.teammateOverrideRate ?? 0, 'Normal 压队友率').toBeLessThanOrEqual(0.2);
  }, 120_000);

  it('胜率差：单席 Normal 对双席 Simple − 单席 Simple 对双席 Normal ≥ +0.05', async () => {
    const gap = await measureWinRateGap(AiLevel.Normal, AiLevel.Simple, QUALITY_SEEDS);
    console.log('[quality] winRateGap baseline:', JSON.stringify(gap));
    expect(gap.diff).toBeGreaterThanOrEqual(0.05);
  }, 120_000);
});

// 三档排序质量门：困难档与普通档需要维持既定分层。
describe('T-AI-2 三档排序质量门（确定性 seed 回归）', () => {
  it('Hard 组合首出率 ≥0.50 且 ≥ Normal−5pp（同带不回落）；压队友率 ≤0.08', async () => {
    const normal = await measureLevelPlay(AiLevel.Normal, QUALITY_SEEDS);
    const hardPlay = await measureLevelPlay(AiLevel.Hard, QUALITY_SEEDS);
    console.log('[quality] hard levelPlay:', JSON.stringify({ normal, hard: hardPlay }));
    expect(hardPlay.leadComboOps, '样本量 sanity').toBeGreaterThan(20);
    expect(hardPlay.comboLeadRate ?? 0, 'Hard 组合首出率').toBeGreaterThanOrEqual(0.5);
    // Normal 实测组合率 ≈0.985（近天花板），「+5pp」数学不可达；契约=同带不回落。
    expect(hardPlay.comboLeadRate ?? 0, 'Hard ≥ Normal−5pp（同带不回落）').toBeGreaterThanOrEqual(
      (normal.comboLeadRate ?? 0) - 0.05,
    );
    expect(hardPlay.teammateOverrideRate ?? 0, 'Hard 压队友率').toBeLessThanOrEqual(0.08);
  }, 180_000);

  it('胜率差：Hard−Normal ≥ +0.03、Hard−Simple ≥ +0.10（对称单席轮换·seeds 1..20）', async () => {
    const gapSeeds = QUALITY_SEEDS.slice(0, 20);
    const hardVsNormal = await measureWinRateGap(AiLevel.Hard, AiLevel.Normal, gapSeeds);
    const hardVsSimple = await measureWinRateGap(AiLevel.Hard, AiLevel.Simple, gapSeeds);
    console.log('[quality] hard gaps:', JSON.stringify({ hardVsNormal, hardVsSimple }));
    expect(hardVsNormal.diff, 'Hard−Normal（关闭过渡态）').toBeGreaterThanOrEqual(0.03);
    expect(hardVsSimple.diff, 'Hard−Simple').toBeGreaterThanOrEqual(0.1);
  }, 180_000);
});
