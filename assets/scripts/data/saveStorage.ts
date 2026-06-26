/**
 * M5-07 断局槽位存储适配器（浏览器存储前置，无浏览器依赖）。架构落桩——实现方实现函数体，
 * 使 test/data/save-storage.test.ts 转绿。规则见 coordination/tasks/M5-07-save-storage-adapter.md。
 * 纯逻辑、禁止 import `cc`、不引用浏览器全局。
 * 本文件独立定义 StorageLike（与 M5-06 settingsStorage 形状一致；合并后由架构统一为单一真相源）。
 */

import { type SaveSlot, serializeSave, deserializeSave } from './save';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

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
