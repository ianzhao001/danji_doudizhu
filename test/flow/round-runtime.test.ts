import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import {
  GamePhase,
  Side,
  type BidAction,
  type RoundState,
  type SeatIndex,
} from '../../assets/scripts/game';
import { startRoundRuntime, resumeRoundRuntime, type RuntimeConfig } from '../../assets/scripts/flow/round-runtime';
import { Category, Rank, Suit, type Card, type HandPattern } from '../../assets/scripts/rules';
import type { BidPolicy, Clock, PlayPolicy } from '../../assets/scripts/flow';

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

const R3 = card(Rank.R3, Suit.Spade);
const R4 = card(Rank.R4, Suit.Heart);
const R5 = card(Rank.R5, Suit.Club);
const A = card(Rank.A, Suit.Spade);

function singlePattern(c: Card): HandPattern {
  return { category: Category.Single, mainRank: c.rank, length: 1, cards: [c] };
}

function state(args: {
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
    bottom: null,
  };
}

function immediateClock(): Clock & { sleeps: number[] } {
  const sleeps: number[] = [];
  return {
    sleeps,
    sleep: async (ms: number) => {
      sleeps.push(ms);
    },
  };
}

class PendingClock implements Clock {
  readonly sleeps: number[] = [];
  private resolvers: (() => void)[] = [];

  sleep(ms: number): Promise<void> {
    this.sleeps.push(ms);
    return new Promise((resolve) => this.resolvers.push(resolve));
  }

  resolveAll(): void {
    const resolvers = this.resolvers;
    this.resolvers = [];
    for (const resolve of resolvers) resolve();
  }
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

const passAfterCall: BidPolicy = ({ seat, state }) =>
  state.phase === 'calling' ? { type: 'call', seat } : { type: 'pass', seat };

const leadOneThenPass: PlayPolicy = ({ seat, snapshot }) => {
  if (snapshot.top) return { type: 'pass', seat };
  return { type: 'play', seat, cards: [snapshot.viewerHand![0]] };
};

function config(overrides: Partial<RuntimeConfig> = {}): RuntimeConfig {
  return {
    seed: 1,
    heroSeat: 1,
    levels: [AiLevel.Simple, AiLevel.Simple, AiLevel.Simple],
    clock: immediateClock(),
    thinkingDelayMs: 5,
    bidPolicy: passAfterCall,
    playPolicy: leadOneThenPass,
    ...overrides,
  };
}

describe('round-runtime', () => {
  it('starts with AI bidding, pauses for hero, persists after landlord is decided, then pauses in playing', async () => {
    const clock = immediateClock();
    const seen: string[] = [];
    const persisted: unknown[] = [];
    const runtime = startRoundRuntime(
      config({
        clock,
        persist: (payload) => persisted.push(payload),
      }),
    );
    runtime.onEvent((event) => seen.push(event.type));

    await flush();
    expect(runtime.phase()).toBe('bidding');
    expect(runtime.isPlayerTurn()).toBe(true);
    expect(runtime.legalInputs()?.map((input) => (input.action as BidAction).type)).toEqual(['grab', 'pass']);

    const result = await runtime.submitPlayerAction({ kind: 'bid', action: { type: 'pass', seat: 1 } });

    expect(result.ok).toBe(true);
    expect(runtime.phase()).toBe('playing');
    expect(runtime.isPlayerTurn()).toBe(true);
    expect(persisted).toHaveLength(1);
    expect(seen).toContain('landlordDecided');
    expect(result.events?.some((event) => event.type === 'round')).toBe(true);
    expect(clock.sleeps).toEqual([5, 5, 5]);
  });

  it('resumes a hero turn and settles with onSettled once', async () => {
    const settled: unknown[] = [];
    const runtime = resumeRoundRuntime(
      { state: state({ turn: 1, hands: [[], [R3], [R4]] }), heroSeat: 1, bidMultiplier: 2, events: [] },
      config({ onSettled: (finish) => settled.push(finish) }),
    );

    const result = await runtime.submitPlayerAction({ kind: 'play', action: { type: 'play', seat: 1, cards: [R3] } });

    expect(result.ok).toBe(true);
    expect(runtime.phase()).toBe('settled');
    const settlement = runtime.settlement();
    expect(settlement).not.toBeNull();
    expect(settlement!.scores[0] + settlement!.scores[1] + settlement!.scores[2]).toBe(0);
    expect(settled).toHaveLength(1);
    expect(settled[0]).toMatchObject({ landlord: 0, winner: Side.Farmer });
    expect(result.events?.map((event) => event.type)).toEqual(['round', 'round', 'settled']);
  });

  it('rejects illegal hero play without mutating snapshot', async () => {
    const runtime = resumeRoundRuntime(
      {
        state: state({
          turn: 1,
          hands: [[A], [R3], [R4]],
          top: { seat: 0, pattern: singlePattern(A) },
        }),
        heroSeat: 1,
        bidMultiplier: 1,
        events: [{ type: 'play', seat: 0, pattern: singlePattern(A) }],
      },
      config(),
    );
    const before = runtime.currentSnapshot();

    const result = await runtime.submitPlayerAction({ kind: 'play', action: { type: 'play', seat: 1, cards: [R3] } });

    expect(result).toEqual({ ok: false, error: { reason: 'CANNOT_BEAT' } });
    expect(runtime.currentSnapshot()).toEqual(before);
  });

  it('rejects submit while AI turn is pending', async () => {
    const clock = new PendingClock();
    const runtime = resumeRoundRuntime(
      { state: state({ turn: 2, hands: [[A], [R3], [R4]] }), heroSeat: 1, bidMultiplier: 1, events: [] },
      config({ clock, thinkingDelayMs: 9 }),
    );
    await flush();

    const result = await runtime.submitPlayerAction({ kind: 'play', action: { type: 'play', seat: 1, cards: [R3] } });

    expect(result).toEqual({ ok: false, error: { reason: 'NOT_PLAYER_TURN' } });
    expect(clock.sleeps).toEqual([9]);
  });

  it('dispose prevents a pending AI sleep from applying actions or emitting events', async () => {
    const clock = new PendingClock();
    const events: string[] = [];
    const settled: unknown[] = [];
    const runtime = resumeRoundRuntime(
      { state: state({ turn: 2, hands: [[A], [R3], [R4]] }), heroSeat: 1, bidMultiplier: 1, events: [] },
      config({ clock, thinkingDelayMs: 11, onSettled: (finish) => settled.push(finish) }),
    );
    runtime.onEvent((event) => events.push(event.type));
    await flush();
    const before = runtime.currentSnapshot();

    runtime.dispose();
    clock.resolveAll();
    await flush();

    expect(runtime.phase()).toBe('disposed');
    expect(runtime.currentSnapshot()).toEqual(before);
    expect(events).toEqual([]);
    expect(settled).toEqual([]);
  });
});
