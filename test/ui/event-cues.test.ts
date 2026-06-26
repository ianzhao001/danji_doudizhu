/**
 * M3-00 失败测试：事件提示映射（架构种入·不可改）。当前 event-cues.ts 为桩 → 应先红。
 */
import { describe, it, expect } from 'vitest';
import { cueForGameEvent, cueForFlowEvent } from '../../assets/scripts/ui/event-cues';
import { type GameEvent, Side } from '../../assets/scripts/game';
import { type FlowEvent } from '../../assets/scripts/flow';
import { Rank, Suit, Category } from '../../assets/scripts/rules';

const pat = { category: Category.Single, mainRank: Rank.R3, length: 1, cards: [{ rank: Rank.R3, suit: Suit.Spade }] };

function playEv(seat: 0 | 1 | 2 = 0): Extract<GameEvent, { type: 'play' }> {
  return { type: 'play', seat, pattern: pat };
}

describe('M3-00 事件提示映射', () => {
  it('GameEvent 各 type 映射到对应 cue', () => {
    expect(cueForGameEvent(playEv(0))).toBe('play');
    expect(cueForGameEvent({ type: 'pass', seat: 0 })).toBe('pass');
    expect(cueForGameEvent({ type: 'bomb', seat: 0 })).toBe('bomb');
    expect(cueForGameEvent({ type: 'rocket', seat: 0 })).toBe('rocket');
    expect(cueForGameEvent({ type: 'reset', leader: 0 })).toBe('reset');
    expect(cueForGameEvent({ type: 'win', seat: 0, side: Side.Landlord })).toBe('win');
  });

  it('FlowEvent 各 type 映射正确；round 透传内部 GameEvent 的 cue', () => {
    const deal: FlowEvent = { type: 'deal' };
    const landlordDecided: FlowEvent = { type: 'landlordDecided', landlord: 0, bidMultiplier: 1 };
    const settled: FlowEvent = { type: 'settled', settlement: { multiplier: 1, spring: 'none', bombs: 0, scores: [2, -1, -1] } };
    expect(cueForFlowEvent(deal)).toBe('deal');
    expect(cueForFlowEvent(landlordDecided)).toBe('landlordDecided');
    expect(cueForFlowEvent(settled)).toBe('settled');
    const round: FlowEvent = { type: 'round', event: { type: 'bomb', seat: 1 } };
    expect(cueForFlowEvent(round)).toBe('bomb');
  });

  it('确定性：同事件两次映射结果相同', () => {
    const e = playEv(0);
    expect(cueForGameEvent(e)).toBe(cueForGameEvent(e));
  });

  it('入参不变', () => {
    const e = playEv(0);
    const frozen = { ...e, pattern: { ...e.pattern, cards: [...e.pattern.cards] } };
    cueForGameEvent(e);
    expect(e).toEqual(frozen);
  });
});
