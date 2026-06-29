import { describe, it, expect } from 'vitest';
import { runSeeds } from './runner';

/** Extended fixed seeds: release regression guard for AI selfplay stability. */
const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1); // 1..50
const TURN_LIMIT = 300;

describe('selfplay AI vs AI long stability regression', () => {
  it(
    'seeds 1..50: every round settles, scores stay zero-sum, and turns terminate',
    async () => {
      const summaries = await runSeeds(SEEDS);
      expect(summaries.map((s) => s.seed)).toEqual(SEEDS);
      for (const summary of summaries) {
        const [left, hero, right] = summary.scores;
        expect(left + hero + right).toBe(0);
        expect(summary.turns).toBeGreaterThan(0);
        expect(summary.turns).toBeLessThan(TURN_LIMIT);
        expect(summary.landlord).toBeGreaterThanOrEqual(0);
        expect(summary.landlord).toBeLessThanOrEqual(2);
        expect(typeof summary.winner).toBe('string');
        expect(summary.winner.length).toBeGreaterThan(0);
      }
    },
    60000,
  );

  it(
    'is reproducible: running the same seeds twice returns identical summaries',
    async () => {
      const first = await runSeeds(SEEDS);
      const second = await runSeeds(SEEDS);
      expect(second).toEqual(first);
    },
    60000,
  );
});
