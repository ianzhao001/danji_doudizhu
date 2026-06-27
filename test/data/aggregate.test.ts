import { describe, expect, it } from 'vitest';

import { applyFinishedRound, emptyRecords, emptyStats, toRecordEntry, toRoundOutcome } from '../../assets/scripts/data';
import { GamePhase, Side, type Settlement } from '../../assets/scripts/game';
import type { FlowResult } from '../../assets/scripts/flow';

function settlement(scores: [number, number, number], overrides: Partial<Settlement> = {}): Settlement {
  return { multiplier: 2, spring: 'none', bombs: 0, scores, ...overrides };
}

function result(overrides: Partial<FlowResult> = {}): FlowResult {
  return {
    landlord: 0,
    winner: Side.Landlord,
    settlement: settlement([4, -2, -2]),
    events: [],
    turns: 1,
    redeals: 0,
    finalState: {
      phase: GamePhase.Settled,
      landlord: 0,
      seats: [
        { index: 0, hand: [] },
        { index: 1, hand: [] },
        { index: 2, hand: [] },
      ],
      turn: 0,
      top: null,
      passesInARow: 0,
      winner: Side.Landlord,
      bombsPlayed: 0,
    },
    ...overrides,
  };
}

describe('finished round aggregation', () => {
  it('projects FlowResult to RoundOutcome', () => {
    const flow = result();

    expect(toRoundOutcome(flow, 1)).toEqual({
      heroSeat: 1,
      landlord: flow.landlord,
      winner: flow.winner,
      settlement: flow.settlement,
    });
  });

  it('projects FlowResult to RecordEntry', () => {
    const flow = result({ settlement: settlement([8, -4, -4], { multiplier: 4, bombs: 1, spring: 'spring' }) });

    expect(toRecordEntry(flow, 0, 123)).toEqual({
      heroSeat: 0,
      landlord: 0,
      winner: Side.Landlord,
      multiplier: 4,
      bombs: 1,
      spring: 'spring',
      heroScore: 8,
      playedAt: 123,
    });
  });

  it('applies one finished round immutably to stats and records', () => {
    const stats = emptyStats();
    const records = emptyRecords();
    const statsBefore = { ...stats };
    const recordsBefore = { ...records, entries: records.entries.slice() };

    const next = applyFinishedRound(stats, records, result(), 0, 10);

    expect(stats).toEqual(statsBefore);
    expect(records).toEqual(recordsBefore);
    expect(next.stats.rounds).toBe(1);
    expect(next.stats.asLandlord).toBe(1);
    expect(next.stats.landlordWins).toBe(1);
    expect(next.stats.netScore).toBe(4);
    expect(next.records.entries).toHaveLength(1);
    expect(next.records.entries[0]).toEqual(toRecordEntry(result(), 0, 10));
  });

  it('accumulates consecutive farmer win and loss semantics', () => {
    const farmerWin = result({
      landlord: 0,
      winner: Side.Farmer,
      settlement: settlement([-2, 1, 1], { multiplier: 1 }),
    });
    const farmerLoss = result({
      landlord: 0,
      winner: Side.Landlord,
      settlement: settlement([6, -3, -3], { multiplier: 3 }),
    });

    const first = applyFinishedRound(emptyStats(), emptyRecords(), farmerWin, 1, 100);
    const second = applyFinishedRound(first.stats, first.records, farmerLoss, 1, 200);

    expect(second.stats.rounds).toBe(2);
    expect(second.stats.asFarmer).toBe(2);
    expect(second.stats.farmerWins).toBe(1);
    expect(second.stats.netScore).toBe(-2);
    expect(second.records.entries.map((entry) => entry.playedAt)).toEqual([100, 200]);
    expect(second.records.entries.map((entry) => entry.heroScore)).toEqual([1, -3]);
  });
});
