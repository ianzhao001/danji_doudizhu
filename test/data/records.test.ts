/**
 * M5-09 失败测试：对局历史记录纯模型（架构种入·不可改）。
 * 当前 records.ts 为桩（throw not implemented）→ 应先红。
 */
import { describe, it, expect } from 'vitest';
import {
  emptyRecords,
  appendRecord,
  recentRecords,
  migrateRecords,
  MAX_RECORDS,
  RECORDS_VERSION,
  type RecordEntry,
} from '../../assets/scripts/data/records';
import { Side } from '../../assets/scripts/game';

function entry(playedAt: number, heroScore = 1): RecordEntry {
  return {
    heroSeat: 0,
    landlord: 0,
    winner: Side.Landlord,
    multiplier: 1,
    bombs: 0,
    spring: 'none',
    heroScore,
    playedAt,
  };
}

describe('M5-09 对局历史记录', () => {
  it('appendRecord 不可变、追加到末尾、长度+1', () => {
    const r0 = emptyRecords();
    const r1 = appendRecord(r0, entry(1));
    expect(r0.entries).toHaveLength(0);
    expect(r1.entries).toHaveLength(1);
    expect(r1.entries[0].playedAt).toBe(1);
  });

  it('超过 MAX_RECORDS 裁剪最旧（长度恒为 MAX_RECORDS，最旧被丢）', () => {
    let r = emptyRecords();
    for (let i = 0; i < MAX_RECORDS + 3; i++) r = appendRecord(r, entry(i));
    expect(r.entries).toHaveLength(MAX_RECORDS);
    // 最旧（0,1,2）被丢，最早保留应为 3
    expect(r.entries[0].playedAt).toBe(3);
  });

  it('recentRecords(n) 倒序、最新在前、n 超长返回全部倒序', () => {
    let r = emptyRecords();
    for (let i = 1; i <= 5; i++) r = appendRecord(r, entry(i));
    expect(recentRecords(r, 3).map((e) => e.playedAt)).toEqual([5, 4, 3]);
    expect(recentRecords(r, 100).map((e) => e.playedAt)).toEqual([5, 4, 3, 2, 1]);
  });

  it('migrateRecords({}) → emptyRecords', () => {
    expect(migrateRecords({})).toEqual(emptyRecords());
  });

  it('migrateRecords(null / "x" → emptyRecords', () => {
    expect(migrateRecords(null)).toEqual(emptyRecords());
    expect(migrateRecords('x')).toEqual(emptyRecords());
  });

  it('合法 records 经 migrateRecords 幂等', () => {
    let r = emptyRecords();
    r = appendRecord(r, entry(1));
    expect(migrateRecords(r)).toEqual(r);
  });

  it('emptyRecords().version === RECORDS_VERSION', () => {
    expect(emptyRecords().version).toBe(RECORDS_VERSION);
    expect(emptyRecords().entries).toEqual([]);
  });
});
