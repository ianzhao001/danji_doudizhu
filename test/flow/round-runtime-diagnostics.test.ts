import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import {
  GamePhase,
  Side,
  type GameEvent,
  type RoundState,
  type SeatIndex,
} from '../../assets/scripts/game';
import {
  resumeRoundRuntime,
  startRoundRuntime,
  type RuntimeConfig,
} from '../../assets/scripts/flow/round-runtime';
import { Category, Rank, Suit, type Card } from '../../assets/scripts/rules';
import type { BidPolicy, Clock, PlayPolicy } from '../../assets/scripts/flow';

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

const R3 = card(Rank.R3, Suit.Spade);
const R4 = card(Rank.R4, Suit.Heart);
const R5 = card(Rank.R5, Suit.Club);
const R6 = card(Rank.R6, Suit.Diamond);

function immediateClock(): Clock {
  return { sleep: async () => undefined };
}

const passAfterCall: BidPolicy = ({ seat, state }) =>
  state.phase === 'calling' ? { type: 'call', seat } : { type: 'pass', seat };

const leadSingleThenPass: PlayPolicy = ({ seat, snapshot }) => {
  if (snapshot.top) return { type: 'pass', seat };
  return { type: 'play', seat, cards: [snapshot.viewerHand![0]] };
};

function config(overrides: Partial<RuntimeConfig> = {}): RuntimeConfig {
  return {
    seed: 1,
    heroSeat: 0,
    levels: [AiLevel.Simple, AiLevel.Simple, AiLevel.Simple],
    clock: immediateClock(),
    thinkingDelayMs: 0,
    bidPolicy: passAfterCall,
    playPolicy: leadSingleThenPass,
    ...overrides,
  };
}

function playingState(args: {
  turn: SeatIndex;
  hands: [Card[], Card[], Card[]];
  top?: RoundState['top'];
  landlord?: SeatIndex;
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

function settledState(landlord: SeatIndex = 0): RoundState {
  return {
    phase: GamePhase.Settled,
    landlord,
    seats: [
      { index: 0, hand: [] },
      { index: 1, hand: [R4] },
      { index: 2, hand: [R5] },
    ],
    turn: landlord,
    top: { seat: landlord, pattern: { category: Category.Single, mainRank: Rank.R3, length: 1, cards: [R3] } },
    passesInARow: 0,
    winner: Side.Landlord,
    bombsPlayed: 0,
  };
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('round-runtime diagnostics hardening', () => {
  it('keeps the original error available after internal termination', async () => {
    const boom = new Error('policy exploded');
    const runtime = resumeRoundRuntime(
      {
        state: playingState({ turn: 0, hands: [[R3, R6], [R4], [R5]] }),
        heroSeat: 0,
        bidMultiplier: 1,
        events: [],
      },
      config({
        playPolicy: () => {
          throw boom;
        },
      }),
    );

    const result = await runtime.submitPlayerAction({ kind: 'play', action: { type: 'play', seat: 0, cards: [R3] } });
    await flush();

    expect(result).toMatchObject({ ok: false, error: { reason: 'INTERNAL_ERROR' } });
    expect(runtime.terminationReason()).toBe('error');
    expect(runtime.terminationDetail()).toBe(boom);
  });

  it('does not replay resume-settled events to onEvent subscribers', async () => {
    const winEvent: GameEvent = { type: 'win', seat: 0, side: Side.Landlord };
    const runtime = resumeRoundRuntime(
      {
        state: settledState(),
        heroSeat: 0,
        bidMultiplier: 2,
        events: [winEvent],
      },
      config(),
    );
    const seen: string[] = [];

    runtime.onEvent((event) => seen.push(event.type));
    await flush();

    expect(runtime.phase()).toBe('settled');
    expect(runtime.settlement()).not.toBeNull();
    expect(seen).toEqual([]);
  });

  it('replays the opening deal once per subscriber before realtime events start', async () => {
    const runtime = startRoundRuntime(config({ heroSeat: 0 }));
    const first: string[] = [];
    const second: string[] = [];

    runtime.onEvent((event) => first.push(event.type));
    runtime.onEvent((event) => second.push(event.type));

    expect(first).toEqual(['deal']);
    expect(second).toEqual(['deal']);
    expect(first).not.toContain('round');
    expect(second).not.toContain('round');
  });
});
