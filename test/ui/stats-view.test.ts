import { describe, expect, it } from 'vitest';
import { emptyStats, type MatchStats } from '../../assets/scripts/data/stats';
import { deriveStatsView } from '../../assets/scripts/ui/stats-view';

describe('M3-20 战绩展示 VM', () => {
  it('emptyStats 映射为空战绩展示', () => {
    expect(deriveStatsView(emptyStats())).toEqual({
      rounds: 0,
      wins: 0,
      losses: 0,
      winRatePct: 0,
      asLandlord: 0,
      landlordWins: 0,
      asFarmer: 0,
      farmerWins: 0,
      netScore: 0,
      netScoreLabel: '0',
    });
  });

  it('计算胜负数、75% 胜率和正净分标签', () => {
    const stats: MatchStats = {
      rounds: 4,
      asLandlord: 2,
      landlordWins: 1,
      asFarmer: 2,
      farmerWins: 2,
      netScore: 12,
    };

    expect(deriveStatsView(stats)).toMatchObject({
      rounds: 4,
      wins: 3,
      losses: 1,
      winRatePct: 75,
      netScore: 12,
      netScoreLabel: '+12',
    });
  });

  it('负净分标签保留负号，胜率按四舍五入为整数', () => {
    const stats: MatchStats = {
      rounds: 3,
      asLandlord: 1,
      landlordWins: 0,
      asFarmer: 2,
      farmerWins: 1,
      netScore: -8,
    };

    expect(deriveStatsView(stats)).toMatchObject({
      wins: 1,
      losses: 2,
      winRatePct: 33,
      netScoreLabel: '-8',
    });
  });

  it('不修改入参', () => {
    const stats: MatchStats = {
      rounds: 4,
      asLandlord: 2,
      landlordWins: 1,
      asFarmer: 2,
      farmerWins: 2,
      netScore: 12,
    };
    const before = structuredClone(stats);

    deriveStatsView(stats);

    expect(stats).toEqual(before);
  });
});
