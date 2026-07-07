/**
 * 叫抢视图模型失败测试（架构种入·不可改）。相对措辞契约：轮到你<动作> / 等待<座位><动作>。
 * T-COPY-BID：当前 bidding-view.ts 仍输出「请座位 N 行动」→ 应先红，实现到绿。
 * T-VIEW-SEAT F3 改种（规划者·2026-07-07）：侧别对齐逆时针真相源 seatDisplayName（seat1=右家/seat2=左家）；
 * legacy seat1=左家 + swapLegacySideText 补丁两轨清账后，本断言直接锁源头正确侧别。
 */
import { describe, it, expect } from 'vitest';
import { deriveBiddingView } from '../../assets/scripts/ui/bidding-view';
import { createBidding, applyBid } from '../../assets/scripts/game';

describe('M3-00 叫抢视图模型', () => {
  it('calling 初始（turn=0、viewer=0）：call/pass enabled、无 grab、轮到你叫地主', () => {
    const v = deriveBiddingView(createBidding(0), 0);
    const ids = v.buttons.map((b) => b.id).sort();
    expect(ids).toEqual(['call', 'pass']);
    expect(v.buttons.every((b) => b.enabled)).toBe(true);
    expect(v.prompt).toBe('轮到你叫地主');
  });

  it('calling 等待他家（turn=1 右家、viewer=0）：prompt 等待右家叫地主', () => {
    const state = applyBid(createBidding(0), { type: 'pass', seat: 0 });
    const v = deriveBiddingView(state, 0);
    expect(v.prompt).toBe('等待右家叫地主');
  });

  it('calling 等待他家（turn=2 左家、viewer=0）：prompt 等待左家叫地主', () => {
    let state = applyBid(createBidding(0), { type: 'pass', seat: 0 });
    state = applyBid(state, { type: 'pass', seat: 1 });
    const v = deriveBiddingView(state, 0);
    expect(v.prompt).toBe('等待左家叫地主');
  });

  it('calling 非玩家轮（turn=0、viewer=1）：call/pass 均 disabled', () => {
    const v = deriveBiddingView(createBidding(0), 1);
    expect(v.buttons.every((b) => !b.enabled)).toBe(true);
  });

  it('grabbing（turn=1、viewer=1）：grab/pass enabled、无 call、轮到你抢地主', () => {
    const state = applyBid(createBidding(0), { type: 'call', seat: 0 });
    const v = deriveBiddingView(state, 1);
    const ids = v.buttons.map((b) => b.id).sort();
    expect(ids).toEqual(['grab', 'pass']);
    expect(v.buttons.every((b) => b.enabled)).toBe(true);
    expect(v.prompt).toBe('轮到你抢地主');
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
