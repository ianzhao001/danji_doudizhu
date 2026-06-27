import { describe, expect, it } from 'vitest';

import { MAX_RECORDS, migrateRecords, type RecordEntry } from '../../assets/scripts/data/records';
import { Side } from '../../assets/scripts/game';

function migratedEntry(raw: Record<string, unknown>): RecordEntry {
  const migrated = migrateRecords({ entries: [raw] });
  expect(migrated.entries).toHaveLength(1);
  return migrated.entries[0];
}

describe('records migration hardening', () => {
  it('defaults missing fields', () => {
    expect(migratedEntry({})).toEqual({
      heroSeat: 0,
      landlord: 0,
      winner: Side.Farmer,
      multiplier: 1,
      bombs: 0,
      spring: 'none',
      heroScore: 0,
      playedAt: 0,
    });
  });

  it('normalizes multiplier to a positive integer', () => {
    expect(migratedEntry({ multiplier: -5 }).multiplier).toBe(1);
    expect(migratedEntry({ multiplier: 0 }).multiplier).toBe(1);
    expect(migratedEntry({ multiplier: 1.5 }).multiplier).toBe(1);
    expect(migratedEntry({ multiplier: 3 }).multiplier).toBe(3);
  });

  it('normalizes bombs and playedAt to non-negative integers', () => {
    expect(migratedEntry({ bombs: -1 }).bombs).toBe(0);
    expect(migratedEntry({ bombs: 2.5 }).bombs).toBe(0);
    expect(migratedEntry({ bombs: 2 }).bombs).toBe(2);
    expect(migratedEntry({ playedAt: -1 }).playedAt).toBe(0);
    expect(migratedEntry({ playedAt: 1.5 }).playedAt).toBe(0);
    expect(migratedEntry({ playedAt: 10 }).playedAt).toBe(10);
  });

  it('preserves negative integer heroScore but rejects fractional values', () => {
    expect(migratedEntry({ heroScore: -10 }).heroScore).toBe(-10);
    expect(migratedEntry({ heroScore: 1.5 }).heroScore).toBe(0);
  });

  it('normalizes side and spring enum fields', () => {
    expect(migratedEntry({ winner: 'x', spring: 'x' }).winner).toBe(Side.Farmer);
    expect(migratedEntry({ winner: 'x', spring: 'x' }).spring).toBe('none');
    expect(migratedEntry({ winner: Side.Landlord, spring: 'spring' }).winner).toBe(Side.Landlord);
    expect(migratedEntry({ winner: Side.Landlord, spring: 'spring' }).spring).toBe('spring');
  });

  it('is idempotent for legal records', () => {
    const raw = {
      version: 1,
      entries: [
        {
          heroSeat: 1,
          landlord: 2,
          winner: Side.Landlord,
          multiplier: 4,
          bombs: 2,
          spring: 'anti-spring',
          heroScore: -24,
          playedAt: 100,
        },
      ],
    };

    expect(migrateRecords(migrateRecords(raw))).toEqual(migrateRecords(raw));
  });

  it('keeps the last MAX_RECORDS entries in original order', () => {
    const entries = Array.from({ length: MAX_RECORDS + 3 }, (_, playedAt) => ({ playedAt }));
    const migrated = migrateRecords({ entries });

    expect(migrated.entries).toHaveLength(MAX_RECORDS);
    expect(migrated.entries[0].playedAt).toBe(3);
    expect(migrated.entries[MAX_RECORDS - 1].playedAt).toBe(MAX_RECORDS + 2);
  });
});
