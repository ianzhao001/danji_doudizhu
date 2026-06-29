import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import {
  GamePhase,
  Side,
  type BiddingState,
  type RoundState,
  type SeatIndex,
} from '../../assets/scripts/game';
import {
  startRoundRuntime,
  resumeRoundRuntime,
  type RuntimeConfig,
} from '../../assets/scripts/flow/round-runtime';
import { Category, Rank, Suit, type Card, type HandPattern } from '../../assets/scripts/rules';
import type { BidPolicy, Clock, PlayPolicy } from '../../assets/scripts/flow';

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

const R3 = card(Rank.R3, Suit.Spade);
const R4 = card(Rank.R4, Suit.Heart);
const R5 = card(Rank.R5, Suit.Club);
const A = card(Rank.A, Suit.Diamond);

function singlePattern(c: Card): HandPattern {
  return { category: Category.Single, mainRank: c.rank, length: 1, cards: [c] };
}

function playingState(args: {
  landlord?: SeatIndex;
  turn: SeatIndex;
  hands: [Card[], Card[], Card[]];
  top?: { seat: SeatIndex; pattern: HandPattern } | null;
}): RoundState {
  const landlord = args.landlord ?? 0;
  return {
    phase: GamePhase.Playing,
    landlord,
    seats: args.hands.map((hand, index) => ({ index: index as SeatIndex, hand: hand.slice() })),
    turn: args.turn,
    top: args.top ?? null,
    passesInARow: 0,
    winner: null,
    bombsPlayed: 0,
  };
}

