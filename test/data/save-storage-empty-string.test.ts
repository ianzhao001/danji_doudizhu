import { describe, expect, it } from 'vitest';

import { loadSave } from '../../assets/scripts/data/saveStorage';
import { type StorageLike } from '../../assets/scripts/data/settingsStorage';

function storageReturning(value: string | null): StorageLike {
  return {
    getItem: () => value,
    setItem: () => undefined,
    removeItem: () => undefined,
  };
}

describe('loadSave empty-string storage contract', () => {
  it('treats empty string as corrupted save data', () => {
    expect(() => loadSave(storageReturning(''), 'save')).toThrow(/corrupted save slot/);
  });

  it('treats null as an absent save slot', () => {
    expect(loadSave(storageReturning(null), 'save')).toBeNull();
  });
});
