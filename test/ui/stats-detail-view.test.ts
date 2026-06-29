import { describe, expect, it } from 'vitest';
import { deriveStatsDetailView } from '../../assets/scripts/ui/stats-detail-view';
import type { StatsDigest } from '../../assets/scripts/data/statsDigest';

function digest(overrides: Partial<StatsDigest> = {}): StatsDigest {
  return {
    total: 0,
    wins: 0,
    losses: 0,
    winRatePct: 0,
    currentStreak: 0,
    bestWinStreak: 0,
    bestScore: 0,
    worstScore: 0,
    totalBombs: 0,
    springCount: 0,
    landlordRounds: 0,
    landlordWins: 0,
    farmerRounds: 0,
    farmerWins: 0,
    ...overrides,
  };
}

describe('deriveStatsDetailView', () => {
  it('marks empty digest and keeps stable labels', () => {
    const view = deriveStatsDetailView(digest());

    expect(view.empty).toBe(true);
    expect(view.rows.map((row) => row.label)).toEqual([
      '总局数',
      '胜利',
      '失败',
      '胜率',
      '当前连胜/连败',
      '最高连胜',
      '最佳净分',
      '最差净分',
      '炸弹数',
      '春天数',
      '地主局',
      '农民局',
    ]);
    expect(view.rows[0].value).toBe('0');
  });

  it('formats a typical digest without recalculating it', () => {
    const view = deriveStatsDetailView(
      digest({
        total: 8,
        wins: 5,
        losses: 3,
        winRatePct: 63,
        currentStreak: -2,
        bestWinStreak: 4,
        bestScore: 24,
        worstScore: -12,
        totalBombs: 7,
        springCount: 2,
        landlordRounds: 3,
        landlordWins: 2,
        farmerRounds: 5,
        farmerWins: 3,
      }),
    );

    expect(view.empty).toBe(false);
    expect(view.rows).toContainEqual({ label: '胜率', value: '63%' });
    expect(view.rows).toContainEqual({ label: '当前连胜/连败', value: '连败 2' });
    expect(view.rows).toContainEqual({ label: '最佳净分', value: '24' });
    expect(view.rows).toContainEqual({ label: '最差净分', value: '-12' });
    expect(view.rows).toContainEqual({ label: '地主局', value: '3（胜 2）' });
    expect(view.rows).toContainEqual({ label: '农民局', value: '5（胜 3）' });
  });

  it('formats positive and neutral streaks', () => {
    expect(deriveStatsDetailView(digest({ currentStreak: 3 })).rows[4].value).toBe('连胜 3');
    expect(deriveStatsDetailView(digest({ currentStreak: 0 })).rows[4].value).toBe('无');
  });
});
