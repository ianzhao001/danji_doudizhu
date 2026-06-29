import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import { runDifficultyMatchup, type MatchSummary } from './difficulty';

const SEEDS = [1, 2, 5, 8, 13, 21];
const TURN_LIMIT = 300;

const LEVEL_COMBOS: ReadonlyArray<[AiLevel, AiLevel, AiLevel]> = [
  [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard],
  [AiLevel.Simple, AiLevel.Hard, AiLevel.Normal],
  [AiLevel.Normal, AiLevel.Simple, AiLevel.Hard],
  [AiLevel.Normal, AiLevel.Hard, AiLevel.Simple],
  [AiLevel.Hard, AiLevel.Simple, AiLevel.Normal],
  [AiLevel.Hard, AiLevel.Normal, AiLevel.Simple],
  [AiLevel.Simple, AiLevel.Simple, AiLevel.Simple],
  [AiLevel.Normal, AiLevel.Normal, AiLevel.Normal],
  [AiLevel.Hard, AiLevel.Hard, AiLevel.Hard],
];

function assertNoStarveSummary(summary: MatchSummary): void {
  expect(summary.seed).toBeGreaterThan(0);
  expect(summary.landlord).toBeGreaterThanOrEqual(0);
  expect(summary.landlord).toBeLessThanOrEqual(2);
  expect(['landlord', 'farmer']).toContain(summary.winner);
  expect(summary.turns).toBeGreaterThan(0);
  expect(summary.turns).toBeLessThan(TURN_LIMIT);
  expect(summary.scores[0] + summary.scores[1] + summary.scores[2]).toBe(0);
}

describe('AI no-starve difficulty matrix', () => {
  it(
    'settles deterministically across mixed and homogeneous level combinations',
    async () => {
      for (const levels of LEVEL_COMBOS) {
        const first = await runDifficultyMatchup(levels, SEEDS);
        const second = await runDifficultyMatchup(levels, SEEDS);

        expect(first).toHaveLength(SEEDS.length);
        expect(first.map((summary) => summary.seed)).toEqual(SEEDS);
        expect(second).toEqual(first);
        for (const summary of first) assertNoStarveSummary(summary);
      }
    },
    60_000,
  );
});
