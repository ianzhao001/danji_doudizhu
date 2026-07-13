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
    '固定种子 selfplay：不变量保持（三档胜率排序契约已迁移至 T-AI-2 质量门）',
    async () => {
      const seeds = Array.from({ length: 12 }, (_, index) => index + 1);
      const hardLandlord = await runDifficultyMatchup([AiLevel.Hard, AiLevel.Normal, AiLevel.Normal], seeds);
      const normalBaseline = await runDifficultyMatchup([AiLevel.Normal, AiLevel.Normal, AiLevel.Normal], seeds);

      for (const summary of hardLandlord.concat(normalBaseline)) {
        assertSelfplayInvariant(summary);
        expect(summary.landlord).toBe(0);
      }

      // 困难档相对普通档的胜率约束以单独质量门为准（test/selfplay/quality.test.ts T-AI-2）。
      // 历史注记：T-AI-1 强化普通档后曾出现 12-seed 代理反转（Hard 0.5 vs Normal 0.667），
      // 登记为过渡态。W-AUDIT-AI（2026-07-13）拆解内核+结构化叫分落地后过渡态关闭：
      // T-AI-2 实测 Hard−Normal=+0.117、Hard−Simple=+0.567，门槛已收紧至 ≥+0.05/≥+0.15。
      // 本用例只保留 selfplay 不变量。
    },
    60000,
  );
});
