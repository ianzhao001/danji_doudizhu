import { describe, it, expect } from 'vitest';
import { createBidding, applyBid, type BiddingState } from '../../assets/scripts/game/bidding';
import { IllegalActionError } from '../../assets/scripts/game';

type Seat = 0 | 1 | 2;

/** 顺序应用一串叫抢动作，返回末态。 */
function run(startSeat: Seat, seq: Array<['call' | 'grab' | 'pass', Seat]>): BiddingState {
  let s = createBidding(startSeat);
  for (const [type, seat] of seq) s = applyBid(s, { type, seat });
  return s;
}

describe('bidding 叫抢地主（抢翻倍）', () => {
  it('A叫 B不 C不 → landlord A，multiplier 1', () => {
    const s = run(0, [
      ['call', 0],
      ['pass', 1],
      ['pass', 2],
    ]);
    expect(s.phase).toBe('done');
    expect(s.landlord).toBe(0);
    expect(s.multiplier).toBe(1);
  });

  it('A叫 B抢 C不 A反抢 → multiplier 4，landlord A', () => {
    const s = run(0, [
      ['call', 0],
      ['grab', 1],
      ['pass', 2],
      ['grab', 0],
    ]);
    expect(s.landlord).toBe(0);
    expect(s.multiplier).toBe(4);
  });

  it('A叫 B抢 C不 A不 → multiplier 2，landlord B', () => {
    const s = run(0, [
      ['call', 0],
      ['grab', 1],
      ['pass', 2],
      ['pass', 0],
    ]);
    expect(s.landlord).toBe(1);
    expect(s.multiplier).toBe(2);
  });

  it('三人全不叫 → redeal', () => {
    const s = run(0, [
      ['pass', 0],
      ['pass', 1],
      ['pass', 2],
    ]);
    expect(s.phase).toBe('redeal');
  });

  it('done 后再行动 → IllegalActionError', () => {
    const s = run(0, [
      ['call', 0],
      ['pass', 1],
      ['pass', 2],
    ]);
    expect(() => applyBid(s, { type: 'grab', seat: 0 })).toThrow(IllegalActionError);
  });
});
