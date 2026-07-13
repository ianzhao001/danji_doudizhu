/**
 * M5-04 失败测试：断局存档槽位纯模型（架构种入·不可改）。
 * 当前 save.ts 为桩（throw not implemented）→ 应先红。
 */
import { describe, it, expect } from 'vitest';
import { serializeSave, deserializeSave, SAVE_VERSION, type SaveSlot } from '../../assets/scripts/data/save';
import { serializeRound, deserializeRound } from '../../assets/scripts/game/serialize';
import { GamePhase, type RoundState } from '../../assets/scripts/game';
import { Category, Rank, Suit } from '../../assets/scripts/rules';

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

describe('M5-04 断局存档槽位', () => {
  it('serializeSave→deserializeSave 往返：round 深相等、savedAt/version 保真', () => {
    const slot: SaveSlot = { version: SAVE_VERSION, savedAt: 1234567890, round: validRound() };
    const back = deserializeSave(serializeSave(slot));
    expect(back.version).toBe(SAVE_VERSION);
    expect(back.savedAt).toBe(1234567890);
    expect(back.round).toEqual(validRound());
  });

  it('内层 round 损坏（缺字段）→ deserializeSave 抛错', () => {
    const badRound = validRound() as unknown as Record<string, unknown>;
    delete badRound.turn;
    const json = JSON.stringify({ version: SAVE_VERSION, savedAt: 1, round: JSON.parse(serializeRound(badRound as unknown as RoundState)) });
    expect(() => deserializeSave(json)).toThrow();
  });

  it('外层 version 不符 → 抛错', () => {
    const json = JSON.stringify({ version: 999, savedAt: 1, round: JSON.parse(serializeRound(validRound())) });
    expect(() => deserializeSave(json)).toThrow();
  });

  it('savedAt 非数 → 抛错', () => {
    const json = JSON.stringify({ version: SAVE_VERSION, savedAt: 'now', round: JSON.parse(serializeRound(validRound())) });
    expect(() => deserializeSave(json)).toThrow();
  });

  it('合法往返与 game 层 deserializeRound 一致（绿护栏）', () => {
    const slot: SaveSlot = { version: SAVE_VERSION, savedAt: 7, round: validRound() };
    const back = deserializeSave(serializeSave(slot));
    expect(deserializeRound(serializeRound(back.round))).toEqual(validRound());
  });
});
