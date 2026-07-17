/**
 * W-AI 修订版：全序 tie-breaker + 领出分档锚（规划者修订种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/ai/tie-breaker.test.ts，独立 seed commit（B2 棒）。
 *
 * ── 修订依据（用户裁决：全体上移一档）──
 *   describe 1（compareMoves 全序）逐字保留——_shared 语义不动。
 *   describe 2 重钉：旧「simple 领出最小单」新手锚点随裁决废止——
 *     · Simple（新，≈旧 Normal）：组合领出，3 4 5 6 7 7 7 → 5 张顺子（旧 Normal 的确定行为原样转移）；
 *     · Normal（新，结构引擎）：领出必为「结构代价 ≤0 的多张组合」且不动保护牌
 *       （性质钉扎——引擎常数可调，性质不可破）。
 *
 * ── 预期红（对 main 现实现）── Simple 组合锚红 1（旧出单 3）；Normal 性质锚对旧实现绿（旧顺子 cost0）。
 *
 * ── 负向变异自证（执行者实现后自查）──
 *   ① Simple 回退 pickSmallest → Simple 组合锚红。
 *   ② Normal 领出改 pickSmallest（单张 cost>0）→ Normal 性质锚红。
 */
import { describe, it, expect } from 'vitest';
import { compareMoves, pickSmallest, pickLargest, protectedCards, usesProtectedCards } from '../../assets/scripts/ai/levels/_shared';
import { strategyFor, AiLevel } from '../../assets/scripts/ai';
import { Decomposer } from '../../assets/scripts/ai/decompose';
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

describe('W-AI 领出行为分档（全体上移：Simple 组合领出；Normal 结构白出）', () => {
  it('Simple（≈旧 Normal）：3 4 5 6 7 7 7 领出 5 张顺子 34567（旧 Normal 确定行为原样转移）', () => {
    const a = strategyFor(AiLevel.Simple)(leadSnap({}), createRng(1));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      const pattern = recognize(a.cards);
      expect(a.cards).toHaveLength(5);
      expect(pattern?.category).toBe(Category.Straight);
      expect(pattern?.mainRank).toBe(Rank.R7);
    }
  });

  it('Normal（结构引擎）：领出必为结构代价 ≤0 的多张组合，且不动保护牌（性质钉扎）', () => {
    const s = leadSnap({});
    const a = strategyFor(AiLevel.Normal)(s, createRng(1));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards.length).toBeGreaterThanOrEqual(2);
      const pattern = recognize(a.cards);
      expect(pattern).not.toBeNull();
      const hand = s.viewerHand!;
      const cost = new Decomposer().structureCost(hand, a.cards);
      expect(cost, '领出不得拆散最优分解（白出）').toBeLessThanOrEqual(0);
      expect(usesProtectedCards({ cards: a.cards, pattern: pattern! }, protectedCards(hand))).toBe(false);
    }
  });
});
