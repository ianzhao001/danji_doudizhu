/**
 * M5-04 断局存档槽位纯模型。架构落桩——实现方实现函数体，使 test/data/save.test.ts 转绿。
 * 规则见 coordination/tasks/M5-04-save-slot.md。纯函数、确定性，禁止 import `cc`、禁止本地 IO。
 * 复用 game 层已校验的 serializeRound/deserializeRound 做内层 round 编解码。
 */

import type { GameEvent, RoundState, SeatIndex } from '../game';
import { deserializeRound, serializeRound } from '../game/serialize';

export interface SaveSlot {
  version: number;
  savedAt: number;
  round: RoundState;
  heroSeat?: SeatIndex;
  bidMultiplier?: number;
  events?: GameEvent[];
}

export const SAVE_VERSION = 1;

function corrupted(reason: string): never {
  throw new Error(`corrupted save slot: ${reason}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function serializeSave(slot: SaveSlot): string {
  const wire: Record<string, unknown> = {
    version: SAVE_VERSION,
    savedAt: slot.savedAt,
    round: serializeRound(slot.round),
  };
  if (slot.heroSeat !== undefined) wire.heroSeat = slot.heroSeat;
  if (slot.bidMultiplier !== undefined) {
    wire.bidMultiplier = Number.isInteger(slot.bidMultiplier) && slot.bidMultiplier >= 1 ? slot.bidMultiplier : 1;
  }
  if (slot.events !== undefined) wire.events = slot.events;
  return JSON.stringify(wire);
}

function isSeat(value: unknown): value is SeatIndex {
  return value === 0 || value === 1 || value === 2;
}

function positiveIntOrDefault(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 ? value : fallback;
}

export function deserializeSave(json: string): SaveSlot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    corrupted('invalid JSON');
  }
  if (!isRecord(parsed)) corrupted('expected object');
  if (parsed.version !== SAVE_VERSION) corrupted(`unsupported version: ${String(parsed.version)}`);
  if (typeof parsed.savedAt !== 'number' || !Number.isInteger(parsed.savedAt) || parsed.savedAt < 0) {
    corrupted('savedAt must be a non-negative integer');
  }
  if (parsed.heroSeat !== undefined && !isSeat(parsed.heroSeat)) corrupted('heroSeat must be a valid seat');
  if (parsed.events !== undefined && !Array.isArray(parsed.events)) corrupted('events must be an array');

  const roundJson = typeof parsed.round === 'string' ? parsed.round : JSON.stringify(parsed.round);
  const slot: SaveSlot = {
    version: SAVE_VERSION,
    savedAt: parsed.savedAt,
    round: deserializeRound(roundJson),
  };
  if (parsed.heroSeat !== undefined) slot.heroSeat = parsed.heroSeat;
  if (parsed.bidMultiplier !== undefined) slot.bidMultiplier = positiveIntOrDefault(parsed.bidMultiplier, 1);
  if (parsed.events !== undefined) slot.events = parsed.events as GameEvent[];
  return slot;
}
