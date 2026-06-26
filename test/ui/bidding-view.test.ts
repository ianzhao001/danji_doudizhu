/**
 * M3-00 失败测试：叫抢视图模型（架构种入·不可改）。当前 bidding-view.ts 为桩 → 应先红。
 */
import { describe, it, expect } from 'vitest';
import { deriveBiddingView } from '../../assets/scripts/ui/bidding-view';
import { createBidding, applyBid } from '../../assets/scripts/game';

describe('M3-00 叫抢视图模型', () => {
  it('calling 初始（turn=0、viewer=0）：call/pass enabled、无 grab、prompt 含座位1', () => {
    const v = deriveBiddingView(createBidding(0), 0);
    const ids = v.buttons.map((b) => b.id).sort();
    expect(ids).toEqual(['call', 'pass']);
    expect(v.buttons.every((b) => b.enabled)).toBe(true);
    expect(v.prompt).toContain('1');
  });

  it('calling 非玩家轮（turn=0、viewer=1）：call/pass 均 disabled', () => {
    const v = deriveBiddingView(createBidding(0), 1);
    expect(v.buttons.every((b) => !b.enabled)).toBe(true);
  });

  it('grabbing（turn=1、viewer=1）：grab/pass enabled、无 call', () => {
    const state = applyBid(createBidding(0), { type: 'call', seat: 0 });
    const v = deriveBiddingView(state, 1);
    const ids = v.buttons.map((b) => b.id).sort();
    expect(ids).toEqual(['grab', 'pass']);
    expect(v.buttons.every((b) => b.enabled)).toBe(true);
  });

  it('done/redeal：全 disabled', () => {
    // redeal：连过3次
    let s = createBidding(0);
    s = applyBid(s, { type: 'pass', seat: 0 });
    s = applyBid(s, { type: 'pass', seat: 1 });
    s = applyBid(s, { type: 'pass', seat: 2 });
    const v = deriveBiddingView(s, 0);
    expect(v.buttons.every((b) => !b.enabled)).toBe(true);
  });

  it('入参不变（state 不被改动）', () => {
    const s = createBidding(0);
    const frozen = { ...s, grabQueue: [...s.grabQueue] };
    deriveBiddingView(s, 0);
    expect(s).toEqual(frozen);
  });
});
