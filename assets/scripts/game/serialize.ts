/**
 * M2-04 RoundState 序列化/反序列化（为 M5 断局重开铺垫）。
 * 实现方：实现两个函数体，使 test/game/serialize.test.ts 转绿。
 * 规则见 coordination/tasks/M2-04-serialization.md。纯函数，禁止 import `cc`，禁止改签名。
 */

import type { RoundState } from './types';

const CURRENT_VERSION = 1;
const REQUIRED_STATE_FIELDS = [
  'phase',
  'landlord',
  'seats',
  'turn',
  'passesInARow',
  'winner',
  'bombsPlayed',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function assertVersionedSave(value: unknown): RoundState {
  if (!isRecord(value)) throw new Error('corrupted save data: expected object');
  if (!hasOwn(value, 'version')) throw new Error('unsupported save version: missing version');
  if (value.version !== CURRENT_VERSION) {
    throw new Error(`unsupported save version: ${String(value.version)}`);
  }
  if (!hasOwn(value, 'state') || !isRecord(value.state)) {
    throw new Error('corrupted round state: missing state');
  }

  for (const field of REQUIRED_STATE_FIELDS) {
    if (!hasOwn(value.state, field)) {
      throw new Error(`corrupted round state: missing ${field}`);
    }
  }

  return value.state as unknown as RoundState;
}

/** 序列化为字符串（往返一致、纯 JSON）。 */
export function serializeRound(state: RoundState): string {
  return JSON.stringify({ version: CURRENT_VERSION, state });
}

/** 反序列化；对非法 JSON 抛错。 */
export function deserializeRound(json: string): RoundState {
  return assertVersionedSave(JSON.parse(json));
}
