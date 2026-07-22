/**
 * sota2-R4 B1 对局记录纯内核。
 *
 * 只处理可序列化数据与 StorageLike 封套；时间、随机种子和对局内容均由上层注入。
 */

import type { GameEvent, SeatIndex } from '../game/types';
import type { Settlement } from '../game/settlement';
import { isGameEvent, isSeat } from '../game/seat';
import type { Card } from '../rules/card';
import { isCard, isRecord } from '../rules/guards';
import type { StorageLike } from './settingsStorage';
import { STORAGE_KEYS } from './storage-keys';

export const MATCH_LOG_VERSION = 1;
export const MATCH_LOG_MAX = 30;
export const MATCH_LOG_SOFT_BYTES = 1_500_000;
export const MATCH_LOG_PINNED_MAX = 10;

export interface AiDecisionDiag {
  seat: SeatIndex;
  eventIndex: number;
  path: string;
  topK?: { move: string; score: number }[];
  voteGap?: number;
  worlds?: number;
  degraded?: boolean;
  elapsedMs?: number;
}

export interface MatchLogEntry {
  version: 1;
  logId: string;
  startedAt: number;
  finishedAt: number | null;
  seed: number;
  resumed: boolean;
  difficulty: string;
  heroSeat: SeatIndex;
  landlord: SeatIndex;
  bidMultiplier: number;
  initialHands: [Card[], Card[], Card[]];
  bottom: Card[];
  events: GameEvent[];
  settlement: Settlement | null;
  pinned: boolean;
  ai: AiDecisionDiag[];
}

export interface MatchLogState {
  version: number;
  entries: MatchLogEntry[];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0;
}

function isCardArray(value: unknown): value is Card[] {
  return Array.isArray(value) && value.every(isCard);
}

function migrateSettlement(value: unknown): Settlement | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  if (!isFiniteNumber(value.multiplier) || value.multiplier < 1) return undefined;
  if (value.spring !== 'none' && value.spring !== 'spring' && value.spring !== 'anti-spring') return undefined;
  if (!isNonNegativeInteger(value.bombs)) return undefined;
  if (!Array.isArray(value.scores) || value.scores.length !== 3 || !value.scores.every(isFiniteNumber)) {
    return undefined;
  }
  return {
    multiplier: value.multiplier,
    spring: value.spring,
    bombs: value.bombs,
    scores: [value.scores[0], value.scores[1], value.scores[2]],
  };
}

function optionalFiniteNumber(value: unknown): number | undefined {
  return value === undefined ? undefined : isFiniteNumber(value) ? value : undefined;
}

function migrateAiDecision(value: unknown): AiDecisionDiag | null {
  if (!isRecord(value) || !isSeat(value.seat) || !isNonNegativeInteger(value.eventIndex)) return null;
  if (typeof value.path !== 'string') return null;

  const decision: AiDecisionDiag = {
    seat: value.seat,
    eventIndex: value.eventIndex,
    path: value.path,
  };

  if (Array.isArray(value.topK)) {
    const topK = value.topK
      .filter(
        (item): item is Record<string, unknown> =>
          isRecord(item) && typeof item.move === 'string' && isFiniteNumber(item.score),
      )
      .slice(0, 8)
      .map((item) => ({ move: item.move as string, score: item.score as number }));
    if (topK.length > 0) decision.topK = topK;
  }

  const voteGap = optionalFiniteNumber(value.voteGap);
  if (voteGap !== undefined) decision.voteGap = voteGap;
  if (isNonNegativeInteger(value.worlds)) decision.worlds = value.worlds;
  if (typeof value.degraded === 'boolean') decision.degraded = value.degraded;
  const elapsedMs = optionalFiniteNumber(value.elapsedMs);
  if (elapsedMs !== undefined && elapsedMs >= 0) decision.elapsedMs = elapsedMs;

  return decision;
}

function migrateEntry(value: unknown): MatchLogEntry | null {
  if (!isRecord(value) || value.version !== MATCH_LOG_VERSION) return null;
  if (typeof value.logId !== 'string' || value.logId.length === 0) return null;
  if (!isFiniteNumber(value.startedAt)) return null;
  if (value.finishedAt !== null && !isFiniteNumber(value.finishedAt)) return null;
  if (!isFiniteNumber(value.seed) || !Number.isInteger(value.seed)) return null;
  if (typeof value.resumed !== 'boolean' || typeof value.difficulty !== 'string') return null;
  if (!isSeat(value.heroSeat) || !isSeat(value.landlord)) return null;
  if (!isFiniteNumber(value.bidMultiplier) || value.bidMultiplier < 1) return null;
  if (!Array.isArray(value.initialHands) || value.initialHands.length !== 3 || !value.initialHands.every(isCardArray)) {
    return null;
  }
  if (!isCardArray(value.bottom)) return null;
  if (!Array.isArray(value.events) || !value.events.every(isGameEvent)) return null;
  const settlement = migrateSettlement(value.settlement);
  if (settlement === undefined || typeof value.pinned !== 'boolean' || !Array.isArray(value.ai)) return null;

  return {
    version: MATCH_LOG_VERSION,
    logId: value.logId,
    startedAt: value.startedAt,
    finishedAt: value.finishedAt,
    seed: value.seed,
    resumed: value.resumed,
    difficulty: value.difficulty,
    heroSeat: value.heroSeat,
    landlord: value.landlord,
    bidMultiplier: value.bidMultiplier,
    initialHands: [value.initialHands[0].slice(), value.initialHands[1].slice(), value.initialHands[2].slice()],
    bottom: value.bottom.slice(),
    events: value.events.slice(),
    settlement,
    pinned: value.pinned,
    ai: value.ai.map(migrateAiDecision).filter((item): item is AiDecisionDiag => item !== null),
  };
}

