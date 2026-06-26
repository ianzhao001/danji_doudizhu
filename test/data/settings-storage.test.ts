/**
 * M5-06 失败测试：设置存储适配器（架构种入·不可改）。
 * 当前 settingsStorage.ts 为桩（throw not implemented）→ 应先红。
 */
import { describe, it, expect } from 'vitest';
import { loadSettings, saveSettings, removeSettings, type StorageLike } from '../../assets/scripts/data/settingsStorage';
import { defaultSettings, type Settings } from '../../assets/scripts/data/settings';
import { AiLevel } from '../../assets/scripts/ai';

function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const KEY = 'settings';

describe('M5-06 设置存储适配器', () => {
  it('save→load 往返深相等', () => {
    const storage = memoryStorage();
    const s: Settings = { version: 1, difficulty: AiLevel.Hard, sound: false, vibration: true, animation: false };
    saveSettings(storage, KEY, s);
    expect(loadSettings(storage, KEY)).toEqual(s);
  });

  it('load 空 key（getItem 返回 null）→ defaultSettings', () => {
    expect(loadSettings(memoryStorage(), KEY)).toEqual(defaultSettings());
  });

  it('saveSettings 写入的是合法 JSON（deserializeSettings 可还原）', () => {
    const storage = memoryStorage();
    const s = defaultSettings();
    saveSettings(storage, KEY, s);
    const raw = storage.getItem(KEY)!;
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('removeSettings 后 load → defaultSettings', () => {
    const storage = memoryStorage();
    saveSettings(storage, KEY, defaultSettings());
    removeSettings(storage, KEY);
    expect(loadSettings(storage, KEY)).toEqual(defaultSettings());
  });

  it('损坏字符串 → load 返回 defaultSettings（不抛错）', () => {
    const storage = memoryStorage();
    storage.setItem(KEY, 'not json');
    expect(loadSettings(storage, KEY)).toEqual(defaultSettings());
  });
});
