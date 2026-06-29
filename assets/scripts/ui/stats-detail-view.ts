import type { StatsDigest } from '../data/statsDigest';

export interface StatsDetailRow {
  label: string;
  value: string;
}

export interface StatsDetailView {
  rows: StatsDetailRow[];
  empty: boolean;
}

function streakLabel(streak: number): string {
  if (streak > 0) return `连胜 ${streak}`;
  if (streak < 0) return `连败 ${Math.abs(streak)}`;
  return '无';
}

export function deriveStatsDetailView(digest: StatsDigest): StatsDetailView {
  const rows: StatsDetailRow[] = [
    { label: '总局数', value: String(digest.total) },
    { label: '胜利', value: String(digest.wins) },
    { label: '失败', value: String(digest.losses) },
    { label: '胜率', value: `${digest.winRatePct}%` },
    { label: '当前连胜/连败', value: streakLabel(digest.currentStreak) },
    { label: '最高连胜', value: String(digest.bestWinStreak) },
    { label: '最佳净分', value: String(digest.bestScore) },
    { label: '最差净分', value: String(digest.worstScore) },
    { label: '炸弹数', value: String(digest.totalBombs) },
    { label: '春天数', value: String(digest.springCount) },
    { label: '地主局', value: `${digest.landlordRounds}（胜 ${digest.landlordWins}）` },
    { label: '农民局', value: `${digest.farmerRounds}（胜 ${digest.farmerWins}）` },
  ];

  return { rows, empty: digest.total === 0 };
}
