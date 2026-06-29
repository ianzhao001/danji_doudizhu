import { describe, it, expect } from 'vitest';
import { Side, type SeatIndex, type Spring } from '../../assets/scripts/game';
import { queryRecords } from '../../assets/scripts/data/recordsQuery';
import { emptyRecords, type RecordEntry, type RecordsState } from '../../assets/scripts/data/records';

function record(args: {
  heroSeat?: SeatIndex;
  landlord?: SeatIndex;
  winner: Side;
  playedAt: number;
  spring?: Spring;
  heroScore?: number;
}): RecordEntry {
  return {
    heroSeat: args.heroSeat ?? 0,
    landlord: args.landlord ?? 0,
    winner: args.winner,
    multiplier: 1,
    bombs: 0,
    spring: args.spring ?? 'none',
    heroScore: args.heroScore ?? 0,
    playedAt: args.playedAt,
  };
}

const entries = [
  record({ winner: Side.Landlord, playedAt: 10, heroScore: 2 }),
  record({ winner: Side.Farmer, playedAt: 30, heroScore: -1 }),
  record({ landlord: 1, winner: Side.Farmer, playedAt: 20, spring: 'spring', heroScore: 1 }),
  record({ landlord: 1, winner: Side.Landlord, playedAt: 20, spring: 'anti-spring', heroScore: -3 }),
];
const state: RecordsState = { version: 1, entries };

describe('M6-L8 queryRecords', () => {
  it('returns all records newest-first by default without mutating input', () => {
    const before = state.entries.slice();
    expect(queryRecords(state).map((row) => row.playedAt)).toEqual([30, 20, 20, 10]);
    expect(state.entries).toEqual(before);
  });

  it('filters wins and losses using hero role口径', () => {
    expect(queryRecords(state, { outcome: 'win' }).map((row) => row.heroScore)).toEqual([1, 2]);
    expect(queryRecords(state, { outcome: 'loss' }).map((row) => row.heroScore)).toEqual([-1, -3]);
  });

  it('filters landlord and farmer rounds', () => {
    expect(queryRecords(state, { role: 'landlord' }).map((row) => row.playedAt)).toEqual([30, 10]);
    expect(queryRecords(state, { role: 'farmer' }).map((row) => row.spring)).toEqual(['spring', 'anti-spring']);
  });

  it('filters spring kind and preserves stable order for equal playedAt', () => {
    expect(queryRecords(state, { spring: 'spring' }).map((row) => row.heroScore)).toEqual([1]);
    expect(queryRecords(state, { order: 'oldest' }).map((row) => row.playedAt)).toEqual([10, 20, 20, 30]);
    expect(queryRecords(state, { order: 'oldest' }).slice(1, 3).map((row) => row.spring)).toEqual(['spring', 'anti-spring']);
  });

  it('applies limit including zero, negative, and overlong values', () => {
    expect(queryRecords(state, { limit: 2 }).map((row) => row.playedAt)).toEqual([30, 20]);
    expect(queryRecords(state, { limit: 0 })).toEqual([]);
    expect(queryRecords(state, { limit: -1 })).toEqual([]);
    expect(queryRecords(state, { limit: 99 }).length).toBe(entries.length);
  });

  it('handles empty records', () => {
    expect(queryRecords(emptyRecords())).toEqual([]);
  });
});
