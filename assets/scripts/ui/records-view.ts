import type { RecordEntry, RecordsState } from '../data/records';

export interface RecordRowView {
  outcomeText: string;
  heroScore: number;
  scoreLabel: string;
  roleText: string;
  multiplierText: string;
  bombs: number;
  springText: string;
  playedAt: number;
}

function scoreLabel(score: number): string {
  if (score > 0) return `+${score}`;
  return String(score);
}

function outcomeText(score: number): string {
  if (score > 0) return '胜';
  if (score < 0) return '败';
  return '平';
}

function springText(entry: RecordEntry): string {
  switch (entry.spring) {
    case 'spring':
      return '春天';
    case 'anti-spring':
      return '反春天';
    case 'none':
      return '';
    default:
      return '';
  }
}

function rowView(entry: RecordEntry): RecordRowView {
  return {
    outcomeText: outcomeText(entry.heroScore),
    heroScore: entry.heroScore,
    scoreLabel: scoreLabel(entry.heroScore),
    roleText: entry.heroSeat === entry.landlord ? '地主' : '农民',
    multiplierText: `×${entry.multiplier}`,
    bombs: entry.bombs,
    springText: springText(entry),
    playedAt: entry.playedAt,
  };
}

export function deriveRecordsView(records: RecordsState, limit?: number): RecordRowView[] {
  if (limit !== undefined && limit <= 0) return [];
  const rows = records.entries.slice().reverse().map(rowView);
  return limit === undefined ? rows : rows.slice(0, limit);
}
