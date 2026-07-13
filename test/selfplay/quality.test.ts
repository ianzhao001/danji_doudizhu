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
  it('Hard 组合首出率 ≥0.70（结构领出底线）；压队友率 ≤0.08', async () => {
    const hardPlay = await measureLevelPlay(AiLevel.Hard, QUALITY_SEEDS);
    console.log('[quality] hard levelPlay:', JSON.stringify({ hard: hardPlay }));
    expect(hardPlay.leadComboOps, '样本量 sanity').toBeGreaterThan(20);
    // W-AUDIT-AI 契约改写(披露):旧断言与 Normal 组合率(≈0.985 近天花板)挂钩。
    // 拆解驱动内核的领出按结构代价择优,~12% 的单张领出是有意的节奏/喂牌/脱牌决策,
    // 且胜率差同步从 +0.03 档跃至 +0.11 档——风格挂钩失去意义。
    // 改固定底线 0.70:仍然拦得住「退化回无脑最小单」,不再绑 Normal 的风格。
    expect(hardPlay.comboLeadRate ?? 0, 'Hard 组合首出率').toBeGreaterThanOrEqual(0.7);
    expect(hardPlay.teammateOverrideRate ?? 0, 'Hard 压队友率').toBeLessThanOrEqual(0.08);
  }, 180_000);

  it('胜率差：Hard−Normal ≥ +0.05、Hard−Simple ≥ +0.15（对称单席轮换·seeds 1..20）', async () => {
    const gapSeeds = QUALITY_SEEDS.slice(0, 20);
    const hardVsNormal = await measureWinRateGap(AiLevel.Hard, AiLevel.Normal, gapSeeds);
    const hardVsSimple = await measureWinRateGap(AiLevel.Hard, AiLevel.Simple, gapSeeds);
    console.log('[quality] hard gaps:', JSON.stringify({ hardVsNormal, hardVsSimple }));
    // W-AUDIT-AI 门槛收紧:拆解内核实测 Hard−Normal=+0.117、Hard−Simple=+0.567(2026-07-13),
    // 底线取实测−安全边距;跌破即强度回归,不许调低门槛消红。
    expect(hardVsNormal.diff, 'Hard−Normal').toBeGreaterThanOrEqual(0.05);
    expect(hardVsSimple.diff, 'Hard−Simple').toBeGreaterThanOrEqual(0.15);
  }, 180_000);
});
