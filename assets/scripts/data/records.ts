/**
 * M5-09 对局历史记录纯模型。架构落桩——实现方实现函数体，使 test/data/records.test.ts 转绿。
 * 规则见 coordination/tasks/M5-09-records-model.md。纯函数、不可变，禁止 import `cc`。
 */

import { type SeatIndex, type Side, type Spring } from '../game';

export interface RecordEntry {
  heroSeat: SeatIndex;
  landlord: SeatIndex;
  winner: Side;
  multiplier: number;
  bombs: number;
  spring: Spring;
  heroScore: number;
  playedAt: number;
}

export interface RecordsState {
  version: number;
  entries: RecordEntry[];
}

export const RECORDS_VERSION = 1;
export const MAX_RECORDS = 50;

export function emptyRecords(): RecordsState {
  throw new Error('M5-09 emptyRecords not implemented');
}

export function appendRecord(records: RecordsState, entry: RecordEntry): RecordsState {
  throw new Error('M5-09 appendRecord not implemented');
}

export function recentRecords(records: RecordsState, n: number): RecordEntry[] {
  throw new Error('M5-09 recentRecords not implemented');
}

export function migrateRecords(raw: unknown): RecordsState {
  throw new Error('M5-09 migrateRecords not implemented');
}
