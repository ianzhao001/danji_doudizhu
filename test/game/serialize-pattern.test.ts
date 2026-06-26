/**
 * M5-02B 失败测试：top.pattern 完整形校验（架构种入·不可改）。
 * 当前 assertTop 仅校验 category/mainRank → 下列 cards/length 校验用例应先红。
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

function wire(state: Record<string, unknown>): string {
  return JSON.stringify({ version: 1, state });
}

function stateWithTop(pattern: Record<string, unknown>): Record<string, unknown> {
  const s = validState() as unknown as Record<string, unknown>;
  s.top = { seat: 1, pattern };
  return s;
}

describe('M5-02B top.pattern 完整形校验', () => {
  it('top.pattern 缺 cards → 抛错', () => {
    const s = stateWithTop({ category: Category.Single, mainRank: Rank.R3, length: 1 });
    expect(() => deserializeRound(wire(s))).toThrow();
  });

  it('top.pattern.cards 非数组 → 抛错', () => {
    const s = stateWithTop({ category: Category.Single, mainRank: Rank.R3, length: 1, cards: 'nope' });
    expect(() => deserializeRound(wire(s))).toThrow();
  });

  it('top.pattern.cards 含非法 rank → 抛错', () => {
    const s = stateWithTop({
      category: Category.Single,
      mainRank: Rank.R3,
      length: 1,
      cards: [{ rank: 999, suit: Suit.Spade }],
    });
    expect(() => deserializeRound(wire(s))).toThrow();
  });

  it('top.pattern 缺 length → 抛错', () => {
    const s = stateWithTop({
      category: Category.Single,
      mainRank: Rank.R3,
      cards: [{ rank: Rank.R3, suit: Suit.Spade }],
    });
    expect(() => deserializeRound(wire(s))).toThrow();
  });

  it('top.pattern.length 非数字 → 抛错', () => {
    const s = stateWithTop({
      category: Category.Single,
      mainRank: Rank.R3,
      length: 'one',
      cards: [{ rank: Rank.R3, suit: Suit.Spade }],
    });
    expect(() => deserializeRound(wire(s))).toThrow();
  });

  it('top.pattern.length !== cards.length → 抛错', () => {
    const s = stateWithTop({
      category: Category.Single,
      mainRank: Rank.R3,
      length: 2,
      cards: [{ rank: Rank.R3, suit: Suit.Spade }],
    });
    expect(() => deserializeRound(wire(s))).toThrow();
  });

  it('完整合法 top.pattern 往返深相等（绿护栏）', () => {
    const s = validState();
    s.top = {
      seat: 1,
      pattern: {
        category: Category.Pair,
        mainRank: Rank.R7,
        length: 2,
        cards: [
          { rank: Rank.R7, suit: Suit.Spade },
          { rank: Rank.R7, suit: Suit.Heart },
        ],
      },
    };
    expect(deserializeRound(serializeRound(s))).toEqual(s);
  });
});
