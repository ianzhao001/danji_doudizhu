import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import { commitFinishedRound, persistRound, restoreRound, type SessionKeys } from '../../assets/scripts/data/session';
import { GamePhase, Side, type GameEvent, type RoundFinishInput, type RoundState, type SeatIndex } from '../../assets/scripts/game';
import { startRoundRuntime, resumeRoundRuntime, type PlayerInput, type RoundRuntime, type RuntimeConfig } from '../../assets/scripts/flow/round-runtime';
import type { BidPolicy, Clock, PlayPolicy } from '../../assets/scripts/flow';
import { memoryStorage } from '../../assets/scripts/runtime/storage-adapter';

interface CapturedSave {
  round: RoundState;
  heroSeat: SeatIndex;
  bidMultiplier: number;
  events: GameEvent[];
}

function cloneRound(round: RoundState): RoundState {
  return JSON.parse(JSON.stringify(round)) as RoundState;
}

function cloneEvents(events: GameEvent[]): GameEvent[] {
  return JSON.parse(JSON.stringify(events)) as GameEvent[];
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

function chooseInput(inputs: PlayerInput[]): PlayerInput {
  return inputs.find((input) => input.kind === 'bid' && input.action.type === 'pass') ?? inputs[0];
}

async function driveToSettled(runtime: RoundRuntime, maxSteps = 220): Promise<void> {
  for (let step = 0; step < maxSteps; step++) {
    await flush();
    const phase = runtime.phase();
    if (phase === 'settled') return;
    if (phase === 'disposed') throw new Error(`runtime disposed before settlement at step=${step}`);
    if (!runtime.isPlayerTurn()) continue;

    const inputs = runtime.legalInputs();
    if (!inputs || inputs.length === 0) throw new Error(`player turn without legal inputs at step=${step}`);
    const result = await runtime.submitPlayerAction(chooseInput(inputs));
    expect(result.ok).toBe(true);
  }
  throw new Error(`runtime did not settle within ${maxSteps} player/AI steps`);
}

function heroWon(finish: RoundFinishInput, heroSeat: SeatIndex): boolean {
  const heroIsLandlord = finish.landlord === heroSeat;
  return (heroIsLandlord && finish.winner === Side.Landlord) || (!heroIsLandlord && finish.winner === Side.Farmer);
}

describe('save/resume/session end to end', () => {
  it.each([7, 19])('persists seed %i, resumes from storage, settles, and aggregates records', async (seed) => {
    const heroSeat: SeatIndex = 1;
    const storage = memoryStorage();
    const keys: SessionKeys = {
      save: `e2e.save.${seed}`,
      stats: `e2e.stats.${seed}`,
      records: `e2e.records.${seed}`,
    };
    let captured: CapturedSave | null = null;

    const runtime = startRoundRuntime(
      config({
        seed,
        heroSeat,
        persist: (payload) => {
          captured = {
            round: cloneRound(payload.round),
            heroSeat: payload.heroSeat,
            bidMultiplier: payload.bidMultiplier,
            events: cloneEvents(payload.events),
          };
          persistRound(storage, keys, { ...payload, savedAt: seed * 1000 });
        },
      }),
    );

    await flush();
    expect(runtime.phase()).toBe('bidding');
    expect(runtime.isPlayerTurn()).toBe(true);
    const bidResult = await runtime.submitPlayerAction({ kind: 'bid', action: { type: 'pass', seat: heroSeat } });
    expect(bidResult.ok).toBe(true);
    expect(captured).not.toBeNull();
    expect(captured!.round.phase).toBe(GamePhase.Playing);
    expect(runtime.phase()).toBe('playing');

    const restored = restoreRound(storage, keys);
    expect(restored).not.toBeNull();
    expect(restored!.state).toEqual(captured!.round);
    expect(restored!.heroSeat).toBe(captured!.heroSeat);
    expect(restored!.bidMultiplier).toBe(captured!.bidMultiplier);
    expect(restored!.events).toEqual(captured!.events);

    const finished: RoundFinishInput[] = [];
    const resumed = resumeRoundRuntime(
      restored!,
      config({ seed, heroSeat, onSettled: (finish) => finished.push(finish) }),
    );
    await driveToSettled(resumed);

    expect(resumed.phase()).toBe('settled');
    expect(finished).toHaveLength(1);
    const settlement = resumed.settlement();
    expect(settlement).not.toBeNull();
    expect(settlement!.scores[0] + settlement!.scores[1] + settlement!.scores[2]).toBe(0);

    const aggregate = commitFinishedRound(storage, keys, { finish: finished[0], heroSeat, playedAt: seed * 1000 + 1 });
    const record = aggregate.records.entries[0];
    expect(aggregate.stats.rounds).toBe(1);
    expect(aggregate.records.entries).toHaveLength(1);
    expect(record.heroSeat).toBe(heroSeat);
    expect(record.heroScore).toBe(settlement!.scores[heroSeat]);
    expect(aggregate.stats.netScore).toBe(record.heroScore);
    expect(heroWon(finished[0], heroSeat) ? record.heroScore > 0 : record.heroScore < 0).toBe(true);
    expect(storage.getItem(keys.save)).toBeNull();
  });
});
