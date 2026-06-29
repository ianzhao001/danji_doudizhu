import { Side, type Spring } from '../game';
import type { RecordEntry, RecordsState } from './records';

export type RecordOutcome = 'all' | 'win' | 'loss';
export type RecordRole = 'all' | 'landlord' | 'farmer';

export interface RecordQuery {
  outcome?: RecordOutcome;
  role?: RecordRole;
  spring?: 'all' | Spring;
  order?: 'newest' | 'oldest';
  limit?: number;
}

function heroWon(entry: RecordEntry): boolean {
  const heroIsLandlord = entry.heroSeat === entry.landlord;
  return (
    (heroIsLandlord && entry.winner === Side.Landlord) ||
    (!heroIsLandlord && entry.winner === Side.Farmer)
  );
}

function matchesOutcome(entry: RecordEntry, outcome: RecordOutcome): boolean {
  if (outcome === 'all') return true;
  const won = heroWon(entry);
  return outcome === 'win' ? won : !won;
}

function matchesRole(entry: RecordEntry, role: RecordRole): boolean {
  if (role === 'all') return true;
  const heroIsLandlord = entry.heroSeat === entry.landlord;
  return role === 'landlord' ? heroIsLandlord : !heroIsLandlord;
}

export function queryRecords(records: RecordsState, q: RecordQuery = {}): RecordEntry[] {
  const outcome = q.outcome ?? 'all';
  const role = q.role ?? 'all';
  const spring = q.spring ?? 'all';
  const order = q.order ?? 'newest';

  if (q.limit !== undefined && q.limit <= 0) return [];

  const rows = records.entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => matchesOutcome(entry, outcome))
    .filter(({ entry }) => matchesRole(entry, role))
    .filter(({ entry }) => spring === 'all' || entry.spring === spring)
    .sort((a, b) => {
      const timeDiff = order === 'newest' ? b.entry.playedAt - a.entry.playedAt : a.entry.playedAt - b.entry.playedAt;
      return timeDiff === 0 ? a.index - b.index : timeDiff;
    })
    .map(({ entry }) => entry);

  return q.limit === undefined ? rows : rows.slice(0, q.limit);
}
