import { Side, type Spring } from '../game';
import type { RecordEntry, RecordsState } from '../data/records';
import { queryRecords, type RecordQuery } from '../data/recordsQuery';

export interface RecordDetailRow {
  outcomeLabel: string;
  roleLabel: string;
  scoreLabel: string;
  multiplierLabel: string;
  tags: string[];
}

export interface RecordsDetailView {
  rows: RecordDetailRow[];
  filterLabel: string;
  empty: boolean;
}

function heroWon(entry: RecordEntry): boolean {
  const heroIsLandlord = entry.heroSeat === entry.landlord;
  return (
    (heroIsLandlord && entry.winner === Side.Landlord) ||
    (!heroIsLandlord && entry.winner === Side.Farmer)
  );
}

function roleLabel(entry: RecordEntry): string {
  return entry.heroSeat === entry.landlord ? '地主' : '农民';
}

function scoreLabel(score: number): string {
  if (score > 0) return `+${score}`;
  return String(score);
}

function springTag(spring: Spring): string | null {
  if (spring === 'spring') return '春天';
  if (spring === 'anti-spring') return '反春天';
  return null;
}

function rowFor(entry: RecordEntry): RecordDetailRow {
  const tags = [springTag(entry.spring), entry.bombs > 0 ? `炸弹×${entry.bombs}` : null].filter(
    (tag): tag is string => tag !== null,
  );

  return {
    outcomeLabel: heroWon(entry) ? '胜' : '败',
    roleLabel: roleLabel(entry),
    scoreLabel: scoreLabel(entry.heroScore),
    multiplierLabel: `×${entry.multiplier}`,
    tags,
  };
}

function filterLabel(q: RecordQuery = {}): string {
  const outcome = q.outcome ?? 'all';
  const role = q.role ?? 'all';
  const spring = q.spring ?? 'all';
  const order = q.order ?? 'newest';
  const parts = [
    outcome === 'win' ? '胜局' : outcome === 'loss' ? '败局' : '全部',
    role === 'landlord' ? '地主' : role === 'farmer' ? '农民' : null,
    spring === 'spring' ? '春天' : spring === 'anti-spring' ? '反春天' : null,
    order === 'oldest' ? '最早' : '最新',
  ].filter((part): part is string => part !== null);
  return parts.join('·');
}

export function deriveRecordsDetailView(records: RecordsState, q?: RecordQuery): RecordsDetailView {
  const rows = queryRecords(records, q).map(rowFor);
  return {
    rows,
    filterLabel: filterLabel(q),
    empty: rows.length === 0,
  };
}
