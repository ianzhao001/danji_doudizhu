/**
 * M5-04 断局存档槽位纯模型。架构落桩——实现方实现函数体，使 test/data/save.test.ts 转绿。
 * 规则见 coordination/tasks/M5-04-save-slot.md。纯函数、确定性，禁止 import `cc`、禁止本地 IO。
 * 复用 game 层已校验的 serializeRound/deserializeRound 做内层 round 编解码。
 */

import type { RoundState } from '../game';
import { deserializeRound, serializeRound } from '../game/serialize';

export interface SaveSlot {
  version: number;
  savedAt: number;
  round: RoundState;
}

export const SAVE_VERSION = 1;

function corrupted(reason: string): never {
  throw new Error(`corrupted save slot: ${reason}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function serializeSave(slot: SaveSlot): string {
  return JSON.stringify({
    version: slot.version,
    savedAt: slot.savedAt,
    round: serializeRound(slot.round),
  });
}

export function deserializeSave(json: string): SaveSlot {
  const parsed: unknown = JSON.parse(json);
  if (!isRecord(parsed)) corrupted('expected object');
  if (parsed.version !== SAVE_VERSION) corrupted(`unsupported version: ${String(parsed.version)}`);
  if (typeof parsed.savedAt !== 'number' || !Number.isFinite(parsed.savedAt)) corrupted('savedAt must be a finite number');

  const roundJson = typeof parsed.round === 'string' ? parsed.round : JSON.stringify(parsed.round);
  return {
    version: SAVE_VERSION,
    savedAt: parsed.savedAt,
    round: deserializeRound(roundJson),
  };
}
