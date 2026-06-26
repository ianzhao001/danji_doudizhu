/**
 * M5-02 失败测试：存档深校验（top 必需 + 有界深层结构校验）。
 * 架构种入，不可改。当前 M5-01 仅做 7/8 浅字段校验 → 下列校验类用例应先红。
 */
import { describe, it, expect } from 'vitest';
import { serializeRound, deserializeRound } from '../../assets/scripts/game/serialize';
import { GamePhase, type RoundState } from '../../assets/scripts/game';
import { Category, Rank, Suit } from '../../assets/scripts/rules';

function validState(): RoundState {
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

/** 把（可能被篡改的）state 对象包成 wire JSON（version 1）。 */
function wire(state: Record<string, unknown>): string {
  return JSON.stringify({ version: 1, state });
}

describe('M5-02 存档深校验', () => {
  it('top: null 合法，往返深相等', () => {
    const s = validState();
    expect(deserializeRound(serializeRound(s))).toEqual(s);
  });

  it('缺 top → 抛错', () => {
    const s = validState() as unknown as Record<string, unknown>;
    delete s.top;
    expect(() => deserializeRound(wire(s))).toThrow();
  });

  it('seats 非数组 → 抛错', () => {
    const s = validState() as unknown as Record<string, unknown>;
    s.seats = 'nope';
    expect(() => deserializeRound(wire(s))).toThrow();
  });

  it('seats 长度≠3 → 抛错', () => {
    const s = validState() as unknown as Record<string, unknown>;
    (s.seats as unknown[]).length = 2;
    expect(() => deserializeRound(wire(s))).toThrow();
  });

  it('phase 非法枚举 → 抛错', () => {
    const s = validState() as unknown as Record<string, unknown>;
    s.phase = 'bogus';
    expect(() => deserializeRound(wire(s))).toThrow();
  });

  it('turn 越界 → 抛错', () => {
    const s = validState() as unknown as Record<string, unknown>;
    s.turn = 7;
    expect(() => deserializeRound(wire(s))).toThrow();
  });

  it('top.pattern 缺 category → 抛错', () => {
    const s = validState() as unknown as Record<string, unknown>;
    s.top = { seat: 1, pattern: { mainRank: Rank.R3, length: 1, cards: [] } };
    expect(() => deserializeRound(wire(s))).toThrow();
  });

  it('完整合法深状态（含 top）往返深相等', () => {
    const s = validState();
    s.turn = 2;
    s.top = {
      seat: 1,
      pattern: {
        category: Category.Single,
        mainRank: Rank.R3,
        length: 1,
        cards: [{ rank: Rank.R3, suit: Suit.Spade }],
      },
    };
    expect(deserializeRound(serializeRound(s))).toEqual(s);
  });
});
