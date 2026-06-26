/**
 * M5-07 断局槽位存储适配器（浏览器存储前置，无浏览器依赖）。架构落桩——实现方实现函数体，
 * 使 test/data/save-storage.test.ts 转绿。规则见 coordination/tasks/M5-07-save-storage-adapter.md。
 * 纯逻辑、禁止 import `cc`、不引用浏览器全局。
 * StorageLike 复用 settingsStorage 的单一真相源（架构合并 M5-06/07 时统一，删本地定义）。
 */

import { type SaveSlot, serializeSave, deserializeSave } from './save';
import { type StorageLike } from './settingsStorage';

export function loadSave(storage: StorageLike, key: string): SaveSlot | null {
  const raw = storage.getItem(key);
  return raw === null ? null : deserializeSave(raw);
}

export function saveSave(storage: StorageLike, key: string, slot: SaveSlot): void {
  storage.setItem(key, serializeSave(slot));
}

export function removeSave(storage: StorageLike, key: string): void {
  storage.removeItem(key);
}
