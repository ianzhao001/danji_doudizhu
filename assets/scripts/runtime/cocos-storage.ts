import { sys } from 'cc';
import type { StorageLike } from '../data/settingsStorage';
import { storageFrom } from './storage-adapter';

export function cocosStorage(): StorageLike {
  return storageFrom(sys.localStorage);
}