function immediateClock(): Clock {
  return {
    sleep: async () => undefined,
  };
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

const passAfterCall: BidPolicy = ({ seat, state }) =>
  state.phase === 'calling' ? { type: 'call', seat } : { type: 'pass', seat };

const alwaysPassBid: BidPolicy = ({ seat }) => ({ type: 'pass', seat });

const leadSingleThenPass: PlayPolicy = ({ seat, snapshot }) => {
  if (snapshot.top) return { type: 'pass', seat };
  return { type: 'play', seat, cards: [snapshot.viewerHand![0]] };
};

function config(overrides: Partial<RuntimeConfig> = {}): RuntimeConfig {
  return {
    seed: 1,
    heroSeat: 1,
    levels: [AiLevel.Simple, AiLevel.Simple, AiLevel.Simple],
    clock: immediateClock(),
    thinkingDelayMs: 0,
    bidPolicy: passAfterCall,
    playPolicy: leadSingleThenPass,
    ...overrides,
  };
}

describe('round-runtime publishing hardening', () => {
  it('turns AI advancement exceptions after a hero submit into a structured error result', async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);
    try {
      const runtime = resumeRoundRuntime(
        {
          state: playingState({ turn: 1, hands: [[A], [R3, R4], [R5]] }),
          heroSeat: 1,
          bidMultiplier: 1,
          events: [],
        },
        config({
          playPolicy: () => {
            throw new Error('policy exploded');
          },
        }),
      );

      const result = await runtime.submitPlayerAction({ kind: 'play', action: { type: 'play', seat: 1, cards: [R3] } });
      await flush();

      expect(result).toMatchObject({ ok: false, error: { reason: 'INTERNAL_ERROR' } });
      expect(runtime.phase()).toBe('disposed');
      expect(runtime.terminationReason()).toBe('error');
      expect(unhandled).toEqual([]);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('terminates with error instead of spinning when the advancement step cap is exceeded', async () => {
    const runtime = resumeRoundRuntime(
      { state: playingState({ turn: 2, hands: [[A], [R3], [R4]] }), heroSeat: 1, bidMultiplier: 1, events: [] },
      config({ maxTurns: 0 }),
    );

    await flush();

    expect(runtime.phase()).toBe('disposed');
    expect(runtime.terminationReason()).toBe('error');
  });

  it('terminates with error for an impossible completed bidding state without a landlord', async () => {
    const runtime = startRoundRuntime(config({ heroSeat: 0, maxTurns: 5 }));
    const bidding = runtime.currentBidding()!;
    (runtime as unknown as { bidding: BiddingState }).bidding = {
      ...bidding,
      phase: 'done',
      landlord: null,
    };

    await (runtime as unknown as { advanceUntilPause: () => Promise<void> }).advanceUntilPause();

    expect(runtime.phase()).toBe('disposed');
    expect(runtime.terminationReason()).toBe('error');
  });

  it('exposes configured redeal exhaustion as a distinct termination reason', async () => {
    const runtime = startRoundRuntime(config({ heroSeat: 0, bidPolicy: alwaysPassBid, maxRedeals: 0 }));

    for (let i = 0; i < 20 && runtime.phase() !== 'disposed'; i++) {
      if (runtime.isPlayerTurn()) {
        await runtime.submitPlayerAction({ kind: 'bid', action: { type: 'pass', seat: 0 } });
      }
      await flush();
    }

    expect(runtime.phase()).toBe('disposed');
    expect(runtime.terminationReason()).toBe('redealExhausted');
  });

  it('replays the opening deal to the first subscriber and isolates throwing subscribers', async () => {
    const runtime = startRoundRuntime(config({ heroSeat: 0 }));
    const first: string[] = [];
    const second: string[] = [];

    runtime.onEvent((event) => {
      first.push(event.type);
      throw new Error('subscriber failed');
    });
    runtime.onEvent((event) => second.push(event.type));

    const result = await runtime.submitPlayerAction({ kind: 'bid', action: { type: 'call', seat: 0 } });

    expect(result.ok).toBe(true);
    expect(first[0]).toBe('deal');
    expect(first).toContain('bid');
    expect(second).toContain('bid');
  });

  it('returns a read-only bidding copy so callers cannot mutate internal bidding state', () => {
    const runtime = startRoundRuntime(config({ heroSeat: 0 }));
    const bidding = runtime.currentBidding()!;

    try {
      (bidding as unknown as { phase: string }).phase = 'done';
      bidding.grabQueue.push(1);
    } catch {
      // Frozen views may throw in strict mode; either way the internal state must not change.
    }

    expect(runtime.currentBidding()).toMatchObject({ phase: 'calling', landlord: null, grabQueue: [] });
  });

  it('skips persist when a subscriber disposes during landlordDecided', async () => {
    const persisted: unknown[] = [];
    const runtime = startRoundRuntime(
      config({
        heroSeat: 0,
        persist: (payload) => persisted.push(payload),
      }),
    );
    runtime.onEvent((event) => {
      if (event.type === 'landlordDecided') runtime.dispose();
    });

    const result = await runtime.submitPlayerAction({ kind: 'bid', action: { type: 'call', seat: 0 } });

    expect(result.ok).toBe(true);
    expect(runtime.phase()).toBe('disposed');
    expect(persisted).toEqual([]);
  });

  it('skips onSettled when a subscriber disposes during the settled event', async () => {
    const settled: unknown[] = [];
    const runtime = resumeRoundRuntime(
      {
        state: playingState({ turn: 1, hands: [[A], [R3], [R4]] }),
        heroSeat: 1,
        bidMultiplier: 1,
        events: [],
      },
      config({ onSettled: (finish) => settled.push(finish) }),
    );
    runtime.onEvent((event) => {
      if (event.type === 'settled') runtime.dispose();
    });

    const result = await runtime.submitPlayerAction({ kind: 'play', action: { type: 'play', seat: 1, cards: [R3] } });

    expect(result.ok).toBe(true);
    expect(runtime.phase()).toBe('disposed');
    expect(runtime.terminationReason()).toBe('settled');
    expect(settled).toEqual([]);
  });

  it('keeps normal settlement termination observable', async () => {
    const runtime = resumeRoundRuntime(
      {
        state: playingState({ turn: 1, hands: [[A], [R3], [R4]] }),
        heroSeat: 1,
        bidMultiplier: 1,
        events: [],
      },
      config(),
    );

    const result = await runtime.submitPlayerAction({ kind: 'play', action: { type: 'play', seat: 1, cards: [R3] } });

    expect(result.ok).toBe(true);
    expect(runtime.phase()).toBe('settled');
    expect(runtime.terminationReason()).toBe('settled');
  });
});
