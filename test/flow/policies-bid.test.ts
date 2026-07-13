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
    const hand = cards('2 2 3 4 5'); // 双控短手：Hard/Normal=call、Simple=pass，具判别力
    for (const seat of [0, 1, 2] as const) {
      const state = createBidding(seat);
      expect(bidPolicy({ seat, state, hand })).toEqual(chooseBidByLevel(hand, state, LEVELS[seat]));
    }
  });

  // W-AUDIT-AI 契约改写(披露):旧判别手「一高牌 2 3 4 5 6 → Hard=call」已废——
  // 「1 高牌逢局必抢」正是 Hard 作地主胜率反转的成因之一,新 Hard 走结构化判强(bidding-hard.ts)。
  it('难度可见性①：双控短手 2 2 3 4 5 → Hard=call、Simple=pass、Normal=call', () => {
    const { bidPolicy } = levelPolicies(LEVELS);
    const hand = cards('2 2 3 4 5');
    expect(bidPolicy({ seat: 0, state: createBidding(0), hand }).type).toBe('call');
    expect(bidPolicy({ seat: 1, state: createBidding(1), hand }).type).toBe('pass');
    expect(bidPolicy({ seat: 2, state: createBidding(2), hand }).type).toBe('call');
  });

  it('难度可见性②：双控烂形 2 2 3 4 5 7 9 J K A(9 手) → Hard=pass、Normal=call', () => {
    const { bidPolicy } = levelPolicies(LEVELS);
    const hand = cards('2 2 3 4 5 7 9 J K A');
    expect(bidPolicy({ seat: 0, state: createBidding(0), hand }).type).toBe('pass');
    expect(bidPolicy({ seat: 2, state: createBidding(2), hand }).type).toBe('call');
  });

  it('不再统一 chooseBid：seat0(Hard) 与 chooseBid 不同（Hard 看结构，非高牌数）', () => {
    const { bidPolicy } = levelPolicies(LEVELS);
    const hand = cards('2 2 3 4 5 7 9 J K A');
    const state = createBidding(0);
    // chooseBid(基线=Normal 阈值2) 对双控=call；Hard 嫌其散手=pass → 二者不同，证明已切到分层
    expect(bidPolicy({ seat: 0, state, hand })).not.toEqual(chooseBid(hand, state));
  });

  it('playPolicy 不变（仍 strategyFor(levels[turn])）— 绿护栏', () => {
    const { playPolicy } = levelPolicies(LEVELS);
    // 仅断言 playPolicy 仍是函数且不抛（详细路由由 policies.test.ts 覆盖）
    expect(typeof playPolicy).toBe('function');
    void strategyFor;
  });
});
