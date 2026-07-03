/**
 * T-AI-1 失败测试（架构种入·不可改）：普通档组合首出 + 农民不压队友。
 * 当前 normal 走 conservativeAction→pickSmallest（张数优先=永远最小单、无配合）→ 应先红，实现到绿。
 * 契约见 coordination/tasks/T-AI-1.md。红线：compareMoves/pickSmallest 语义不动；simple.ts 不动。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import { Category, Rank, createRng, recognize } from '../../assets/scripts/rules';
import { GamePhase, type GameSnapshot, type SeatIndex, type TopPlay } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const normal = strategyFor(AiLevel.Normal);

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [5, 5, 5],
    winner: null,
    viewerHand: cards('3 4 5'),
    ...over,
  };
}

const topFrom = (seat: SeatIndex, spec: string): TopPlay => ({ seat, pattern: recognize(cards(spec))! });

describe('T-AI-1 普通档组合首出', () => {
  it('3 3 4 4 5 5 K 领出 → 连对 334455（6 张）', () => {
    const a = normal(snap({ viewerHand: cards('3 3 4 4 5 5 K'), handCounts: [7, 7, 7] }), createRng(1));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      const pattern = recognize(a.cards);
      expect(a.cards).toHaveLength(6);
      expect(pattern?.category).toBe(Category.ConsecutivePairs);
      expect(pattern?.mainRank).toBe(Rank.R5);
    }
  });

  it('3 4 4 4 K 领出 → 三带一 444+3（4 张·带最小单）', () => {
    const a = normal(snap({ viewerHand: cards('3 4 4 4 K'), handCounts: [5, 5, 5] }), createRng(2));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(4);
      expect(a.cards.filter((c) => c.rank === Rank.R4)).toHaveLength(3);
      expect(a.cards.some((c) => c.rank === Rank.R3)).toBe(true);
    }
  });

  it('确定性：组合首出与 rng 无关', () => {
    const s = snap({ viewerHand: cards('3 3 4 4 5 5 K'), handCounts: [7, 7, 7] });
    expect(normal(s, createRng(7))).toEqual(normal(s, createRng(1)));
  });
});

describe('T-AI-1 农民不压队友', () => {
  it('农民回合、顶牌来自队友、地主手牌>2 → pass（即便手里有能压的对 99）', () => {
    const s = snap({
      turn: 1,
      landlord: 0,
      top: topFrom(2, '4 4'),
      viewerHand: cards('3 6 9 9'),
      handCounts: [10, 4, 4],
    });
    const a = normal(s, createRng(3));
    expect(a.type).toBe('pass');
  });

  it('地主手牌 ≤2（紧急）→ 不让牌，照常压队友的对 44', () => {
    const s = snap({
      turn: 1,
      landlord: 0,
      top: topFrom(2, '4 4'),
      viewerHand: cards('3 6 9 9'),
      handCounts: [2, 4, 4],
    });
    const a = normal(s, createRng(4));
    expect(a.type).toBe('play');
    if (a.type === 'play') expect(a.cards.every((c) => c.rank === Rank.R9)).toBe(true);
  });

  it('顶牌来自地主 → 仍最小代价压制（回归：不误伤对地主的压制）', () => {
    const s = snap({
      turn: 1,
      landlord: 0,
      top: topFrom(0, '5'),
      viewerHand: cards('3 6 9'),
      handCounts: [10, 3, 4],
    });
    const a = normal(s, createRng(5));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(1);
      expect(a.cards[0].rank).toBe(Rank.R6);
    }
  });
});
