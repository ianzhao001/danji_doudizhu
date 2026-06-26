/**
 * M5-12a 失败测试：序列化整数化（架构种入·不可改）。
 * 当前 passesInARow/bombsPlayed 用 assertNonNegativeNumber 接受小数 → 下列「应抛错」断言应先红。
 * 实现方改用 assertNonNegativeInteger 后转绿。
 */
import { describe, it, expect } from 'vitest';
import { serializeRound, deserializeRound } from '../../assets/scripts/game/serialize';
import { GamePhase, Side, type RoundState } from '../../assets/scripts/game';
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

function roundWith(over: Partial<RoundState>): string {
  return JSON.stringify({ ...validRound(), ...over });
}

describe('M5-12a 序列化数值整数化', () => {
  it('passesInARow 非整数 → 抛错', () => {
    expect(() => deserializeRound(roundWith({ passesInARow: 2.5 }))).toThrow();
  });
  it('passesInARow 负数 → 抛错', () => {
    expect(() => deserializeRound(roundWith({ passesInARow: -1 }))).toThrow();
  });
  it('bombsPlayed 非整数 → 抛错', () => {
    expect(() => deserializeRound(roundWith({ bombsPlayed: 1.5 }))).toThrow();
  });
});
