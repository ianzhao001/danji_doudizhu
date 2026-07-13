import { describe, expect, it, vi } from 'vitest';

import { commitFinishedRound, persistRound, type SessionKeys } from '../../assets/scripts/data/session';
import { deserializeStats } from '../../assets/scripts/data/statsCodec';
import { migrateRecords } from '../../assets/scripts/data/records';
import { GamePhase, Side, type RoundFinishInput, type RoundState } from '../../assets/scripts/game';
import { Rank, Suit } from '../../assets/scripts/rules';

class MemoryStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.has(key) ? this.values.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

class FailingSetStorage extends MemoryStorage {
  setCalls = 0;

  constructor(private readonly failOnSetCall: number) {
    super();
  }

  override setItem(key: string, value: string): void {
    this.setCalls += 1;
    if (this.setCalls === this.failOnSetCall) throw new Error('injected setItem failure');
    super.setItem(key, value);
  }
}

const keys: SessionKeys = { save: 'save', stats: 'stats', records: 'records' };

function round(): RoundState {
  return {
    phase: GamePhase.Playing,
    landlord: 1,
    seats: [
      { index: 0, hand: [{ rank: Rank.R3, suit: Suit.Spade }] },
      { index: 1, hand: [{ rank: Rank.R4, suit: Suit.Heart }] },
      { index: 2, hand: [{ rank: Rank.R5, suit: Suit.Club }] },
    ],
    turn: 1,
    top: null,
    passesInARow: 0,
    winner: null,
    bombsPlayed: 0,
    bottom: null,
  };
}

function finish(): RoundFinishInput {
  return {
    landlord: 1,
    winner: Side.Landlord,
    settlement: { multiplier: 2, spring: 'none', bombs: 0, scores: [-2, 4, -2] },
  };
}

describe('session commit atomicity hardening', () => {
  it('can retry after the second setItem fails without double-counting stats', () => {
    const storage = new FailingSetStorage(2);
    persistRound(storage, keys, { round: round(), heroSeat: 1, bidMultiplier: 2, events: [] });

    expect(() => commitFinishedRound(storage, keys, { finish: finish(), heroSeat: 1, playedAt: 500 })).toThrow(
      /injected setItem failure/,
    );

    const committed = commitFinishedRound(storage, keys, { finish: finish(), heroSeat: 1, playedAt: 500 });

    expect(committed.stats.rounds).toBe(1);
    expect(committed.stats.netScore).toBe(4);
    expect(committed.records.entries).toHaveLength(1);
    expect(deserializeStats(storage.getItem(keys.stats)!).rounds).toBe(1);
    expect(migrateRecords(JSON.parse(storage.getItem(keys.records)!)).entries).toHaveLength(1);
  });

  it('warns and falls back only when an existing records slot is corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem(keys.records, '{not-json');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    try {
      const committed = commitFinishedRound(storage, keys, { finish: finish(), heroSeat: 1, playedAt: 500 });

      expect(committed.records.entries).toHaveLength(1);
      expect(warn).toHaveBeenCalledWith('corrupted records data for key "records"');
    } finally {
      warn.mockRestore();
    }
  });
});
