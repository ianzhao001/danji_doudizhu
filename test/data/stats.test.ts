import { describe, it, expect } from 'vitest';
import { emptyStats, recordRound } from '../../assets/scripts/data';
import { Side, type Settlement } from '../../assets/scripts/game';

/** 构造一个最简 Settlement（只关心 scores）。 */
function settlement(scores: [number, number, number]): Settlement {
  return { multiplier: 1, spring: 'none', bombs: 0, scores };
}

describe('data-stats 战绩累计', () => {
  it('emptyStats 全 0', () => {
    expect(emptyStats()).toEqual({
      rounds: 0,
      asLandlord: 0,
      landlordWins: 0,
      asFarmer: 0,
      farmerWins: 0,
      netScore: 0,
    });
  });

  it('hero 当地主且赢 → asLandlord/landlordWins +1，netScore += scores[hero]', () => {
    const s = recordRound(emptyStats(), {
      heroSeat: 0,
      landlord: 0,
      winner: Side.Landlord,
      settlement: settlement([2, -1, -1]),
    });
    expect(s.rounds).toBe(1);
    expect(s.asLandlord).toBe(1);
    expect(s.landlordWins).toBe(1);
    expect(s.asFarmer).toBe(0);
    expect(s.netScore).toBe(2);
  });

  it('hero 当农民、赢一局 + 输一局 → 计数与 netScore 正确', () => {
    let s = emptyStats();
    s = recordRound(s, { heroSeat: 1, landlord: 0, winner: Side.Farmer, settlement: settlement([-2, 1, 1]) });
    s = recordRound(s, { heroSeat: 1, landlord: 0, winner: Side.Landlord, settlement: settlement([2, -1, -1]) });
    expect(s.rounds).toBe(2);
    expect(s.asFarmer).toBe(2);
    expect(s.farmerWins).toBe(1);
    expect(s.asLandlord).toBe(0);
    expect(s.netScore).toBe(0); // +1 然后 -1
  });

  it('recordRound 不修改入参（不可变）', () => {
    const base = emptyStats();
    const before = JSON.stringify(base);
    recordRound(base, { heroSeat: 0, landlord: 0, winner: Side.Landlord, settlement: settlement([2, -1, -1]) });
    expect(JSON.stringify(base)).toBe(before);
  });
});
