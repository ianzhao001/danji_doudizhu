import { describe, expect, it } from 'vitest';

import {
  commitFinishedRound,
  persistRound,
  restoreRound,
  type SessionKeys,
} from '../../assets/scripts/data/session';
import { serializeStats } from '../../assets/scripts/data/statsCodec';
import { emptyStats } from '../../assets/scripts/data/stats';
import { GamePhase, Side, type GameEvent, type RoundState, type Settlement } from '../../assets/scripts/game';
import type { FlowResult } from '../../assets/scripts/flow';
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
  };
}

function settlement(overrides: Partial<Settlement> = {}): Settlement {
  return { multiplier: 2, spring: 'none', bombs: 0, scores: [-2, 4, -2], ...overrides };
}

function flowResult(overrides: Partial<FlowResult> = {}): FlowResult {
  return {
    landlord: 1,
    winner: Side.Landlord,
    settlement: settlement(),
    events: [],
    turns: 1,
    redeals: 0,
    finalState: { ...round(), phase: GamePhase.Settled, winner: Side.Landlord },
    ...overrides,
  };
}

describe('session persistence orchestration', () => {
  it('persists and restores an in-progress round', () => {
    const storage = new MemoryStorage();
    const events: GameEvent[] = [{ type: 'pass', seat: 0 }];
    const state = round();

    persistRound(storage, keys, { round: state, heroSeat: 0, bidMultiplier: 4, events, savedAt: 123 });

    expect(restoreRound(storage, keys)).toEqual({
      state,
      heroSeat: 0,
      bidMultiplier: 4,
      events,
    });
  });

  it('returns null when no save slot exists', () => {
    expect(restoreRound(new MemoryStorage(), keys)).toBeNull();
  });

  it('commits a finished round, writes stats and records, and clears save slot', () => {
    const storage = new MemoryStorage();
    persistRound(storage, keys, { round: round(), heroSeat: 1, bidMultiplier: 2, events: [] });

    const committed = commitFinishedRound(storage, keys, { result: flowResult(), heroSeat: 1, playedAt: 500 });

    expect(committed.stats).toMatchObject({ rounds: 1, asLandlord: 1, landlordWins: 1, netScore: 4 });
    expect(committed.records.entries).toHaveLength(1);
    expect(committed.records.entries[0]).toMatchObject({ heroSeat: 1, heroScore: 4, playedAt: 500 });
    expect(restoreRound(storage, keys)).toBeNull();
    expect(storage.getItem(keys.stats)).not.toBeNull();
    expect(storage.getItem(keys.records)).not.toBeNull();
  });

  it('continues from existing stats and records slots', () => {
    const storage = new MemoryStorage();
    storage.setItem(keys.stats, serializeStats({ ...emptyStats(), rounds: 1, asFarmer: 1, farmerWins: 1, netScore: 2 }));
    storage.setItem(
      keys.records,
      JSON.stringify({
        version: 1,
        entries: [{ heroSeat: 0, landlord: 1, winner: Side.Farmer, multiplier: 1, bombs: 0, spring: 'none', heroScore: 2, playedAt: 100 }],
      }),
    );

    const committed = commitFinishedRound(storage, keys, { result: flowResult(), heroSeat: 1, playedAt: 200 });

    expect(committed.stats.rounds).toBe(2);
    expect(committed.stats.netScore).toBe(6);
    expect(committed.records.entries.map((entry) => entry.playedAt)).toEqual([100, 200]);
  });
});
