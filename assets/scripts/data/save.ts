/**
 * M5-04 断局存档槽位纯模型。架构落桩——实现方实现函数体，使 test/data/save.test.ts 转绿。
 * 规则见 coordination/tasks/M5-04-save-slot.md。纯函数、确定性，禁止 import `cc`、禁止本地 IO。
 * 复用 game 层已校验的 serializeRound/deserializeRound 做内层 round 编解码。
 */

import type { RoundState } from '../game';

export interface SaveSlot {
  version: number;
  savedAt: number;
  round: RoundState;
}

export const SAVE_VERSION = 1;

export function serializeSave(slot: SaveSlot): string {
  throw new Error('M5-04 not implemented');
}

export function deserializeSave(json: string): SaveSlot {
  throw new Error('M5-04 not implemented');
}
