/**
 * M5-12a 失败测试：Settled 终局态往返（架构种入·不可改）。当前应绿（绿护栏）。
 */
import { describe, it, expect } from 'vitest';
import { serializeRound, deserializeRound } from '../../assets/scripts/game/serialize';
import { GamePhase, Side, type RoundState } from '../../assets/scripts/game';
import { Rank, Suit, Category } from '../../assets/scripts/rules';

function settledRound(): RoundState {
  return {
    phase: GamePhase.Settled,
    landlord: 0,
    seats: [
      { index: 0, hand: [] },
      { index: 1, hand: [{ rank: Rank.R4, suit: Suit.Heart }] },
      { index: 2, hand: [{ rank: Rank.R5, suit: Suit.Club }] },
    ],
    turn: 0,
    top: { seat: 0, pattern: { category: Category.Single, mainRank: Rank.R3, length: 1, cards: [{ rank: Rank.R3, suit: Suit.Spade }] } },
    passesInARow: 0,
    winner: Side.Landlord,
    bombsPlayed: 1,
  };
}

describe('M5-12a Settled 终局态往返', () => {
  it('Settled + winner=Landlord + 非 null top 往返深相等', () => {
    const r = settledRound();
    expect(deserializeRound(serializeRound(r))).toEqual(r);
  });
  it('winner 非法值 → 抛错', () => {
    const r = settledRound();
    const bad = JSON.stringify({ ...r, winner: 'x' });
    expect(() => deserializeRound(bad)).toThrow();
  });
  it('Settled + Bomb top（四同点·多卡 pattern）+ bombsPlayed=2 往返深相等', () => {
    const r: RoundState = {
      ...settledRound(),
      top: {
        seat: 0,
        pattern: {
          category: Category.Bomb,
          mainRank: Rank.R7,
          length: 4,
          cards: [
            { rank: Rank.R7, suit: Suit.Spade },
            { rank: Rank.R7, suit: Suit.Heart },
            { rank: Rank.R7, suit: Suit.Club },
            { rank: Rank.R7, suit: Suit.Diamond },
          ],
        },
      },
      bombsPlayed: 2,
    };
    expect(deserializeRound(serializeRound(r))).toEqual(r);
  });
});
