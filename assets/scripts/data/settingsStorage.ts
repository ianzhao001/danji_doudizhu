/**
 * M5-06 设置存储适配器（浏览器存储前置，无浏览器依赖）。架构落桩——实现方实现函数体，
 * 使 test/data/settings-storage.test.ts 转绿。规则见 coordination/tasks/M5-06-settings-storage-adapter.md。
 * 纯逻辑、确定性、禁止 import `cc`、不引用浏览器全局。
 */

import { type Settings, defaultSettings } from './settings';
import { serializeSettings, deserializeSettings } from './settingsCodec';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function loadSettings(storage: StorageLike, key: string): Settings {
  const raw = storage.getItem(key);
  return raw === null ? defaultSettings() : deserializeSettings(raw);
}

export function saveSettings(storage: StorageLike, key: string, s: Settings): void {
  storage.setItem(key, serializeSettings(s));
}

export function removeSettings(storage: StorageLike, key: string): void {
  storage.removeItem(key);
}
