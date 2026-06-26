/**
 * M5-08 失败测试：战绩统计编解码（架构种入·不可改）。
 * 当前 statsCodec.ts 为桩（throw not implemented）→ 应先红。
 */
import { describe, it, expect } from 'vitest';
import { serializeStats, deserializeStats, STATS_VERSION } from '../../assets/scripts/data/statsCodec';
import { emptyStats, type MatchStats } from '../../assets/scripts/data/stats';

function sampleStats(): MatchStats {
  return {
    rounds: 5,
    asLandlord: 2,
    landlordWins: 1,
    asFarmer: 3,
    farmerWins: 2,
    netScore: 42,
  };
}

describe('M5-08 战绩统计编解码', () => {
  it('serialize→deserialize 往返深相等', () => {
    expect(deserializeStats(serializeStats(sampleStats()))).toEqual(sampleStats());
  });

  it('deserializeStats 非法 JSON → emptyStats（不抛错）', () => {
    expect(deserializeStats('not json')).toEqual(emptyStats());
  });

  it('deserializeStats("{}" → emptyStats', () => {
    expect(deserializeStats('{}')).toEqual(emptyStats());
  });

  it('部分字段对象：缺 landlordWins → 该字段回 0、其余保留', () => {
    const json = JSON.stringify({ version: STATS_VERSION, stats: { rounds: 3, asLandlord: 1, asFarmer: 2, farmerWins: 1, netScore: 5 } });
    const back = deserializeStats(json);
    expect(back.landlordWins).toBe(0);
    expect(back.rounds).toBe(3);
    expect(back.asLandlord).toBe(1);
  });

  it('version 缺/旧 → 全默认', () => {
    expect(deserializeStats(JSON.stringify({ version: 0, stats: sampleStats() }))).toEqual(emptyStats());
    expect(deserializeStats(JSON.stringify({ stats: sampleStats() }))).toEqual(emptyStats());
  });

  it('非数值字段（rounds:"x"）→ 该字段回 0', () => {
    const json = JSON.stringify({ version: STATS_VERSION, stats: { ...sampleStats(), rounds: 'x' } });
    expect(deserializeStats(json).rounds).toBe(0);
  });
});
