/**
 * T-AI-1 失败测试（架构种入·不可改）：自对弈质量门。
 * 当前普通档=最小单+无配合 → 组合首出率≈0、压队友率高、与 Simple 胜率无差 → 应先红，实现到绿。
 * 阈值依据：Wave 0 基线实测（当前实现）comboLeadRate Simple≈Normal≈0、详见 T-AI-1 report 对照表；
 * 全链确定性（固定 QUALITY_SEEDS），非统计检验。
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
