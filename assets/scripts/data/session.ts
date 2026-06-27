/**
 * M5-13 单局会话持久化编排。纯逻辑、注入 StorageLike，不引用浏览器全局。
 */

import { resumeRound, type GameEvent, type ResumeSnapshot, type RoundFinishInput, type RoundState, type SeatIndex } from '../game';
import { applyFinishedRound, toRecordEntry, toRoundOutcome } from './aggregate';
import { emptyRecords, migrateRecords, serializeRecords, type RecordEntry, type RecordsState } from './records';
import { SAVE_VERSION, toResumePayload, type SaveSlot } from './save';
import { loadSave, removeSave, saveSave } from './saveStorage';
import { emptyStats, recordRound, type MatchStats } from './stats';
import { deserializeStats, serializeStats } from './statsCodec';
import type { StorageLike } from './settingsStorage';

export interface SessionKeys {
  save: string;
  stats: string;
  records: string;
}

export function persistRound(
  storage: StorageLike,
  keys: SessionKeys,
  args: { round: RoundState; heroSeat: SeatIndex; bidMultiplier: number; events: GameEvent[]; savedAt?: number },
): void {
  const slot: SaveSlot = {
    version: SAVE_VERSION,
    savedAt: args.savedAt ?? 0,
    round: args.round,
    heroSeat: args.heroSeat,
    bidMultiplier: args.bidMultiplier,
    events: args.events,
  };
  saveSave(storage, keys.save, slot);
}

export function restoreRound(storage: StorageLike, keys: SessionKeys): ResumeSnapshot | null {
  const slot = loadSave(storage, keys.save);
  return slot === null ? null : resumeRound(toResumePayload(slot));
}

function loadStats(storage: StorageLike, key: string): MatchStats {
  const raw = storage.getItem(key);
  return raw === null ? emptyStats() : deserializeStats(raw);
}

function loadRecords(storage: StorageLike, key: string): RecordsState {
  const raw = storage.getItem(key);
  if (raw === null) return emptyRecords();
  try {
    return migrateRecords(JSON.parse(raw));
  } catch {
    console.warn(`corrupted records data for key "${key}"`);
    return emptyRecords();
  }
}

type CommitFinishedRoundArgs =
  | { finish: RoundFinishInput; heroSeat: SeatIndex; playedAt: number }
  | { result: RoundFinishInput; heroSeat: SeatIndex; playedAt: number };

function finishOf(args: CommitFinishedRoundArgs): RoundFinishInput {
  return 'finish' in args ? args.finish : args.result;
}

function sameRecord(a: RecordEntry, b: RecordEntry): boolean {
  return (
    a.heroSeat === b.heroSeat &&
    a.landlord === b.landlord &&
    a.winner === b.winner &&
    a.multiplier === b.multiplier &&
    a.bombs === b.bombs &&
    a.spring === b.spring &&
    a.heroScore === b.heroScore &&
    a.playedAt === b.playedAt
  );
}

export function commitFinishedRound(
  storage: StorageLike,
  keys: SessionKeys,
  args: CommitFinishedRoundArgs,
): { stats: MatchStats; records: RecordsState } {
  const currentStats = loadStats(storage, keys.stats);
  const currentRecords = loadRecords(storage, keys.records);
  const finish = finishOf(args);
  const record = toRecordEntry(finish, args.heroSeat, args.playedAt);
  const alreadyRecorded = currentRecords.entries.some((entry) => sameRecord(entry, record));
  const next = alreadyRecorded
    ? {
        stats:
          currentRecords.entries.length > currentStats.rounds
            ? recordRound(currentStats, toRoundOutcome(finish, args.heroSeat))
            : currentStats,
        records: currentRecords,
      }
    : applyFinishedRound(currentStats, currentRecords, finish, args.heroSeat, args.playedAt);

  removeSave(storage, keys.save);
  storage.setItem(keys.records, serializeRecords(next.records));
  storage.setItem(keys.stats, serializeStats(next.stats));

  return next;
}
