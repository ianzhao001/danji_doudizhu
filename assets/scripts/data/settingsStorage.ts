/**
 * M5-06 设置存储适配器（localStorage 前置，无浏览器依赖）。架构落桩——实现方实现函数体，
 * 使 test/data/settings-storage.test.ts 转绿。规则见 coordination/tasks/M5-06-settings-storage-adapter.md。
 * 纯逻辑、确定性、禁止 import `cc`、不引用 localStorage/window。
 */

import { type Settings, defaultSettings } from './settings';
import { serializeSettings, deserializeSettings } from './settingsCodec';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function loadSettings(storage: StorageLike, key: string): Settings {
  throw new Error('M5-06 loadSettings not implemented');
}

export function saveSettings(storage: StorageLike, key: string, s: Settings): void {
  throw new Error('M5-06 saveSettings not implemented');
}

export function removeSettings(storage: StorageLike, key: string): void {
  throw new Error('M5-06 removeSettings not implemented');
}

// 复用引用，避免未使用告警（实现方删除本行即可）
void defaultSettings;
void serializeSettings;
void deserializeSettings;
