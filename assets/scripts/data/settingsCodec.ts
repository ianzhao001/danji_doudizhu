/**
 * M5-05 本地设置编解码（localStorage 前置）。架构落桩——实现方实现函数体，
 * 使 test/data/settings-codec.test.ts 转绿。规则见 coordination/tasks/M5-05-settings-codec.md。
 * 纯字符串编解码、复用 migrateSettings 容错、禁止 import `cc`、无本地 IO。
 */

import { type Settings, defaultSettings, migrateSettings } from './settings';

export function serializeSettings(s: Settings): string {
  throw new Error('M5-05 not implemented');
}

export function deserializeSettings(json: string): Settings {
  throw new Error('M5-05 not implemented');
}

// 复用引用，避免未使用告警（实现方删除本行即可）
void defaultSettings;
void migrateSettings;
