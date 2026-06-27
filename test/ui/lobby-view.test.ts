import { describe, expect, it } from 'vitest';
import { type SaveSlot } from '../../assets/scripts/data/save';
import { emptyStats, type MatchStats } from '../../assets/scripts/data/stats';
import { GamePhase, type RoundState } from '../../assets/scripts/game/types';
import { Rank, Suit } from '../../assets/scripts/rules';
import { deriveLobbyView } from '../../assets/scripts/ui/lobby-view';

function validRound(): RoundState {
  return {
    phase: GamePhase.Playing,
    landlord: 0,
    seats: [
      { index: 0, hand: [{ rank: Rank.R3, suit: Suit.Spade }] },
      { index: 1, hand: [{ rank: Rank.R4, suit: Suit.Heart }] },
      { index: 2, hand: [{ rank: Rank.R5, suit: Suit.Club }] },
    ],
    turn: 0,
    top: null,
    passesInARow: 0,
    winner: null,
    bombsPlayed: 0,
  };
}

function saveSlot(): SaveSlot {
  return {
    version: 1,
    savedAt: 123,
    round: validRound(),
  };
}

describe('M3-23 大厅 VM', () => {
  it('没有存档时显示新对局', () => {
    expect(deriveLobbyView({ savedSlot: null, stats: emptyStats() })).toMatchObject({
      hasSavedGame: false,
      continueLabel: '新对局',
    });
  });

  it('有存档时显示继续对局', () => {
    expect(deriveLobbyView({ savedSlot: saveSlot(), stats: emptyStats() })).toMatchObject({
      hasSavedGame: true,
      continueLabel: '继续对局',
    });
  });

  it('rounds 为 0 时胜率为 0', () => {
    expect(deriveLobbyView({ savedSlot: null, stats: emptyStats() }).summary).toEqual({
      rounds: 0,
      winRatePct: 0,
      netScore: 0,
    });
  });

  it('战绩摘要计算胜率并透传负净分', () => {
    const stats: MatchStats = {
      rounds: 4,
      asLandlord: 2,
      landlordWins: 1,
      asFarmer: 2,
      farmerWins: 2,
      netScore: -18,
    };

    expect(deriveLobbyView({ savedSlot: null, stats }).summary).toEqual({
      rounds: 4,
      winRatePct: 75,
      netScore: -18,
    });
  });

  it('不修改入参', () => {
    const args = {
      savedSlot: saveSlot(),
      stats: {
        rounds: 4,
        asLandlord: 2,
        landlordWins: 1,
        asFarmer: 2,
        farmerWins: 2,
        netScore: -18,
      },
    };
    const before = structuredClone(args);

    deriveLobbyView(args);

    expect(args).toEqual(before);
  });
});
