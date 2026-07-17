/**
 * W-AI 修订版：自对弈质量门 re-baseline（规划者修订种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/selfplay/quality.test.ts，独立 seed commit（B2 棒）。
 *
 * ── 修订依据（用户裁决「全体上移一档」的语义重定义，非降门消红——BOARD 已披露）──
 *   ① 旧「Simple comboLeadRate ≤ 0.15 新手锚点上限」随裁决**废止**，改下限 ≥0.35（≈旧 Normal 底线）；
 *   ② Normal（结构引擎）组合首出率下限 0.50；
 *   ③ Hard 底线 0.70 与压队友率各档上限保留；
 *   ④ 胜率差：Normal−Simple ≥ +0.05、Hard−Normal ≥ +0.05 保留；
 *      Hard−Simple 0.15 → **0.10**（Simple 整体变强必然压缩绝对差；单调仍双向把守）。
 *   B2 跑数后允许**只升不降**回填更紧底线（升级须在报告中列新旧值）。
 *
 * ── 预期红（对 main 现实现）── ①红（旧 Simple 组合率≈0）。②-④对旧实现绿（回归性质）。
 * ── 负向变异自证：Simple 回退 pickSmallest → ① 红；Normal 去结构跟牌 → ②或胜率差红。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import { QUALITY_SEEDS, measureLevelPlay, measureWinRateGap } from './quality';

describe('T-AI-1 自对弈质量门（确定性 seed 回归·W-AI re-baseline）', () => {
  it('组合首出率：Simple ≥ 0.35（全体上移）、Normal ≥ 0.50；压队友率两档 ≤ 0.20', async () => {
    const simple = await measureLevelPlay(AiLevel.Simple, QUALITY_SEEDS);
    const normal = await measureLevelPlay(AiLevel.Normal, QUALITY_SEEDS);
    console.log('[quality] levelPlay baseline:', JSON.stringify({ simple, normal }));

    expect(simple.leadComboOps, '样本量 sanity：Simple 有领出组合机会').toBeGreaterThan(20);
    expect(normal.leadComboOps, '样本量 sanity：Normal 有领出组合机会').toBeGreaterThan(20);

    expect(simple.comboLeadRate ?? 0, 'Simple 组合首出率（≈旧 Normal 底线）').toBeGreaterThanOrEqual(0.35);
    expect(normal.comboLeadRate ?? 0, 'Normal 组合首出率（结构引擎底线）').toBeGreaterThanOrEqual(0.5);
    expect(simple.teammateOverrideRate ?? 0, 'Simple 压队友率').toBeLessThanOrEqual(0.2);
    expect(normal.teammateOverrideRate ?? 0, 'Normal 压队友率').toBeLessThanOrEqual(0.2);
  }, 120_000);

  it('胜率差：单席 Normal 对双席 Simple − 反向 ≥ +0.05（分层保持）', async () => {
    const gap = await measureWinRateGap(AiLevel.Normal, AiLevel.Simple, QUALITY_SEEDS);
    console.log('[quality] winRateGap baseline:', JSON.stringify(gap));
    expect(gap.diff).toBeGreaterThanOrEqual(0.05);
  }, 120_000);
});

// 三档排序质量门：困难档与普通档需要维持既定分层。
describe('T-AI-2 三档排序质量门（确定性 seed 回归·W-AI re-baseline）', () => {
  it('Hard 组合首出率 ≥0.70（结构领出底线）；压队友率 ≤0.08', async () => {
    const hardPlay = await measureLevelPlay(AiLevel.Hard, QUALITY_SEEDS);
    console.log('[quality] hard levelPlay:', JSON.stringify({ hard: hardPlay }));
    expect(hardPlay.leadComboOps, '样本量 sanity').toBeGreaterThan(20);
    expect(hardPlay.comboLeadRate ?? 0, 'Hard 组合首出率').toBeGreaterThanOrEqual(0.7);
    expect(hardPlay.teammateOverrideRate ?? 0, 'Hard 压队友率').toBeLessThanOrEqual(0.08);
  }, 180_000);

  it('胜率差：Hard−Normal ≥ +0.05、Hard−Simple ≥ +0.10（对称单席轮换·seeds 1..20）', async () => {
    const gapSeeds = QUALITY_SEEDS.slice(0, 20);
    const hardVsNormal = await measureWinRateGap(AiLevel.Hard, AiLevel.Normal, gapSeeds);
    const hardVsSimple = await measureWinRateGap(AiLevel.Hard, AiLevel.Simple, gapSeeds);
    console.log('[quality] hard gaps:', JSON.stringify({ hardVsNormal, hardVsSimple }));
    // W-AI re-baseline(2026-07-17,BOARD 披露):全体上移压缩对 Simple 的绝对差,0.15→0.10;
    // Hard−Normal 维持 0.05。跌破即强度回归,不许调低门槛消红。
    expect(hardVsNormal.diff, 'Hard−Normal').toBeGreaterThanOrEqual(0.05);
    expect(hardVsSimple.diff, 'Hard−Simple').toBeGreaterThanOrEqual(0.1);
  }, 180_000);
});
