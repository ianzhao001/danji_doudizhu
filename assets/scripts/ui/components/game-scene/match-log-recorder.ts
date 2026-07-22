/** sota2-R4 B3 match-log assembly layer. All time and storage dependencies are injected. */

import type { AiDecisionDraft } from '../../../ai/decision-log';
import {
  MATCH_LOG_VERSION,
  appendEntry,
  loadMatchLog,
  saveMatchLog,
  type AiDecisionDiag,
  type MatchLogEntry,
} from '../../../data/match-log';
import { GamePhase, type GameEvent, type RoundFinishInput, type SeatIndex } from '../../../game';
import type { Card } from '../../../rules';
import type { StorageLike } from '../../../data/settingsStorage';

export interface MatchLogRecorderOptions {
  storage: StorageLike;
  now: () => number;
  seed: number;
  resumed: boolean;
  difficulty: string;
  heroSeat: SeatIndex;
}

export interface MatchLogPersistPayload {
  round: unknown;
  heroSeat: SeatIndex;
  bidMultiplier: number;
  events: GameEvent[];
}

interface OpeningSnapshot {
  landlord: SeatIndex;
  initialHands: [Card[], Card[], Card[]];
  bottom: Card[];
}

interface RecorderBuffer extends OpeningSnapshot {
  startedAt: number;
  bidMultiplier: number;
  events: GameEvent[];
  ai: AiDecisionDiag[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSeatIndex(value: unknown): value is SeatIndex {
  return value === 0 || value === 1 || value === 2;
}

function openingSnapshot(round: unknown): OpeningSnapshot | null {
  if (!isObject(round) || round.phase !== GamePhase.Playing || !isSeatIndex(round.landlord)) return null;
  if (!Array.isArray(round.seats) || round.seats.length !== 3) return null;

  const hands: Array<Card[] | null> = [null, null, null];
  for (const seat of round.seats) {
    if (!isObject(seat) || !isSeatIndex(seat.index) || !Array.isArray(seat.hand)) return null;
    hands[seat.index] = (seat.hand as Card[]).slice();
  }
  if (hands.some((hand) => hand === null)) return null;

  const bottom = round.bottom === null
    ? []
    : Array.isArray(round.bottom)
      ? (round.bottom as Card[]).slice()
      : null;
  if (bottom === null) return null;

  return {
    landlord: round.landlord,
    initialHands: [hands[0]!, hands[1]!, hands[2]!],
    bottom,
  };
}

function copyDraft(draft: AiDecisionDraft, eventIndex: number): AiDecisionDiag {
  const diag: AiDecisionDiag = {
    seat: draft.seat,
    eventIndex,
    path: draft.path,
  };
  if (draft.topK !== undefined) diag.topK = draft.topK.map((item) => ({ ...item }));
  if (draft.voteGap !== undefined) diag.voteGap = draft.voteGap;
  if (draft.worlds !== undefined) diag.worlds = draft.worlds;
  if (draft.elapsedMs !== undefined) diag.elapsedMs = draft.elapsedMs;
  return diag;
}

function uniqueLogId(entries: readonly MatchLogEntry[], startedAt: number, seed: number): string {
  const base = `${startedAt}-${seed}`;
  if (!entries.some((entry) => entry.logId === base)) return base;
  let suffix = 2;
  while (entries.some((entry) => entry.logId === `${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function createMatchLogRecorder(options: MatchLogRecorderOptions): {
  onPersist(payload: MatchLogPersistPayload): void;
  onSettled(finish: RoundFinishInput): string | null;
  onDiag(draft: AiDecisionDraft): void;
} {
  let buffer: RecorderBuffer | null = null;
  let priorEventCount = 0;
  let settled = false;
  let pendingDiagnostics: AiDecisionDraft[] = [];

  const onPersist = (payload: MatchLogPersistPayload): void => {
    if (settled) return;
    if (buffer === null && (payload.events.length === 0 || options.resumed)) {
      const opening = openingSnapshot(payload.round);
      if (opening !== null) {
        buffer = {
          ...opening,
          startedAt: options.now(),
          bidMultiplier: payload.bidMultiplier,
          events: [],
          ai: [],
        };
      }
    }
    if (buffer === null) return;

    for (let eventIndex = priorEventCount; eventIndex < payload.events.length; eventIndex += 1) {
      const event = payload.events[eventIndex];
      if (event.type !== 'play' && event.type !== 'pass') continue;
      const draftIndex = pendingDiagnostics.findIndex((draft) => draft.seat === event.seat);
      if (draftIndex < 0) continue;
      const [draft] = pendingDiagnostics.splice(draftIndex, 1);
      buffer.ai.push(copyDraft(draft, eventIndex));
    }
    buffer.events = payload.events.slice();
    priorEventCount = payload.events.length;
  };

  const onSettled = (finish: RoundFinishInput): string | null => {
    if (settled || buffer === null) return null;
    settled = true;
    const state = loadMatchLog(options.storage);
    const entry: MatchLogEntry = {
      version: MATCH_LOG_VERSION,
      logId: uniqueLogId(state.entries, buffer.startedAt, options.seed),
      startedAt: buffer.startedAt,
      finishedAt: options.now(),
      seed: options.seed,
      resumed: options.resumed,
      difficulty: options.difficulty,
      heroSeat: options.heroSeat,
      landlord: buffer.landlord,
      bidMultiplier: buffer.bidMultiplier,
      initialHands: buffer.initialHands.map((hand) => hand.slice()) as [Card[], Card[], Card[]],
      bottom: buffer.bottom.slice(),
      events: buffer.events.slice(),
      settlement: {
        ...finish.settlement,
        scores: finish.settlement.scores.slice() as [number, number, number],
      },
      pinned: false,
      ai: buffer.ai.map((diag) => ({
        ...diag,
        topK: diag.topK?.map((item) => ({ ...item })),
      })),
    };
    const saved = saveMatchLog(options.storage, appendEntry(state, entry));
    buffer = null;
    pendingDiagnostics = [];
    priorEventCount = 0;
    return saved === 'stored' ? entry.logId : null;
  };

  const onDiag = (draft: AiDecisionDraft): void => {
    if (settled) return;
    pendingDiagnostics.push({
      ...draft,
      topK: draft.topK?.map((item) => ({ ...item })),
    });
  };

  return { onPersist, onSettled, onDiag };
}
