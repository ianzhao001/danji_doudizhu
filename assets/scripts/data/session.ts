/**
 * M5-13 单局会话持久化编排。纯逻辑、注入 StorageLike，不引用浏览器全局。
 */

import type { FlowResult } from '../flow';
import { resumeRound, type GameEvent, type ResumeSnapshot, type RoundState, type SeatIndex } from '../game';
import { applyFinishedRound } from './aggregate';
import { emptyRecords, migrateRecords, type RecordsState } from './records';
import { SAVE_VERSION, type SaveSlot } from './save';
import { loadSave, removeSave, saveSave } from './saveStorage';
import { emptyStats, type MatchStats } from './stats';
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
  return slot === null ? null : resumeRound(slot);
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
    return emptyRecords();
  }
}

export function commitFinishedRound(
  storage: StorageLike,
  keys: SessionKeys,
  args: { result: FlowResult; heroSeat: SeatIndex; playedAt: number },
): { stats: MatchStats; records: RecordsState } {
  const currentStats = loadStats(storage, keys.stats);
  const currentRecords = loadRecords(storage, keys.records);
  const next = applyFinishedRound(currentStats, currentRecords, args.result, args.heroSeat, args.playedAt);

  storage.setItem(keys.stats, serializeStats(next.stats));
  storage.setItem(keys.records, JSON.stringify(next.records));
  removeSave(storage, keys.save);

  return next;
}
