import { describe, expect, it } from 'vitest';
import { Side, type SeatIndex, type Spring } from '../../assets/scripts/game';
import type { RecordEntry, RecordsState } from '../../assets/scripts/data/records';
import { deriveRecordsDetailView } from '../../assets/scripts/ui/records-detail-view';

function record(args: {
  heroSeat?: SeatIndex;
  landlord?: SeatIndex;
  winner: Side;
  heroScore: number;
  playedAt: number;
  multiplier?: number;
  bombs?: number;
  spring?: Spring;
}): RecordEntry {
  return {
    heroSeat: args.heroSeat ?? 0,
    landlord: args.landlord ?? 0,
    winner: args.winner,
    multiplier: args.multiplier ?? 1,
    bombs: args.bombs ?? 0,
    spring: args.spring ?? 'none',
    heroScore: args.heroScore,
    playedAt: args.playedAt,
  };
}

describe('deriveRecordsDetailView', () => {
  it('handles empty records safely', () => {
    const view = deriveRecordsDetailView({ version: 1, entries: [] });

    expect(view).toEqual({ rows: [], filterLabel: '全部·最新', empty: true });
  });

  it('formats spring and bomb tags plus signed score', () => {
    const records: RecordsState = {
      version: 1,
      entries: [
        record({
          winner: Side.Landlord,
          heroScore: 24,
          playedAt: 10,
          multiplier: 8,
          bombs: 2,
          spring: 'spring',
        }),
      ],
    };

    expect(deriveRecordsDetailView(records).rows[0]).toEqual({
      outcomeLabel: '胜',
      roleLabel: '地主',
      scoreLabel: '+24',
      multiplierLabel: '×8',
      tags: ['春天', '炸弹×2'],
    });
  });

  it('formats farmer loss and anti-spring rows', () => {
    const records: RecordsState = {
      version: 1,
      entries: [
        record({
          heroSeat: 2,
          landlord: 0,
          winner: Side.Landlord,
          heroScore: -16,
          playedAt: 20,
          multiplier: 4,
          spring: 'anti-spring',
        }),
      ],
    };

    expect(deriveRecordsDetailView(records).rows[0]).toMatchObject({
      outcomeLabel: '败',
      roleLabel: '农民',
      scoreLabel: '-16',
      multiplierLabel: '×4',
      tags: ['反春天'],
    });
  });

  it('uses queryRecords filters and labels them', () => {
    const records: RecordsState = {
      version: 1,
      entries: [
        record({ winner: Side.Landlord, heroScore: 2, playedAt: 10 }),
        record({ winner: Side.Farmer, heroScore: -1, playedAt: 30 }),
        record({ landlord: 1, winner: Side.Farmer, heroScore: 1, playedAt: 20, spring: 'spring' }),
      ],
    };

    const view = deriveRecordsDetailView(records, { outcome: 'win', role: 'farmer', spring: 'spring' });
    expect(view.filterLabel).toBe('胜局·农民·春天·最新');
    expect(view.rows).toHaveLength(1);
    expect(view.rows[0].scoreLabel).toBe('+1');
  });

  it('does not mutate input records', () => {
    const records: RecordsState = {
      version: 1,
      entries: [
        record({ winner: Side.Landlord, heroScore: 1, playedAt: 100 }),
        record({ winner: Side.Farmer, heroScore: -1, playedAt: 200 }),
      ],
    };
    const before = structuredClone(records);

    deriveRecordsDetailView(records, { order: 'oldest', limit: 1 });

    expect(records).toEqual(before);
  });
});
