/**
 * M5-07 失败测试：断局槽位存储适配器（架构种入·不可改）。
 * 当前 saveStorage.ts 为桩（throw not implemented）→ 应先红。
 */
import { describe, it, expect } from 'vitest';
import { loadSave, saveSave, removeSave } from '../../assets/scripts/data/saveStorage';
import { type StorageLike } from '../../assets/scripts/data/settingsStorage';
import { type SaveSlot, SAVE_VERSION } from '../../assets/scripts/data/save';
import { GamePhase, type RoundState } from '../../assets/scripts/game';
import { Rank, Suit } from '../../assets/scripts/rules';

function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

function validRound(): RoundState {
  return {
    phase: GamePhase.Playing,
    landlord: 0,
    seats: [
      { index: 0, hand: [{ rank: Rank.R3, suit: Suit.Spade }] },
      { index: 1, hand: [{ rank: Rank.R4, suit: Suit.Heart }] },
      { index: 2, hand: [{ rank: Rank.R5, suit: Suit.Club }] },
    ],
    turn: 0,
    top: null,
    passesInARow: 0,
    winner: null,
    bombsPlayed: 0,
    bottom: null,
  };
}

const KEY = 'save';

describe('M5-07 断局槽位存储适配器', () => {
  it('save→load 往返深相等', () => {
    const storage = memoryStorage();
    const slot: SaveSlot = { version: SAVE_VERSION, savedAt: 123, round: validRound() };
    saveSave(storage, KEY, slot);
    expect(loadSave(storage, KEY)).toEqual(slot);
  });

  it('load 空 key → null', () => {
    expect(loadSave(memoryStorage(), KEY)).toBeNull();
  });

  it('损坏字符串 → load 抛错（不吞，区别于设置）', () => {
    const storage = memoryStorage();
    storage.setItem(KEY, 'not json');
    expect(() => loadSave(storage, KEY)).toThrow();
  });

  it('removeSave 后 load → null', () => {
    const storage = memoryStorage();
    saveSave(storage, KEY, { version: SAVE_VERSION, savedAt: 1, round: validRound() });
    removeSave(storage, KEY);
    expect(loadSave(storage, KEY)).toBeNull();
  });
});
