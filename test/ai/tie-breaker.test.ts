/**
 * M4-05 全序 tie-breaker 回归锁定（架构维护）。
 *
 * 背景：M4-05 用 _shared.compareMoves 的全序（length → category → mainRank →
 * 逐张点序 → 逐张花色序）取代了对 enumerateMoves 产出顺序的隐式依赖。本测试钉死
 * 该全序在「同长度·同主点·不同牌型」边界的确定序，并锁定 simple/normal 对外行为不变
 * （length 优先于 category tiebreak，领出仍出最小单），防止后续重构悄悄改变选择。
 */
import { describe, it, expect } from 'vitest';
import { compareMoves, pickSmallest, pickLargest } from '../../assets/scripts/ai/levels/_shared';
import { strategyFor, AiLevel } from '../../assets/scripts/ai';
import { createRng, recognize, Category, Rank, type Move } from '../../assets/scripts/rules';
import { GamePhase, type GameSnapshot } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

function mv(spec: string): Move {
  const c = cards(spec);
  const pattern = recognize(c);
  if (!pattern) throw new Error(`not a legal pattern: ${spec}`);
  return { cards: c, pattern };
}

// 同长度(5)、同主点(R7)、不同牌型：顺子 vs 三带二。
const straight = mv('3 4 5 6 7'); // Category.Straight, mainRank R7
const tripsPair = mv('7 7 7 3 3'); // Category.TripsPair, mainRank R7

describe('M4-05 全序 compareMoves（同长·同主点·不同牌型 → 按 category 定序）', () => {
  it('边界前提成立：同长、同主点、不同 category', () => {
    expect(straight.cards.length).toBe(tripsPair.cards.length);
    expect(straight.pattern.mainRank).toBe(Rank.R7);
    expect(tripsPair.pattern.mainRank).toBe(Rank.R7);
    expect(straight.pattern.category).not.toBe(tripsPair.pattern.category);
  });

  it('该边界由 category 决定序（与 Category 枚举一致）', () => {
    expect(Math.sign(compareMoves(straight, tripsPair))).toBe(
      Math.sign(Category.Straight - Category.TripsPair),
    );
    // TripsPair(4) < Straight(5) → 三带二排在前
    expect(compareMoves(tripsPair, straight)).toBeLessThan(0);
  });

  it('反对称且对不同 Move 不为 0（全序）', () => {
    expect(compareMoves(straight, tripsPair)).toBe(-compareMoves(tripsPair, straight));
    expect(compareMoves(straight, tripsPair)).not.toBe(0);
  });

  it('选择与输入/枚举顺序无关（全序的核心保证）', () => {
    const single3 = mv('3');
    const pair3 = mv('3 3');
    const orderA = [single3, pair3, straight, tripsPair];
    const orderB = [tripsPair, straight, pair3, single3];
    // 不同输入顺序得到同一结果（深相等）
    expect(pickSmallest(orderA)).toEqual(pickSmallest(orderB));
    expect(pickLargest(orderA)).toEqual(pickLargest(orderB));
    // length 优先：最小者是单张；最大者是同长里 category 更大的顺子
    expect(pickSmallest(orderA)).toEqual(single3);
    expect(pickLargest(orderA)).toEqual(straight);
  });
});

function leadSnap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [7, 5, 5],
    winner: null,
    viewerHand: cards('3 4 5 6 7 7 7'),
    ...over,
  };
}

describe('M4-05 simple/normal 对外行为不变（length 优先于 tiebreak）', () => {
  it('含同长多型候选的手牌，simple/normal 领出仍出最小单 3', () => {
    const s = leadSnap({});
    for (const level of [AiLevel.Simple, AiLevel.Normal]) {
      const a = strategyFor(level)(s, createRng(1));
      expect(a.type).toBe('play');
      if (a.type === 'play') {
        expect(a.cards).toHaveLength(1);
        expect(a.cards[0].rank).toBe(Rank.R3);
      }
    }
  });
});
