import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import type { GameEvent } from '../../assets/scripts/game';
import { startRoundRuntime } from '../../assets/scripts/flow/round-runtime';
import type { BidPolicy, Clock, PlayPolicy } from '../../assets/scripts/flow';

const immediateClock: Clock = {
  sleep: async () => undefined,
};

const callThenPass: BidPolicy = ({ seat, state }) =>
  state.phase === 'calling' ? { type: 'call', seat } : { type: 'pass', seat };

const leadOneThenPass: PlayPolicy = ({ seat, snapshot }) =>
  snapshot.top
    ? { type: 'pass', seat }
    : { type: 'play', seat, cards: [snapshot.viewerHand![0]] };

async function flushRuntimeAdvance(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('runtime persistence across bidding-to-playing transition', () => {
  it('persists the AI landlord first play before pausing for the farmer hero', async () => {
    const persisted: { events: GameEvent[] }[] = [];
    const runtime = startRoundRuntime({
      seed: 1,
      heroSeat: 1,
      levels: [AiLevel.Simple, AiLevel.Simple, AiLevel.Simple],
      clock: immediateClock,
      thinkingDelayMs: 0,
      bidPolicy: callThenPass,
      playPolicy: leadOneThenPass,
      persist: (payload) => persisted.push(payload),
    });

    await flushRuntimeAdvance();
    expect(runtime.phase()).toBe('bidding');
    expect(runtime.isPlayerTurn()).toBe(true);

    const result = await runtime.submitPlayerAction({
      kind: 'bid',
      action: { type: 'pass', seat: 1 },
    });

    expect(result.ok).toBe(true);
    expect(runtime.phase()).toBe('playing');
    expect(runtime.isPlayerTurn()).toBe(true);
    expect(persisted.at(-1)?.events).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'play', seat: 0 })]),
    );
    runtime.dispose();
  });
});
