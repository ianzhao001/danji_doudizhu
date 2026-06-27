import { describe, it, expect } from 'vitest';
import { memoryStorage, storageFrom, type WebStorageLike } from '../../assets/scripts/runtime/storage-adapter';

class FakeWebStorage implements WebStorageLike {
  readonly calls: string[] = [];
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    this.calls.push(`get:${key}`);
    return this.values.has(key) ? this.values.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.calls.push(`set:${key}:${value}`);
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.calls.push(`remove:${key}`);
    this.values.delete(key);
  }
}

describe('runtime storage adapter', () => {
  it('memoryStorage supports get/set/remove roundtrip', () => {
    const storage = memoryStorage();
    expect(storage.getItem('settings')).toBeNull();

    storage.setItem('settings', 'enabled');
    expect(storage.getItem('settings')).toBe('enabled');

    storage.setItem('settings', 'disabled');
    expect(storage.getItem('settings')).toBe('disabled');

    storage.removeItem('settings');
    expect(storage.getItem('settings')).toBeNull();
  });

  it('memoryStorage coerces values to strings like Web Storage', () => {
    const storage = memoryStorage();
    storage.setItem('count', 123 as unknown as string);
    expect(storage.getItem('count')).toBe('123');
  });

  it('storageFrom(null) falls back to isolated memory storage', () => {
    const a = storageFrom(null);
    const b = storageFrom(undefined);

    a.setItem('slot', 'a');
    b.setItem('slot', 'b');

    expect(a.getItem('slot')).toBe('a');
    expect(b.getItem('slot')).toBe('b');
  });

  it('storageFrom delegates to a Web Storage shaped object', () => {
    const web = new FakeWebStorage();
    const storage = storageFrom(web);

    storage.setItem('save', 'round');
    expect(storage.getItem('save')).toBe('round');
    storage.removeItem('save');
    expect(storage.getItem('save')).toBeNull();

    expect(web.calls).toEqual(['set:save:round', 'get:save', 'remove:save', 'get:save']);
  });

  it('storageFrom coerces delegated setItem values to strings', () => {
    const web = new FakeWebStorage();
    const storage = storageFrom(web);

    storage.setItem('n', 7 as unknown as string);

    expect(web.calls).toEqual(['set:n:7']);
    expect(storage.getItem('n')).toBe('7');
  });
});
