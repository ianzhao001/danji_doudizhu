/**
 * W-AI-R2 种子：被压概率 P̂beat 定点契约（规划者预写红种子 · 2026-07-17 · sota2 · 吸收①）。
 *
 * 落位：Codex 逐字节复制到 test/ai/pressure.test.ts（新建），独立 seed commit（R2a 棒）。
 * 实现目标：assets/scripts/ai/pressure.ts ——
 *   `beatProbability1024(move: { category; mainRank; length }, remainingByRank: readonly number[],
 *     hiddenCounts: readonly [number, number]): number`
 *   1/1024 定点整数（0..1024）。单/对/三族=逐 rank 超几何闭式（该席拿到 <size 张的概率）
 *   两席乘积取补，rank 间独立近似（偏高有界，披露）；顺/连对/飞机族=isUnbeatableMove 同口径
 *   union 存在性 × 集中度衰减表 γ_L（预计算整数）；炸弹/火箭威胁（4 张同点或双王均未现身）
 *   抬底 ≥512。纯函数、零浮点结果暴露（内部整数运算）、零时基零随机。
 *
 * ── 预期红（实现前）── 模块不存在 → 全文件红（6 用例）。
 * ── 负向变异自证（执行者实现后自查）──
 *   ① 主点单调破坏（更高 rank 概率反升）→ 单调用例红。
 *   ② 炸弹威胁抬底删除 → 威胁地板用例红。
 *   ③ 定点改浮点直除（结果非整数）→ 值域用例红。
 */
import { describe, expect, it } from 'vitest';
import { Category, Rank } from '../../assets/scripts/rules';
import { beatProbability1024 } from '../../assets/scripts/ai/pressure';
import { toRankCounts } from '../../assets/scripts/ai/rollout';
import { cards } from '../rules/_util';

const single = (rank: number) => ({ category: Category.Single, mainRank: rank, length: 1 });
const pair = (rank: number) => ({ category: Category.Pair, mainRank: rank, length: 1 });

describe('W-AI-R2 pressure 被压概率（1/1024 定点）', () => {
  it('值域与整数性：0 ≤ P̂ ≤ 1024 且为整数（全夹具扫描）', () => {
    const remaining = toRankCounts(cards('8 9 10 J Q K A 2 2 x'));
    for (const rank of [Rank.R3, Rank.R7, Rank.J, Rank.A, Rank.R2]) {
      const p = beatProbability1024(single(rank), remaining, [5, 5]);
      expect(Number.isInteger(p)).toBe(true);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1024);
    }
  });

  it('主点单调：同族同尺下 rank 越高被压概率不增', () => {
    const remaining = toRankCounts(cards('8 9 10 J Q K A'));
    let prev = 1025;
    for (const rank of [Rank.R3, Rank.R7, Rank.R10, Rank.Q, Rank.A]) {
      const p = beatProbability1024(single(rank), remaining, [4, 3]);
      expect(p, `rank ${rank} 单调不增`).toBeLessThanOrEqual(prev);
      prev = p;
    }
  });

  it('无更高剩牌且无炸弹威胁 → 恒 0（绝对顶张）', () => {
    const remaining = toRankCounts(cards('3 4 5 6 7 8'));
    expect(beatProbability1024(single(Rank.R9), remaining, [3, 3])).toBe(0);
    expect(beatProbability1024(single(Rank.R2), remaining, [3, 3])).toBe(0);
  });

  it('对族尺寸语义：更高点仅剩 1 张时压不了对（无炸威胁下 P̂=0）', () => {
    const remaining = toRankCounts(cards('3 4 5 A'));
    expect(beatProbability1024(pair(Rank.K), remaining, [2, 2])).toBe(0);
    // 同池对单张 K 则非零（A 在外且可能落在任一隐藏席）。
    expect(beatProbability1024(single(Rank.K), remaining, [2, 2])).toBeGreaterThan(0);
  });

  it('炸弹/火箭威胁抬底：未现身四张同点或双王 → P̂ ≥ 512（任何族）', () => {
    const bombOut = toRankCounts(cards('5 5 5 5 3 4'));
    expect(beatProbability1024(single(Rank.R2), bombOut, [3, 3])).toBeGreaterThanOrEqual(512);
    const rocketOut = toRankCounts(cards('x X 3 4'));
    expect(beatProbability1024(pair(Rank.A), rocketOut, [2, 2])).toBeGreaterThanOrEqual(512);
  });

  it('剩量清零反应 + 确定性：清掉唯一更高点后概率降为 0；同入参深相等且不改入参', () => {
    const withAce = toRankCounts(cards('A 3 4'));
    const withoutAce = toRankCounts(cards('3 4'));
    const before = withAce.join(',');
    const pWith = beatProbability1024(single(Rank.K), withAce, [2, 1]);
    const pWithout = beatProbability1024(single(Rank.K), withoutAce, [2, 1]);
    expect(pWith).toBeGreaterThan(0);
    expect(pWithout).toBe(0);
    expect(withAce.join(',')).toBe(before);
    expect(beatProbability1024(single(Rank.K), withAce, [2, 1])).toBe(pWith);
  });
});
