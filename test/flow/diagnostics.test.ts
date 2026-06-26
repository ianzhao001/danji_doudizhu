import { describe, it, expect } from 'vitest';
import { runHeadlessRound, HeadlessRoundError, type Clock, type PlayPolicy } from '../../assets/scripts/flow';
import { chooseAction } from '../../assets/scripts/ai';

function fakeClock(): Clock {
  return { sleep: async () => {} };
}

describe('M-FLOW playPolicy 注入', () => {
  it('自定义 playPolicy 被调用且跑到 settled（调用次数 = turns）', async () => {
    let calls = 0;
    const policy: PlayPolicy = ({ snapshot, rng }) => {
      calls++;
      return chooseAction(snapshot, rng);
    };
    const r = await runHeadlessRound({ seed: 1, clock: fakeClock(), playPolicy: policy });
    expect(calls).toBeGreaterThan(0);
    expect(r.finalState.phase).toBe('settled');
    expect(calls).toBe(r.turns);
  });
});

describe('M-FLOW HeadlessRoundError 诊断', () => {
  it('maxTurns=1 抛 HeadlessRoundError，携带 seed/turns/非空 lastEvents', async () => {
    let caught: unknown;
    try {
      await runHeadlessRound({ seed: 42, maxTurns: 1, clock: fakeClock() });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(HeadlessRoundError);
    const err = caught as HeadlessRoundError;
    expect(err.seed).toBe(42);
    expect(err.turns).toBeGreaterThanOrEqual(1);
    expect(err.lastEvents.length).toBeGreaterThan(0);
    expect(err.message).toContain('42');
  });
});