function enforcePinnedLimit(entries: MatchLogEntry[]): MatchLogEntry[] {
  let excess = entries.filter((entry) => entry.pinned).length - MATCH_LOG_PINNED_MAX;
  if (excess <= 0) return entries;
  return entries.map((entry) => {
    if (!entry.pinned || excess <= 0) return entry;
    excess -= 1;
    return { ...entry, pinned: false };
  });
}

function compactEntry(entry: MatchLogEntry): MatchLogEntry {
  return {
    ...entry,
    ai: entry.ai.map((decision) =>
      decision.topK === undefined ? decision : { ...decision, topK: decision.topK.slice(0, 8) },
    ),
  };
}

function serializedLength(entries: MatchLogEntry[]): number {
  try {
    return JSON.stringify({ version: MATCH_LOG_VERSION, entries }).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function oldestRemovableIndex(entries: MatchLogEntry[], keepNewest: boolean): number {
  const lastRemovable = entries.length - (keepNewest ? 1 : 0);
  return entries.findIndex((entry, index) => index < lastRemovable && !entry.pinned);
}

function trimAfterAppend(input: MatchLogEntry[]): MatchLogEntry[] {
  const entries = enforcePinnedLimit(input).slice();
  while (entries.length > MATCH_LOG_MAX) {
    const index = oldestRemovableIndex(entries, true);
    if (index < 0) break;
    entries.splice(index, 1);
  }
  while (serializedLength(entries) > MATCH_LOG_SOFT_BYTES) {
    const index = oldestRemovableIndex(entries, true);
    if (index < 0) break;
    entries.splice(index, 1);
  }
  return entries;
}

export function emptyMatchLog(): MatchLogState {
  return { version: MATCH_LOG_VERSION, entries: [] };
}

export function migrateMatchLog(raw: unknown): MatchLogState {
  if (!isRecord(raw) || raw.version !== MATCH_LOG_VERSION || !Array.isArray(raw.entries)) {
    return emptyMatchLog();
  }
  let state = emptyMatchLog();
  for (const value of raw.entries) {
    const entry = migrateEntry(value);
    if (entry !== null) state = appendEntry(state, entry);
  }
  return state;
}

export function appendEntry(state: MatchLogState, entry: MatchLogEntry): MatchLogState {
  return {
    version: MATCH_LOG_VERSION,
    entries: trimAfterAppend([...state.entries, compactEntry(entry)]),
  };
}

export function setPinned(state: MatchLogState, logId: string, pinned: boolean): MatchLogState {
  const entries = state.entries.map((entry) => (entry.logId === logId ? { ...entry, pinned } : entry));
  return {
    version: MATCH_LOG_VERSION,
    entries: enforcePinnedLimit(entries),
  };
}

export function loadMatchLog(storage: StorageLike): MatchLogState {
  try {
    const raw = storage.getItem(STORAGE_KEYS.matchLog);
    return raw === null ? emptyMatchLog() : migrateMatchLog(JSON.parse(raw));
  } catch {
    return emptyMatchLog();
  }
}

function dropOldestNonPinned(state: MatchLogState): MatchLogState {
  const index = oldestRemovableIndex(state.entries, false);
  if (index < 0) return { version: MATCH_LOG_VERSION, entries: state.entries.slice() };
  return {
    version: MATCH_LOG_VERSION,
    entries: state.entries.filter((_, entryIndex) => entryIndex !== index),
  };
}

export function saveMatchLog(storage: StorageLike, state: MatchLogState): 'stored' | 'dropped' {
  try {
    storage.setItem(STORAGE_KEYS.matchLog, JSON.stringify(state));
    return 'stored';
  } catch {
    // 配额失败只降级一次；记录功能不能把正常对局的收尾路径炸穿。
  }

  try {
    storage.setItem(STORAGE_KEYS.matchLog, JSON.stringify(dropOldestNonPinned(state)));
    return 'stored';
  } catch {
    return 'dropped';
  }
}
