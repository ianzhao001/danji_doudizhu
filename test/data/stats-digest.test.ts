import { describe, it, expect } from 'vitest';
import { Side, type SeatIndex, type Spring } from '../../assets/scripts/game';
import { digestRecords } from '../../assets/scripts/data/statsDigest';
import { emptyRecords, type RecordEntry, type RecordsState } from '../../assets/scripts/data/records';

function record(args: {
  heroSeat?: SeatIndex;
  landlord?: SeatIndex;
  winner: Side;
  heroScore: number;
  bombs?: number;
  spring?: Spring;
  playedAt?: number;
}): RecordEntry {
  return {
    heroSeat: args.heroSeat ?? 0,
    landlord: args.landlord ?? 0,
    winner: args.winner,
    multiplier: 1,
    bombs: args.bombs ?? 0,
    spring: args.spring ?? 'none',
    heroScore: args.heroScore,
    playedAt: args.playedAt ?? 0,
  };
}

function records(entries: RecordEntry[]): RecordsState {
  return { version: 1, entries };
}

describe('M6-L7 digestRecords', () => {
  it('returns all-zero digest for empty records', () => {
    expect(digestRecords(emptyRecords())).toEqual({
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
    });
  });

  it('counts all wins, win rate, score extremes, bombs, and spring rounds', () => {
    const digest = digestRecords(
      records([
        record({ winner: Side.Landlord, heroScore: 3, bombs: 1, spring: 'spring' }),
        record({ landlord: 1, winner: Side.Farmer, heroScore: 5, bombs: 2, spring: 'anti-spring' }),
      ]),
    );
    expect(digest.wins).toBe(2);
    expect(digest.losses).toBe(0);
    expect(digest.winRatePct).toBe(100);
    expect(digest.currentStreak).toBe(2);
    expect(digest.bestWinStreak).toBe(2);
    expect(digest.bestScore).toBe(5);
    expect(digest.worstScore).toBe(3);
    expect(digest.totalBombs).toBe(3);
    expect(digest.springCount).toBe(2);
  });

  it('reports negative current streak from the newest side of records.entries', () => {
    const digest = digestRecords(
      records([
        record({ winner: Side.Landlord, heroScore: 2 }),
        record({ winner: Side.Farmer, heroScore: -1 }),
        record({ landlord: 1, winner: Side.Landlord, heroScore: -4 }),
      ]),
    );
    expect(digest.wins).toBe(1);
    expect(digest.losses).toBe(2);
    expect(digest.currentStreak).toBe(-2);
    expect(digest.bestWinStreak).toBe(1);
  });

  it('splits landlord and farmer rounds using the same hero-win口径 as stats', () => {
    const digest = digestRecords(
      records([
        record({ heroSeat: 0, landlord: 0, winner: Side.Landlord, heroScore: 2 }),
        record({ heroSeat: 0, landlord: 0, winner: Side.Farmer, heroScore: -2 }),
        record({ heroSeat: 0, landlord: 1, winner: Side.Farmer, heroScore: 1 }),
        record({ heroSeat: 0, landlord: 2, winner: Side.Landlord, heroScore: -1 }),
      ]),
    );
    expect(digest.landlordRounds).toBe(2);
    expect(digest.landlordWins).toBe(1);
    expect(digest.farmerRounds).toBe(2);
    expect(digest.farmerWins).toBe(1);
  });

  it('does not mutate the input records', () => {
    const state = records([record({ winner: Side.Landlord, heroScore: 2 })]);
    const before = JSON.parse(JSON.stringify(state));
    digestRecords(state);
    expect(state).toEqual(before);
  });
});
