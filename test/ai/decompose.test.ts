/**
 * W-AUDIT-AI B1 契约:精确拆牌引擎。
 * 口径:moveCount = 在选项约束下打空手牌的最少手数;components 是达成它的合法分解;
 * spendBombs=false(默认)时四张炸恒作独立控牌,不许被顺子/对/翼拆用。
 */
import { describe, expect, it } from 'vitest';
import { Decomposer, decompose, structureCost } from '../../assets/scripts/ai/decompose';
import { Category } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

function multiset(list: { rank: number; suit: string }[]): string {
  return list.map((c) => `${c.rank}${c.suit}`).sort().join(',');
}

describe('decompose 最少手数', () => {
  it('空手 0 手;散牌逐张计数', () => {
    expect(decompose([]).moveCount).toBe(0);
    expect(decompose(cards('3 4 5')).moveCount).toBe(3);
  });

  it('顺子/连对/三带/飞机±翼一手识别', () => {
    expect(decompose(cards('3 4 5 6 7')).moveCount).toBe(1);
    expect(decompose(cards('3 3 4 4 5 5')).moveCount).toBe(1);
    expect(decompose(cards('3 3 3 4')).moveCount).toBe(1);
    expect(decompose(cards('3 3 3 4 4')).moveCount).toBe(1);
    // 最低点作高点载体的翼(曾漏枚举的分支):999带3 / 999带33。
    expect(decompose(cards('3 9 9 9')).moveCount).toBe(1);
    expect(decompose(cards('3 3 9 9 9')).moveCount).toBe(1);
    expect(decompose(cards('3 3 3 4 4 4 5 6')).moveCount).toBe(1);
    expect(decompose(cards('3 3 3 4 4 4 5 5 6 6')).moveCount).toBe(1);
  });

  it('飞机翼取最优子集,余牌单独计数', () => {
    // 333444 带两单翼(从 5/6/9 三选二),剩 1 张单 → 共 2 手。
    expect(decompose(cards('3 3 3 4 4 4 5 6 9')).moveCount).toBe(2);
  });

  it('火箭一手;火箭+散牌分开计数', () => {
    expect(decompose(cards('x X')).moveCount).toBe(1);
    expect(decompose(cards('x X 3')).moveCount).toBe(2);
  });

  it('默认炸弹保护:四张恒整出,不被顺子/翼拆用', () => {
    const result = decompose(cards('9 9 9 9 3'));
    expect(result.moveCount).toBe(2);
    expect(result.components.some((c) => c.pattern.category === Category.Bomb)).toBe(true);
    // 34567 顺子需要拆 7777 → 默认禁止,只能 4 单 + 炸 = 5 手。
    expect(decompose(cards('3 4 5 6 7 7 7 7')).moveCount).toBe(5);
  });

  it('spendBombs=true 解锁拆炸与四带二', () => {
    expect(decompose(cards('3 4 5 6 7 7 7 7'), { spendBombs: true }).moveCount).toBe(2);
    expect(decompose(cards('9 9 9 9 3 4'), { spendBombs: true }).moveCount).toBe(1);
    expect(decompose(cards('9 9 9 9 3 4')).moveCount).toBe(3);
  });

  it('默认火箭保护:双王只许整出火箭,不作单/翼(Codex R1 阻断②回归)', () => {
    // 曾漏报:飞机带双王翼被算成一手 → hard 结构代价失真(裸飞机 cost=1、单5 cost=0 → 先出单5)。
    const plane = decompose(cards('3 3 3 4 4 4 x X'));
    expect(plane.moveCount).toBe(2); // 裸飞机 + 火箭
    expect(plane.components.some((c) => c.pattern.category === Category.Rocket)).toBe(true);
    const planeFive = decompose(cards('3 3 3 4 4 4 5 x X'));
    expect(planeFive.moveCount).toBe(3); // 裸飞机 + 单5 + 火箭
    expect(planeFive.components.some((c) => c.pattern.category === Category.Rocket)).toBe(true);
    // 单王在手(火箭不成立)仍是普通大单
    expect(decompose(cards('3 3 3 X')).moveCount).toBe(1); // 三带一(大王翼)
  });

  it('spendBombs=true 允许双王作翼', () => {
    expect(decompose(cards('3 3 3 4 4 4 x X'), { spendBombs: true }).moveCount).toBe(1);
    expect(decompose(cards('3 3 3 4 4 4 5 x X'), { spendBombs: true }).moveCount).toBe(2);
  });
});

describe('decompose 分解合法性与确定性', () => {
  const HANDS = ['3 3 3 4 4 4 5 6 9', '3 4 5 6 7 7 7 7', '9 9 9 9 3', 'x X 3 3 2 2',
    '3 3 3 4 4 5 6 7 8 9 10 J Q K A 2 X'];

  it('components 恰为手牌的一个划分,且每个组件 recognize 合法', () => {
    for (const spec of HANDS) {
      const hand = cards(spec);
      const result = decompose(hand);
      expect(result.exact).toBe(true);
      expect(result.components.length).toBe(result.moveCount);
      const union = result.components.flatMap((c) => c.cards);
      expect(multiset(union)).toBe(multiset(hand));
      for (const component of result.components) expect(component.pattern).toBeTruthy();
    }
  });

  it('同一输入两次拆解结果深相等(确定性)', () => {
    for (const spec of HANDS) {
      const hand = cards(spec);
      expect(decompose(hand)).toEqual(decompose(hand));
    }
  });

  it('17 张实弹手可精确求解', () => {
    const hand = cards('3 3 4 5 5 6 7 7 8 9 10 10 J Q K 2 X');
    const result = decompose(hand);
    expect(result.exact).toBe(true);
    expect(result.moveCount).toBeGreaterThanOrEqual(1);
    expect(result.moveCount).toBeLessThanOrEqual(8);
  });
});

describe('structureCost 结构代价', () => {
  it('整组件出牌代价为 0,拆结构出牌代价为正', () => {
    const hand = cards('3 3 3 4 4 4 5 6 9');
    const nine = hand.filter((c) => c.rank === 9);
    expect(structureCost(hand, nine)).toBe(0);
    // 抽走 333+4(三带一)后剩 44 5 6 9 → 4 手;1+4−2 = 3。
    const trioPlusWing = [...hand.filter((c) => c.rank === 3), hand.find((c) => c.rank === 4)!];
    expect(structureCost(hand, trioPlusWing)).toBe(3);
  });
});

describe('节点预算回退', () => {
  it('预算耗尽仍给出合法划分(exact=false,手数为上界)', () => {
    const hand = cards('3 3 3 4 4 4 5 6 9');
    const tight = new Decomposer({ nodeBudget: 1 }).decompose(hand);
    expect(tight.exact).toBe(false);
    expect(tight.moveCount).toBeGreaterThanOrEqual(2);
    expect(multiset(tight.components.flatMap((c) => c.cards))).toBe(multiset(hand));
    expect(tight.components.length).toBe(tight.moveCount);
  });
});
