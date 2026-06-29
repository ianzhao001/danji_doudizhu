import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import { runDifficultyMatchup, type MatchSummary } from './difficulty';

const SEEDS = Array.from({ length: 8 }, (_, i) => i + 1);
const TOLERANCE = 0.05;

interface SeatResult {
  seat: 0 | 1 | 2;
  score: number;
  won: boolean;
}

function seatWon(summary: MatchSummary, seat: 0 | 1 | 2): boolean {
  return summary.scores[seat] > 0;
}

async function runRotations(target: AiLevel, opponents: AiLevel): Promise<SeatResult[]> {
  const results: SeatResult[] = [];
  const seats = [0, 1, 2] as const;

  for (const seat of seats) {
    const levels: [AiLevel, AiLevel, AiLevel] = [opponents, opponents, opponents];
    levels[seat] = target;
    const summaries = await runDifficultyMatchup(levels, SEEDS);
    for (const summary of summaries) {
      expect(summary.scores[0] + summary.scores[1] + summary.scores[2]).toBe(0);
      expect(summary.turns).toBeGreaterThan(0);
      expect(summary.turns).toBeLessThan(300);
      results.push({ seat, score: summary.scores[seat], won: seatWon(summary, seat) });
    }
  }

  return results;
}

function winRate(results: SeatResult[]): number {
  return results.filter((result) => result.won).length / results.length;
}

function averageScore(results: SeatResult[]): number {
  return results.reduce((sum, result) => sum + result.score, 0) / results.length;
}

describe('M6-G15 difficulty balance guard', () => {
  it(
    'hard is not weaker than simple under rotated seat matchups',
    async () => {
      const hardSolo = await runRotations(AiLevel.Hard, AiLevel.Simple);
      const simpleSolo = await runRotations(AiLevel.Simple, AiLevel.Hard);

      expect(winRate(hardSolo)).toBeGreaterThanOrEqual(winRate(simpleSolo) - TOLERANCE);
      expect(averageScore(hardSolo)).toBeGreaterThanOrEqual(averageScore(simpleSolo) - 1);
    },
    60000,
  );

  it(
    'normal is not clearly below simple in rotated matchups',
    async () => {
      const normalSolo = await runRotations(AiLevel.Normal, AiLevel.Simple);
      const simpleSolo = await runRotations(AiLevel.Simple, AiLevel.Normal);

      expect(winRate(normalSolo)).toBeGreaterThanOrEqual(winRate(simpleSolo) - TOLERANCE);
    },
    60000,
  );
});
