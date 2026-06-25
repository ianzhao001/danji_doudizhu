import { describe, it, expect } from 'vitest';
import { chooseBid } from '../../assets/scripts/ai';
import { createBidding, applyBid } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

describe('ai-bid-policy chooseBid', () => {
  it('强手（双王=火箭）calling → call，seat=turn', () => {
    const state = createBidding(0);
    const a = chooseBid(cards('x X 3 4 5'), state);
    expect(a).toEqual({ type: 'call', seat: 0 });
  });

  it('强手（四同点=炸弹）calling → call', () => {
    const state = createBidding(0);
    const a = chooseBid(cards('6 6 6 6 3'), state);
    expect(a.type).toBe('call');
  });

  it('弱手 calling → pass', () => {
    const state = createBidding(0);
    const a = chooseBid(cards('3 4 5 6 7'), state);
    expect(a).toEqual({ type: 'pass', seat: 0 });
  });

  it('强手（≥2 张 ≥R2）grabbing → grab，seat=state.turn', () => {
    const state = applyBid(createBidding(0), { type: 'call', seat: 0 }); // 进入 grabbing，turn=1
    const a = chooseBid(cards('2 2 9 9 9'), state);
    expect(a.type).toBe('grab');
    expect(a.seat).toBe(state.turn);
  });

  it('弱手 grabbing → pass', () => {
    const state = applyBid(createBidding(0), { type: 'call', seat: 0 });
    const a = chooseBid(cards('3 4 5 6 7'), state);
    expect(a.type).toBe('pass');
  });
});
