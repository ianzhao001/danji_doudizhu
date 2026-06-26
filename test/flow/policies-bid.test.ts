/**
 * M-FLOW-04 失败测试：叫抢策略切到难度分层（架构种入·不可改）。
 * 当前 levelPolicies().bidPolicy 仍委派 chooseBid（M-FLOW-03 状态）→ 下列路由/分层断言应先红。
 */
import { describe, it, expect } from 'vitest';
import { levelPolicies } from '../../assets/scripts/flow/policies';
import { AiLevel, chooseBidByLevel, strategyFor, chooseBid } from '../../assets/scripts/ai';
import { createBidding } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const LEVELS: [AiLevel, AiLevel, AiLevel] = [AiLevel.Hard, AiLevel.Simple, AiLevel.Normal];

describe('M-FLOW-04 叫抢策略切到难度分层', () => {
  it('bidPolicy 按 seat 路由到 chooseBidByLevel(levels[seat])（seat 0/1/2 深相等）', () => {
    const { bidPolicy } = levelPolicies(LEVELS);
    const hand = cards('2 3 4 5 6'); // 一高牌：Hard=call、Normal/Simple=pass，具判别力
    for (const seat of [0, 1, 2] as const) {
      const state = createBidding(seat);
      expect(bidPolicy({ seat, state, hand })).toEqual(chooseBidByLevel(hand, state, LEVELS[seat]));
    }
  });

  it('难度可见性：一高牌 2 3 4 5 6 → seat0(Hard)=call、seat1(Simple)=pass、seat2(Normal)=pass', () => {
    const { bidPolicy } = levelPolicies(LEVELS);
    const hand = cards('2 3 4 5 6');
    expect(bidPolicy({ seat: 0, state: createBidding(0), hand }).type).toBe('call');
    expect(bidPolicy({ seat: 1, state: createBidding(1), hand }).type).toBe('pass');
    expect(bidPolicy({ seat: 2, state: createBidding(2), hand }).type).toBe('pass');
  });

  it('不再统一 chooseBid：seat0(Hard) 与 chooseBid 不同（Hard 更积极）', () => {
    const { bidPolicy } = levelPolicies(LEVELS);
    const hand = cards('2 3 4 5 6');
    const state = createBidding(0);
    // chooseBid(基线=Normal 阈值2) 对一高牌=pass；Hard=call → 二者不同，证明已切到分层
    expect(bidPolicy({ seat: 0, state, hand })).not.toEqual(chooseBid(hand, state));
  });

  it('playPolicy 不变（仍 strategyFor(levels[turn])）— 绿护栏', () => {
    const { playPolicy } = levelPolicies(LEVELS);
    // 仅断言 playPolicy 仍是函数且不抛（详细路由由 policies.test.ts 覆盖）
    expect(typeof playPolicy).toBe('function');
    void strategyFor;
  });
});
