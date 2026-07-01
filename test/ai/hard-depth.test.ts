import { describe, expect, it } from 'vitest';
import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import { GamePhase, type GameSnapshot, type SeatIndex, type TopPlay } from '../../assets/scripts/game';
import { createRng, Rank, recognize } from '../../assets/scripts/rules';
import { runDifficultyMatchup, type MatchSummary } from '../selfplay/difficulty';
import { cards } from '../rules/_util';

const hard = strategyFor(AiLevel.Hard);
const normal = strategyFor(AiLevel.Normal);

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [7, 7, 7],
    winner: null,
    viewerHand: cards('3 4 5 6 7 9 K'),
    ...over,
  };
}

function topPlay(seat: SeatIndex, spec: string): TopPlay {
  return { seat, pattern: recognize(cards(spec))! };
}

function playedRanks(action: ReturnType<typeof hard>): Rank[] {
  if (action.type !== 'play') return [];
  return action.cards.map((card) => card.rank);
}

function averageScore(summaries: readonly MatchSummary[], seat: SeatIndex): number {
  return summaries.reduce((sum, summary) => sum + summary.scores[seat], 0) / summaries.length;
}

function winRate(summaries: readonly MatchSummary[], seat: SeatIndex): number {
  return summaries.filter((summary) => summary.scores[seat] > 0).length / summaries.length;
}

function assertSelfplayInvariant(summary: MatchSummary): void {
  expect(summary.scores[0] + summary.scores[1] + summary.scores[2]).toBe(0);
  expect(summary.turns).toBeGreaterThan(0);
  expect(summary.turns).toBeLessThan(300);
}

describe('M4-42 hard AI 纵深启发式', () => {
  it('非压迫领牌会优先打出成型顺子，而不是退化为 Normal 的最小单牌', () => {
    const s = snap({ viewerHand: cards('3 4 5 6 7 9 K'), handCounts: [7, 7, 7] });

    const hardAction = hard(s, createRng(1));
    expect(playedRanks(hardAction)).toEqual([Rank.R3, Rank.R4, Rank.R5, Rank.R6, Rank.R7]);

    const normalAction = normal(s, createRng(1));
    expect(playedRanks(normalAction)).toEqual([Rank.R3]);
  });

  it('可一手走完时直接走完整手牌', () => {
    const action = hard(
      snap({ viewerHand: cards('3 4 5 6 7'), handCounts: [5, 7, 7] }),
      createRng(2),
    );

    expect(playedRanks(action)).toEqual([Rank.R3, Rank.R4, Rank.R5, Rank.R6, Rank.R7]);
  });

  it('农民非终结态不抢队友牌权', () => {
    const s = snap({
      turn: 2,
      landlord: 0,
      top: topPlay(1, '5'),
      viewerHand: cards('6 K'),
      handCounts: [8, 8, 2],
    });

    expect(hard(s, createRng(3))).toEqual({ type: 'pass', seat: 2 });

    const normalAction = normal(s, createRng(3));
    expect(playedRanks(normalAction)).toEqual([Rank.R6]);
  });

  it(
    '固定种子 selfplay：Hard 地主相对 Normal 基线有胜率与均分优势',
    async () => {
      const seeds = Array.from({ length: 12 }, (_, index) => index + 1);
      const hardLandlord = await runDifficultyMatchup([AiLevel.Hard, AiLevel.Normal, AiLevel.Normal], seeds);
      const normalBaseline = await runDifficultyMatchup([AiLevel.Normal, AiLevel.Normal, AiLevel.Normal], seeds);

      for (const summary of hardLandlord.concat(normalBaseline)) {
        assertSelfplayInvariant(summary);
        expect(summary.landlord).toBe(0);
      }

      expect(winRate(hardLandlord, 0)).toBeGreaterThanOrEqual(winRate(normalBaseline, 0));
      expect(averageScore(hardLandlord, 0)).toBeGreaterThan(averageScore(normalBaseline, 0));
    },
    60000,
  );
});
