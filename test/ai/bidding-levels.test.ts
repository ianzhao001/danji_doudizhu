/**
 * M4-07 失败测试：叫抢难度分层（架构种入·不可改）。
 * 当前 bidding-levels.ts 为桩（throw not implemented）→ 应先红。
 */
import { describe, it, expect } from 'vitest';
import { chooseBid, AiLevel } from '../../assets/scripts/ai';
import { chooseBidByLevel } from '../../assets/scripts/ai/bidding-levels';
import { createBidding, applyBid } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const calling = () => createBidding(0);
const grabbing = () => applyBid(createBidding(0), { type: 'call', seat: 0 }); // turn → 1

describe('M4-07 叫抢难度分层', () => {
  it('Normal 深相等于 chooseBid（多手牌）', () => {
    const hands = ['2 2 3 4 5', '2 3 4 5 6', '3 4 5 6 7', 'x X 3 4 5', '6 6 6 6 3'];
    for (const h of hands) {
      const s = calling();
      expect(chooseBidByLevel(cards(h), s, AiLevel.Normal)).toEqual(chooseBid(cards(h), s));
    }
  });

  it('两高牌 2 2 3 4 5：Normal=call、Simple=pass、Hard=call', () => {
    expect(chooseBidByLevel(cards('2 2 3 4 5'), calling(), AiLevel.Normal).type).toBe('call');
    expect(chooseBidByLevel(cards('2 2 3 4 5'), calling(), AiLevel.Simple).type).toBe('pass');
    expect(chooseBidByLevel(cards('2 2 3 4 5'), calling(), AiLevel.Hard).type).toBe('call');
  });

  it('一高牌 2 3 4 5 6：Normal=pass、Simple=pass、Hard=call', () => {
    expect(chooseBidByLevel(cards('2 3 4 5 6'), calling(), AiLevel.Normal).type).toBe('pass');
    expect(chooseBidByLevel(cards('2 3 4 5 6'), calling(), AiLevel.Simple).type).toBe('pass');
    expect(chooseBidByLevel(cards('2 3 4 5 6'), calling(), AiLevel.Hard).type).toBe('call');
  });

  it('火箭 x X 3 4 5：三档皆 call', () => {
    for (const level of [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard]) {
      expect(chooseBidByLevel(cards('x X 3 4 5'), calling(), level).type).toBe('call');
    }
  });

  it('无高牌无炸 3 4 5 6 7：三档皆 pass', () => {
    for (const level of [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard]) {
      expect(chooseBidByLevel(cards('3 4 5 6 7'), calling(), level).type).toBe('pass');
    }
  });

  it('grabbing 阶段动作 seat === state.turn（三档）', () => {
    const s = grabbing();
    for (const level of [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard]) {
      const a = chooseBidByLevel(cards('2 2 3 4 5'), s, level);
      expect(a.seat).toBe(s.turn);
    }
  });
});
