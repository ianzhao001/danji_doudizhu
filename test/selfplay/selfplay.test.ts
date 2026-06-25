import { describe, it, expect } from 'vitest';
import { runSeeds } from './runner';

/** 固定 seeds：作为引擎稳定性的回归护栏，与 AI 强弱无关。 */
const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1); // 1..30
const TURN_LIMIT = 300;

describe('selfplay AI vs AI 稳定性（回归护栏）', () => {
  it('seeds 1..30：每局到达 settled、scores 守恒、必终止', async () => {
    const summaries = await runSeeds(SEEDS);
    expect(summaries.map((s) => s.seed)).toEqual(SEEDS);
    for (const s of summaries) {
      const [a, b, c] = s.scores;
      expect(a + b + c).toBe(0); // 零和守恒
      expect(s.turns).toBeGreaterThan(0);
      expect(s.turns).toBeLessThan(TURN_LIMIT); // 必终止、无死循环
      expect(s.landlord).toBeGreaterThanOrEqual(0);
      expect(s.landlord).toBeLessThanOrEqual(2);
      expect(typeof s.winner).toBe('string');
      expect(s.winner.length).toBeGreaterThan(0);
    }
  });

  it('可复现：同一组 seeds 跑两次，SeedSummary[] 深相等', async () => {
    const first = await runSeeds(SEEDS);
    const second = await runSeeds(SEEDS);
    expect(second).toEqual(first);
  });
});
