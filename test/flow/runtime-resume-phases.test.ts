import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import { GamePhase, Side, type GameEvent, type RoundState, type SeatIndex } from '../../assets/scripts/game';
import { resumeRoundRuntime, type RuntimeConfig } from '../../assets/scripts/flow/round-runtime';
import { Category, Rank, Suit, type Card, type HandPattern } from '../../assets/scripts/rules';
import type { Clock, PlayPolicy } from '../../assets/scripts/flow';

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
  passesInARow?: number;
}): RoundState {
  const landlord = args.landlord ?? 0;
  return {
    phase: GamePhase.Playing,
    landlord,
    seats: args.hands.map((hand, index) => ({ index: index as SeatIndex, hand: hand.slice() })),
    turn: args.turn,
    top: args.top ?? null,
    passesInARow: args.passesInARow ?? 0,
    winner: null,
    bombsPlayed: 0,
    bottom: null,
  };
}

function settledState(): RoundState {
  return {
    ...playingState({ turn: 1, hands: [[], [], [R4]], landlord: 0 }),
    phase: GamePhase.Settled,
    winner: Side.Farmer,
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
    thinkingDelayMs: 5,
    playPolicy: leadSingleThenPass,
    ...overrides,
  };
}

describe('round-runtime resume phases', () => {
  it('resumes a playing hero turn with a snapshot and can legally settle', async () => {
    const settled: unknown[] = [];
    const runtime = resumeRoundRuntime(
      { state: playingState({ turn: 1, hands: [[], [R3], [R4]] }), heroSeat: 1, bidMultiplier: 2, events: [] },
      config({ onSettled: (finish) => settled.push(finish) }),
    );

    expect(runtime.phase()).toBe('playing');
    expect(runtime.currentSnapshot()).toMatchObject({ phase: GamePhase.Playing, turn: 1, landlord: 0 });
    expect(runtime.isPlayerTurn()).toBe(true);
    expect(runtime.legalInputs()?.some((input) => input.kind === 'play')).toBe(true);

    const result = await runtime.submitPlayerAction({ kind: 'play', action: { type: 'play', seat: 1, cards: [R3] } });

    expect(result.ok).toBe(true);
    expect(runtime.phase()).toBe('settled');
    expect(runtime.currentSnapshot()).toMatchObject({ phase: GamePhase.Settled, winner: Side.Farmer });
    expect(runtime.settlement()).not.toBeNull();
    expect(runtime.settlement()!.scores[0] + runtime.settlement()!.scores[1] + runtime.settlement()!.scores[2]).toBe(0);
    expect(settled).toHaveLength(1);
    expect(result.events?.map((event) => event.type)).toEqual(['round', 'round', 'settled']);
  });

  it('resumes an already settled round and emits onSettled exactly once', async () => {
    const finished: unknown[] = [];
    const events: string[] = [];
    const history: GameEvent[] = [
      { type: 'play', seat: 0, pattern: singlePattern(R5) },
      { type: 'play', seat: 1, pattern: singlePattern(R3) },
      { type: 'win', seat: 1, side: Side.Farmer },
    ];

    const runtime = resumeRoundRuntime(
      { state: settledState(), heroSeat: 1, bidMultiplier: 4, events: history },
      config({ onSettled: (finish) => finished.push(finish) }),
    );
    runtime.onEvent((event) => events.push(event.type));
    await flush();

    expect(runtime.phase()).toBe('settled');
    expect(runtime.currentSnapshot()).toMatchObject({ phase: GamePhase.Settled, winner: Side.Farmer });
    expect(runtime.isPlayerTurn()).toBe(false);
    expect(runtime.legalInputs()).toBeNull();
    expect(runtime.settlement()).toMatchObject({ multiplier: 8, spring: 'anti-spring' });
    expect(finished).toHaveLength(1);
    expect(events).toEqual([]);

    await flush();
    expect(finished).toHaveLength(1);
  });

  it('does not apply a pending AI action or emit after dispose', async () => {
    const clock = new PendingClock();
    const events: string[] = [];
    const settled: unknown[] = [];
    const runtime = resumeRoundRuntime(
      { state: playingState({ turn: 2, hands: [[A], [R3], [R4]] }), heroSeat: 1, bidMultiplier: 1, events: [] },
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
