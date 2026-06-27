import type { StorageLike } from '../data/settingsStorage';

export interface WebStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function memoryStorage(): StorageLike {
  const values = new Map<string, string>();

  return {
    getItem(key: string): string | null {
      return values.has(key) ? values.get(key)! : null;
    },
    setItem(key: string, value: string): void {
      values.set(key, String(value));
    },
    removeItem(key: string): void {
      values.delete(key);
    },
  };
}

export function storageFrom(ls: WebStorageLike | null | undefined): StorageLike {
  if (!ls) return memoryStorage();

  return {
    getItem(key: string): string | null {
      return ls.getItem(key);
    },
    setItem(key: string, value: string): void {
      ls.setItem(key, String(value));
    },
    removeItem(key: string): void {
      ls.removeItem(key);
    },
  };
}
