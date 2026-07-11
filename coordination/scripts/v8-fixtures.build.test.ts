/**
 * V8 verify-only fixture builder. Run:
 *   cd test && npx vitest run --dir ../coordination/scripts v8-fixtures.build.test.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import { SAVE_VERSION, deserializeSave, serializeSave } from '../../assets/scripts/data/save';
import { restoreRound, type SessionKeys } from '../../assets/scripts/data/session';
import { memoryStorage } from '../../assets/scripts/runtime/storage-adapter';
import { startRoundRuntime, type RoundRuntime } from '../../assets/scripts/flow/round-runtime';
import type { Clock } from '../../assets/scripts/flow';
import {
  GamePhase,
  Side,
  type GameEvent,
  type RoundState,
  type SeatIndex,
} from '../../assets/scripts/game';
import { Category, Rank, Suit, legalFollows, recognize, type Card } from '../../assets/scripts/rules';
import { deriveFollowUx } from '../../assets/scripts/ui/follow-ux';
import { deriveLastPlays } from '../../assets/scripts/ui/last-play-view';
import { rebuildRecentEvents } from '../../assets/scripts/ui/resume-rebuild';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../reports/V8-evidence/fixtures');
const V8_SEED = 20260705;

function c(rank: Rank, suit: Suit = Suit.Spade): Card {
  return { rank, suit: rank >= Rank.SmallJoker ? Suit.Joker : suit };
}

function immediateClock(): Clock {
  return { sleep: async () => undefined };
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function snapshotFromRound(round: RoundState, heroSeat: SeatIndex = 0) {
  const seat = round.seats.find((row) => row.index === heroSeat);
  return {
    phase: round.phase,
    turn: round.turn,
    landlord: round.landlord,
    top: round.top,
    viewerHand: seat?.hand,
    handCounts: round.seats.map((row) => row.hand.length) as [number, number, number],
    winner: round.winner,
  };
}

function lastPlaysDigest(events: GameEvent[]): string {
  const recent = events.slice(-12);
  const rows = deriveLastPlays(recent);
  return rows.map((row) => `${row.seat}:${row.kind ?? 'none'}:${row.cards.length}:${row.text}`).join('|');
}

function eventsDigest(events: GameEvent[]): string {
  return events.slice(-12).map((event) => {
    if (event.type === 'play') return `play:${event.seat}:${event.pattern.category}:${event.pattern.cards.length}`;
    if (event.type === 'pass') return `pass:${event.seat}`;
    if (event.type === 'bomb') return `bomb:${event.seat}`;
    if (event.type === 'rocket') return `rocket:${event.seat}`;
    if (event.type === 'win') return `win:${event.seat}`;
    return event.type;
  }).join('|');
}

function assertAllCardsValid(round: RoundState): void {
  for (const seat of round.seats) {
    for (const card of seat.hand) {
      expect(typeof card.rank).toBe('number');
      expect(card.rank).toBeGreaterThanOrEqual(Rank.R3);
      expect(card.rank).toBeLessThanOrEqual(Rank.BigJoker);
      expect(typeof card.suit).toBe('string');
    }
  }
  if (round.top) {
    for (const card of round.top.pattern.cards) {
      expect(typeof card.rank).toBe('number');
    }
  }
}

function assertRestoreRound(json: string, label: string): void {
  const storage = memoryStorage();
  const keys: SessionKeys = { save: 'doudizhu.save', stats: 'doudizhu.stats', records: 'doudizhu.records' };
  storage.setItem(keys.save, json);
  const restored = restoreRound(storage, keys);
  expect(restored, `${label} restoreRound`).not.toBeNull();
}

function assertFixture(
  json: string,
  label: string,
  assertRound: (round: RoundState, slot: ReturnType<typeof deserializeSave>) => void,
): ReturnType<typeof deserializeSave> {
  const slot = deserializeSave(json);
  assertAllCardsValid(slot.round);
  assertRound(slot.round, slot);
  return slot;
}

function playingRound(overrides: Partial<RoundState> = {}): RoundState {
  return {
    phase: GamePhase.Playing,
    landlord: 0,
    seats: [
      { index: 0, hand: [c(Rank.R3), c(Rank.R4), c(Rank.R5), c(Rank.R6), c(Rank.R7)] },
      { index: 1, hand: [c(Rank.R8)] },
      { index: 2, hand: [c(Rank.R9), c(Rank.R10), c(Rank.J)] },
    ],
    turn: 0,
    top: null,
    passesInARow: 0,
    winner: null,
    bombsPlayed: 1,
    ...overrides,
  };
}

function slot(round: RoundState, events: GameEvent[], heroSeat: SeatIndex = 0, bidMultiplier = 4): string {
  return serializeSave({
    version: SAVE_VERSION,
    savedAt: Date.now(),
    round,
    heroSeat,
    bidMultiplier,
    events,
  });
}

function writeFixture(name: string, json: string): void {
  writeFileSync(path.join(OUT, name), json);
}

async function driveToPlaying(runtime: RoundRuntime, maxSteps = 120): Promise<void> {
  for (let step = 0; step < maxSteps; step += 1) {
    await flush();
    if (runtime.phase() === 'playing') return;
    if (runtime.phase() === 'settled' || runtime.phase() === 'disposed') {
      throw new Error(`runtime reached ${runtime.phase()} before playing`);
    }
    if (!runtime.isPlayerTurn()) continue;
    const inputs = runtime.legalInputs();
    if (!inputs?.length) continue;
    const bid = inputs.find((input) => input.kind === 'bid' && input.action.type === 'call')
      ?? inputs.find((input) => input.kind === 'bid' && input.action.type === 'pass')
      ?? inputs[0];
    const result = await runtime.submitPlayerAction(bid);
    expect(result.ok).toBe(true);
  }
  throw new Error('failed to reach playing phase');
}

async function buildResumeLivePlan(): Promise<{
  resumeJson: string;
  plan: {
    seed: number;
    heroSeat: SeatIndex;
    steps: Array<{ type: string; count?: number; cardKeys?: string[] }>;
    resumeDigest: string;
    liveDigest: string;
    eventsDigest: string;
    lastPlaysDigest: string;
    phase: string;
    turn: number;
    eventCount: number;
  };
}> {
  let lastPersist: {
    round: RoundState;
    heroSeat: SeatIndex;
    bidMultiplier: number;
    events: GameEvent[];
  } | null = null;

  const runtime = startRoundRuntime({
    seed: V8_SEED,
    heroSeat: 0,
    levels: [AiLevel.Simple, AiLevel.Simple, AiLevel.Simple],
    thinkingDelayMs: 0,
    clock: immediateClock(),
    persist: (payload) => {
      lastPersist = {
        round: JSON.parse(JSON.stringify(payload.round)) as RoundState,
        heroSeat: payload.heroSeat,
        bidMultiplier: payload.bidMultiplier,
        events: JSON.parse(JSON.stringify(payload.events)) as GameEvent[],
      };
    },
  });

  const collected: GameEvent[] = [];
  const steps: Array<{ type: string; count?: number }> = [{ type: 'to-playing' }];
  runtime.onEvent((event) => {
    if (event.type === 'round') collected.push(event.event);
  });

  const eventCount = () => lastPersist?.events.length ?? collected.length;

  await driveToPlaying(runtime);

  if (runtime.isPlayerTurn()) {
    const snap = runtime.currentSnapshot();
    const leadInputs = runtime.legalInputs();
    const leadPlay = leadInputs?.find((input) => input.kind === 'play' && input.action.type === 'play');
    if (leadPlay && !snap?.top) {
      steps.push({ type: 'hero-play-first-legal' });
      const leadResult = await runtime.submitPlayerAction(leadPlay);
      expect(leadResult.ok).toBe(true);
      for (let step = 0; step < 80; step += 1) await flush();
    }
  }

  for (let step = 0; step < 300; step += 1) {
    await flush();
    if (runtime.phase() !== 'playing') break;
    if (!runtime.isPlayerTurn()) continue;
    const snap = runtime.currentSnapshot();
    const inputs = runtime.legalInputs();
    const passInput = inputs?.find((input) => input.kind === 'play' && input.action.type === 'pass');
    if (passInput && snap?.top && eventCount() >= 2) {
      steps.push({ type: 'wait-until-pass-ready' });
      steps.push({ type: 'hero-pass' });
      const passResult = await runtime.submitPlayerAction(passInput);
      expect(passResult.ok).toBe(true);
      break;
    }
    const playInput = inputs?.find((input) => input.kind === 'play' && input.action.type === 'play');
    if (playInput) {
      steps.push({ type: 'hero-play-first-legal' });
      const playResult = await runtime.submitPlayerAction(playInput);
      expect(playResult.ok).toBe(true);
      continue;
    }
    break;
  }

  for (let step = 0; step < 200; step += 1) await flush();
  expect(lastPersist).not.toBeNull();

  const liveEvents = lastPersist!.events.slice();
  expect(liveEvents.length).toBeGreaterThanOrEqual(2);
  expect(liveEvents.some((event) => event.type === 'pass' && event.seat === 0)).toBe(true);
  steps.push({ type: 'sync-event-count', count: liveEvents.length });

  const resumeJson = serializeSave({
    version: SAVE_VERSION,
    savedAt: Date.now(),
    round: lastPersist!.round,
    heroSeat: lastPersist!.heroSeat,
    bidMultiplier: lastPersist!.bidMultiplier,
    events: lastPersist!.events,
  });

  const resumeSlot = deserializeSave(resumeJson);
  const digest = eventsDigest(liveEvents);
  const playsDigest = lastPlaysDigest(liveEvents);

  const plan = {
    seed: V8_SEED,
    heroSeat: 0 as SeatIndex,
    steps,
    resumeDigest: digest,
    liveDigest: digest,
    eventsDigest: digest,
    lastPlaysDigest: playsDigest,
    phase: resumeSlot.round.phase,
    turn: resumeSlot.round.turn,
    eventCount: resumeSlot.events?.length ?? 0,
  };

  expect(eventsDigest(resumeSlot.events ?? [])).toBe(digest);
  expect(rebuildRecentEvents(resumeSlot.events ?? []).length).toBeGreaterThan(0);
  expect(deriveLastPlays(resumeSlot.events ?? []).some((row) => row.kind === 'play')).toBe(true);

  return { resumeJson, plan };
}

describe('V8 fixture build', () => {
  it('writes JSON fixtures for capture harness', async () => {
    mkdirSync(OUT, { recursive: true });

    const topPair2 = recognize([c(Rank.R2), c(Rank.R2, Suit.Heart)])!;
    const mustPassEvents: GameEvent[] = [
      { type: 'play', seat: 1, pattern: recognize([c(Rank.K)])! },
      { type: 'play', seat: 2, pattern: recognize([c(Rank.Q), c(Rank.Q, Suit.Heart)])! },
      { type: 'play', seat: 0, pattern: recognize([c(Rank.J)])! },
      { type: 'play', seat: 1, pattern: topPair2 },
    ];
    const mustPassJson = slot(
      playingRound({
        turn: 0,
        top: { seat: 1, pattern: topPair2 },
        seats: [
          { index: 0, hand: [c(Rank.R3), c(Rank.R4), c(Rank.R5)] },
          { index: 1, hand: [c(Rank.R7)] },
          { index: 2, hand: [c(Rank.R8), c(Rank.R9), c(Rank.R10)] },
        ],
      }),
      mustPassEvents,
    );
    writeFixture('must-pass.json', mustPassJson);
    assertFixture(mustPassJson, 'must-pass', (round) => {
      expect(round.phase).toBe(GamePhase.Playing);
      expect(round.turn).toBe(0);
      expect(round.top?.pattern.category).toBe(Category.Pair);
      const ux = deriveFollowUx({ snapshot: snapshotFromRound(round) });
      expect(ux.mustPass).toBe(true);
      expect(legalFollows(round.seats[0]!.hand, round.top!.pattern).length).toBe(0);
    });

    const regularEvents: GameEvent[] = [
      { type: 'play', seat: 1, pattern: recognize([c(Rank.K)])! },
      { type: 'play', seat: 2, pattern: recognize([c(Rank.Q), c(Rank.Q, Suit.Heart)])! },
      { type: 'play', seat: 0, pattern: recognize([c(Rank.J)])! },
      { type: 'bomb', seat: 1 },
      { type: 'play', seat: 1, pattern: recognize([c(Rank.R5), c(Rank.R5, Suit.Heart), c(Rank.R5, Suit.Club), c(Rank.R5, Suit.Diamond)])! },
    ];
    const miniRegularJson = slot(playingRound({ turn: 0, bombsPlayed: 2 }), regularEvents);
    writeFixture('mini-regular.json', miniRegularJson);
    assertFixture(miniRegularJson, 'mini-regular', (round, saveSlot) => {
      expect(round.phase).toBe(GamePhase.Playing);
      expect(round.bombsPlayed).toBeGreaterThanOrEqual(2);
      expect(saveSlot.events?.some((event) => event.type === 'bomb')).toBe(true);
      expect(saveSlot.events?.some((event) => event.type === 'play' && event.pattern.category === Category.Bomb)).toBe(true);
      expect(round.seats[0]!.hand.length).toBeGreaterThanOrEqual(4);
    });

    const straight12 = [
      c(Rank.R3), c(Rank.R4), c(Rank.R5), c(Rank.R6), c(Rank.R7),
      c(Rank.R8), c(Rank.R9), c(Rank.R10), c(Rank.J), c(Rank.Q),
      c(Rank.K), c(Rank.A),
    ];
    const straightPattern = recognize(straight12)!;
    expect(straightPattern.category).toBe(Category.Straight);
    expect(straightPattern.length).toBe(12);
    const straightJson = slot(
      playingRound({
        turn: 0,
        top: { seat: 2, pattern: straightPattern },
        seats: [
          { index: 0, hand: [c(Rank.R3), c(Rank.R4), c(Rank.R5)] },
          { index: 1, hand: [c(Rank.R6), c(Rank.R7)] },
          { index: 2, hand: [c(Rank.R2), c(Rank.SmallJoker)] },
        ],
      }),
      [{ type: 'play', seat: 2, pattern: straightPattern }],
    );
    writeFixture('straight-12.json', straightJson);
    assertFixture(straightJson, 'straight-12', (round, saveSlot) => {
      expect(round.phase).toBe(GamePhase.Playing);
      expect(round.top?.pattern.category).toBe(Category.Straight);
      expect(round.top?.pattern.cards.length).toBe(12);
      const seat2Play = deriveLastPlays(saveSlot.events ?? []).find((row) => row.seat === 2);
      expect(seat2Play?.cards.length).toBe(12);
    });

    const alertsJson = slot(
      playingRound({
        seats: [
          { index: 0, hand: [c(Rank.R3)] },
          { index: 1, hand: [c(Rank.R4), c(Rank.R5)] },
          { index: 2, hand: [c(Rank.R6), c(Rank.R7), c(Rank.R8), c(Rank.R9), c(Rank.R10)] },
        ],
        turn: 0,
      }),
      [{ type: 'play', seat: 2, pattern: recognize([c(Rank.R6)])! }],
    );
    writeFixture('alerts.json', alertsJson);
    assertFixture(alertsJson, 'alerts', (round) => {
      expect(round.phase).toBe(GamePhase.Playing);
      const ux = deriveFollowUx({ snapshot: snapshotFromRound(round) });
      expect(ux.alerts.some((alert) => alert.kind === 'lastOne' && alert.seat === 0)).toBe(true);
      expect(ux.alerts.some((alert) => alert.kind === 'lastTwo' && alert.seat === 1)).toBe(true);
    });

    const { resumeJson, plan } = await buildResumeLivePlan();
    writeFixture('resume.json', resumeJson);
    assertFixture(resumeJson, 'resume', (round, saveSlot) => {
      expect(round.phase).toBe(GamePhase.Playing);
      expect(saveSlot.events?.length ?? 0).toBeGreaterThanOrEqual(plan.eventCount);
      expect(lastPlaysDigest(saveSlot.events ?? [])).toBe(plan.lastPlaysDigest);
      expect(eventsDigest(saveSlot.events ?? [])).toBe(plan.eventsDigest);
    });
    writeFileSync(path.join(OUT, 'resume-live-plan.json'), JSON.stringify(plan, null, 2));

    const settledJson = serializeSave({
      version: SAVE_VERSION,
      savedAt: Date.now(),
      round: {
        ...playingRound({
          phase: GamePhase.Settled,
          winner: Side.Landlord,
          seats: [
            { index: 0, hand: [] },
            { index: 1, hand: [c(Rank.R3)] },
            { index: 2, hand: [] },
          ],
        }),
      },
      heroSeat: 0,
      bidMultiplier: 8,
      events: [
        { type: 'play', seat: 1, pattern: recognize([c(Rank.R9)])! },
        { type: 'play', seat: 2, pattern: recognize([c(Rank.R8), c(Rank.R8, Suit.Heart)])! },
        { type: 'pass', seat: 0 },
        { type: 'win', seat: 0, side: Side.Landlord },
      ],
    });
    writeFixture('settled.json', settledJson);
    assertFixture(settledJson, 'settled', (round) => {
      expect(round.phase).toBe(GamePhase.Settled);
      expect(round.winner).toBe(Side.Landlord);
    });
    assertRestoreRound(settledJson, 'settled');
  });

  it('writes natural-playing seed hint', () => {
    writeFileSync(path.join(OUT, 'natural-seed.json'), JSON.stringify({ seed: V8_SEED }, null, 2));
    expect(true).toBe(true);
  });
});
