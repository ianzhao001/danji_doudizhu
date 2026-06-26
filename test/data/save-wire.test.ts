/**
 * M5-04B 绿护栏：断局槽位 canonical wire。
 * 锁定 serializeSave 恒输出 SAVE_VERSION，以及 deserializeSave 的外层错误语义。
 */
import { describe, it, expect } from 'vitest';
import { serializeSave, deserializeSave, SAVE_VERSION, type SaveSlot } from '../../assets/scripts/data/save';
import { GamePhase, type RoundState } from '../../assets/scripts/game';
import { Rank, Suit } from '../../assets/scripts/rules';

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
  };
}

function slot(version: number): SaveSlot {
  return { version, savedAt: 1, round: validRound() };
}

describe('M5-04B 断局槽位 canonical wire', () => {
  it('serializeSave 恒输出 SAVE_VERSION，不透传输入 slot.version', () => {
    expect(JSON.parse(serializeSave(slot(0))).version).toBe(SAVE_VERSION);
    expect(JSON.parse(serializeSave(slot(999))).version).toBe(SAVE_VERSION);
  });

  it('serializeSave→deserializeSave 归一 version，保留 round 与 savedAt', () => {
    const input = slot(0);
    const back = deserializeSave(serializeSave(input));
    expect(back.version).toBe(SAVE_VERSION);
    expect(back.savedAt).toBe(input.savedAt);
    expect(back.round).toEqual(input.round);
  });

  it('非法 JSON 抛 corrupted save slot: invalid JSON', () => {
    expect(() => deserializeSave('not json')).toThrow(/invalid JSON/);
  });

  it('非对象顶层抛 expected object', () => {
    expect(() => deserializeSave('123')).toThrow(/expected object/);
    expect(() => deserializeSave('"x"')).toThrow(/expected object/);
    expect(() => deserializeSave('[]')).toThrow(/expected object/);
  });
});
