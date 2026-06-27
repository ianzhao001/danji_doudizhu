/**
 * M5-09 对局历史记录纯模型。架构落桩——实现方实现函数体，使 test/data/records.test.ts 转绿。
 * 规则见 coordination/tasks/M5-09-records-model.md。纯函数、不可变，禁止 import `cc`。
 */

import { Side, type SeatIndex, type Spring } from '../game';

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

const SEATS = [0, 1, 2] as const;
const SPRINGS: Spring[] = ['none', 'spring', 'anti-spring'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSeat(value: unknown): value is SeatIndex {
  return SEATS.includes(value as SeatIndex);
}

function positiveIntOrDefault(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 ? value : fallback;
}

function nonNegIntOrDefault(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : fallback;
}

function intOrDefault(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) ? value : fallback;
}

function sideOrDefault(value: unknown): Side {
  return value === Side.Landlord || value === Side.Farmer ? value : Side.Farmer;
}

function springOrDefault(value: unknown): Spring {
  return SPRINGS.includes(value as Spring) ? (value as Spring) : 'none';
}

function migrateEntry(value: unknown): RecordEntry | null {
  if (!isRecord(value)) return null;
  return {
    heroSeat: isSeat(value.heroSeat) ? value.heroSeat : 0,
    landlord: isSeat(value.landlord) ? value.landlord : 0,
    winner: sideOrDefault(value.winner),
    multiplier: positiveIntOrDefault(value.multiplier, 1),
    bombs: nonNegIntOrDefault(value.bombs, 0),
    spring: springOrDefault(value.spring),
    heroScore: intOrDefault(value.heroScore, 0),
    playedAt: nonNegIntOrDefault(value.playedAt, 0),
  };
}

export function emptyRecords(): RecordsState {
  return { version: RECORDS_VERSION, entries: [] };
}

export function appendRecord(records: RecordsState, entry: RecordEntry): RecordsState {
  const entries = [...records.entries, entry].slice(-MAX_RECORDS);
  return { version: RECORDS_VERSION, entries };
}

export function recentRecords(records: RecordsState, n: number): RecordEntry[] {
  return records.entries.slice().reverse().slice(0, Math.max(0, n));
}

export function migrateRecords(raw: unknown): RecordsState {
  if (!isRecord(raw) || !Array.isArray(raw.entries)) return emptyRecords();
  const entries = raw.entries
    .map(migrateEntry)
    .filter((entry): entry is RecordEntry => entry !== null)
    .slice(-MAX_RECORDS);
  return { version: RECORDS_VERSION, entries };
}
