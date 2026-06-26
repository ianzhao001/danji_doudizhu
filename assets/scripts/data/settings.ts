/**
 * M5-03 本地设置纯数据层（UI 前置）。架构落桩——实现方实现函数体，
 * 使 test/data/settings.test.ts 转绿。纯数据、确定性、禁止 import `cc`。
 * 规则见 coordination/tasks/M5-03-settings.md。difficulty 复用 ai 的 AiLevel（单一真相源）。
 */

import { AiLevel } from '../ai';

export interface Settings {
  version: number;
  difficulty: AiLevel;
  sound: boolean;
  vibration: boolean;
  animation: boolean;
}

/** 当前设置版本（迁移基准）。 */
export const SETTINGS_VERSION = 1;

/** 稳定默认设置。 */
export function defaultSettings(): Settings {
  throw new Error('M5-03 not implemented: defaultSettings');
}

/** 容错迁移：尽量恢复、不抛错，返回完整当前形 Settings。 */
export function migrateSettings(raw: unknown): Settings {
  void raw;
  throw new Error('M5-03 not implemented: migrateSettings');
}
