import { describe, expect, it } from 'vitest';

import { HeadlessRoundError, runHeadlessRound, type BidPolicy, type Clock } from '../../assets/scripts/flow';

function fakeClock(): Clock {
  return { sleep: async () => undefined };
}

describe('flow driver diagnostics edges', () => {
  it('throws a plain Error with seed when maxRedeals is exceeded', async () => {
    const allPass: BidPolicy = ({ seat }) => ({ type: 'pass', seat });
    let caught: unknown;

    try {
      await runHeadlessRound({ seed: 42, bidPolicy: allPass, maxRedeals: 0, clock: fakeClock() });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(caught).not.toBeInstanceOf(HeadlessRoundError);
    expect((caught as Error).message).toContain('42');
  });

  it('throws HeadlessRoundError immediately when maxTurns is zero', async () => {
    let caught: unknown;

    try {
      await runHeadlessRound({ seed: 7, maxTurns: 0, clock: fakeClock() });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HeadlessRoundError);
    const err = caught as HeadlessRoundError;
    expect(err.seed).toBe(7);
    expect(err.turns).toBe(0);
    expect(err.landlord).not.toBeNull();
    expect(err.lastEvents.length).toBeGreaterThan(0);
    expect(err.message).toContain('7');
  });
});
