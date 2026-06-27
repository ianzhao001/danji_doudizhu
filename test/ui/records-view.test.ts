import { describe, expect, it } from 'vitest';
import { type RecordEntry, type RecordsState } from '../../assets/scripts/data/records';
import { Side } from '../../assets/scripts/game/types';
import { deriveRecordsView } from '../../assets/scripts/ui/records-view';

function entry(overrides: Partial<RecordEntry>): RecordEntry {
  return {
    heroSeat: 0,
    landlord: 0,
    winner: Side.Landlord,
    multiplier: 1,
    bombs: 0,
    spring: 'none',
    heroScore: 0,
    playedAt: 0,
    ...overrides,
  };
}

describe('M3-21 对局历史展示 VM', () => {
  it('按追加序倒序输出，并支持 limit', () => {
    const records: RecordsState = {
      version: 1,
      entries: [
        entry({ playedAt: 100, heroScore: 1 }),
        entry({ playedAt: 200, heroScore: 2 }),
        entry({ playedAt: 300, heroScore: 3 }),
      ],
    };

    expect(deriveRecordsView(records).map((row) => row.playedAt)).toEqual([300, 200, 100]);
    expect(deriveRecordsView(records, 2).map((row) => row.playedAt)).toEqual([300, 200]);
    expect(deriveRecordsView(records, 0)).toEqual([]);
    expect(deriveRecordsView(records, -1)).toEqual([]);
  });

  it('地主获胜映射为胜、地主和正分标签', () => {
    const records: RecordsState = {
      version: 1,
      entries: [
        entry({
          heroSeat: 1,
          landlord: 1,
          winner: Side.Landlord,
          multiplier: 8,
          bombs: 1,
          spring: 'spring',
          heroScore: 24,
          playedAt: 10,
        }),
      ],
    };

    expect(deriveRecordsView(records)[0]).toEqual({
      outcomeText: '胜',
      heroScore: 24,
      scoreLabel: '+24',
      roleText: '地主',
      multiplierText: '×8',
      bombs: 1,
      springText: '春天',
      playedAt: 10,
    });
  });

  it('农民负分映射为败、农民和负分标签', () => {
    const records: RecordsState = {
      version: 1,
      entries: [
        entry({
          heroSeat: 2,
          landlord: 0,
          winner: Side.Landlord,
          multiplier: 4,
          bombs: 0,
          spring: 'anti-spring',
          heroScore: -16,
          playedAt: 20,
        }),
      ],
    };

    expect(deriveRecordsView(records)[0]).toMatchObject({
      outcomeText: '败',
      roleText: '农民',
      scoreLabel: '-16',
      springText: '反春天',
      multiplierText: '×4',
    });
  });

  it('平分和 none 春天映射为空标签', () => {
    const records: RecordsState = {
      version: 1,
      entries: [entry({ heroScore: 0, spring: 'none', playedAt: 30 })],
    };

    expect(deriveRecordsView(records)[0]).toMatchObject({
      outcomeText: '平',
      scoreLabel: '0',
      springText: '',
    });
  });

  it('不修改入参', () => {
    const records: RecordsState = {
      version: 1,
      entries: [
        entry({ playedAt: 100, heroScore: 1 }),
        entry({ playedAt: 200, heroScore: -1 }),
      ],
    };
    const before = structuredClone(records);

    deriveRecordsView(records, 1);

    expect(records).toEqual(before);
  });
});
