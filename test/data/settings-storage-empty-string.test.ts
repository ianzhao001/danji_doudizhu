import { describe, expect, it } from 'vitest';

import { defaultSettings } from '../../assets/scripts/data/settings';
import { loadSettings, type StorageLike } from '../../assets/scripts/data/settingsStorage';

function storageReturning(value: string | null): StorageLike {
  return {
    getItem: () => value,
    setItem: () => undefined,
    removeItem: () => undefined,
  };
}

describe('loadSettings empty-string storage contract', () => {
  it('treats empty string as corrupted settings and falls back to defaults', () => {
    expect(loadSettings(storageReturning(''), 'settings')).toEqual(defaultSettings());
  });

  it('treats null as absent settings and falls back to defaults', () => {
    expect(loadSettings(storageReturning(null), 'settings')).toEqual(defaultSettings());
  });
});
