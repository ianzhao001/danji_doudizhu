/**
 * W-AI-R3 Sota2 B-rules：定向 legalFollows 必须逐项等价于旧口径。
 *
 * 负向变异自证（以下临时改动必须令本文件转红）：
 *   ① 漏掉任一同型生成分支（单/对/三、序列、三带/飞机带、四带二）→ 集合等价红。
 *   ② 漏掉炸弹或火箭兜底，或把炸弹统一移到同型候选之后 → 集合/顺序等价红。
 *   ③ 放松 top.category / top.length / top.mainRank 任一约束 → 多生成着法，集合等价红。
 */
import { describe, expect, it } from 'vitest';
import {
  Category,
  beats,
  createRng,
  deal,
  enumerateMoves,
  legalFollows,
  recognize,
  type Card,
  type HandPattern,
  type Move,
} from '../../assets/scripts/rules';
import { cards } from './_util';

const TOP_SPECS = [
  '3', '10', 'A', '2', 'x', 'X',
  '3 3', '9 9', 'A A', '2 2',
  '3 3 3', '9 9 9', 'A A A', '2 2 2',
  '3 3 3 4', '9 9 9 J', 'A A A 2', '2 2 2 X',
  '3 3 3 4 4', '9 9 9 J J', 'A A A 2 2', '2 2 2 A A',
  '3 4 5 6 7', '4 5 6 7 8 9', '7 8 9 10 J Q K', '3 4 5 6 7 8 9 10 J Q K A',
  '3 3 4 4 5 5', '4 4 5 5 6 6 7 7', '8 8 9 9 10 10 J J Q Q',
  '3 3 3 4 4 4', '4 4 4 5 5 5 6 6 6', '9 9 9 10 10 10 J J J Q Q Q',
  '3 3 3 4 4 4 5 6', '4 4 4 5 5 5 6 6 6 7 8 9',
  '7 7 7 8 8 8 9 9 9 10 10 10 J Q K A',
  '3 3 3 4 4 4 5 5 6 6', '4 4 4 5 5 5 6 6 6 7 7 8 8 9 9',
  '7 7 7 8 8 8 9 9 9 10 10 10 J J Q Q K K A A',
  '3 3 3 3 4 5', '9 9 9 9 J Q', '2 2 2 2 x X',
  '3 3 3 3 4 4 5 5', '9 9 9 9 J J Q Q', '2 2 2 2 K K A A',
  '3 3 3 3', '9 9 9 9', 'A A A A', '2 2 2 2',
  'x X',
] as const;

function topPatterns(): HandPattern[] {
  return TOP_SPECS.map((spec) => {
    const pattern = recognize(cards(spec));
    if (!pattern) throw new Error(`invalid top fixture: ${spec}`);
    return pattern;
  });
}

function broadHands(): Card[][] {
  const hands: Card[][] = [
    cards('3 3 3 3 4 4 4 4 5 5 5 6 6 7 8 9 10 J x X'),
    cards('3 3 3 4 4 4 5 5 5 6 6 7 7 8 8 9 10 J Q K'),
    cards('3 4 5 6 7 8 9 10 J Q K A 2 x X'),
    cards('3 3 4 4 5 5 6 6 7 7 8 8 9 9 10 10 J J Q Q'),
    cards('3 3 3 3 4 4 4 4 5 5 5 5 6 6 6 6 7 8 9 10'),
    cards('3 3 3 4 4 4 5 5 6 6 7 7 8 8 9 10 x X'),
  ];
  for (let seed = 1; seed <= 40; seed += 1) {
    const fixture = deal(createRng(seed));
    hands.push(...fixture.hands);
    hands.push([...fixture.hands[seed % 3], ...fixture.bottom]);
  }
  return hands;
}

function cardKey(card: Card): string {
  return `${card.rank}:${card.suit}`;
}

function moveKey(move: Move): string {
  return [
    move.pattern.category,
    move.pattern.mainRank,
    move.pattern.length,
    move.cards.map(cardKey).join(','),
    move.pattern.cards.map(cardKey).join(','),
  ].join('|');
}

describe('W-AI-R3 B-rules legalFollows 旧口径等价 oracle', () => {
  it('top 样本覆盖全部 14 类，并覆盖不同长度的顺子/连对/飞机', () => {
    const tops = topPatterns();
    expect(new Set(tops.map((top) => top.category))).toEqual(new Set([
      Category.Single,
      Category.Pair,
      Category.Trips,
      Category.TripsSingle,
      Category.TripsPair,
      Category.Straight,
      Category.ConsecutivePairs,
      Category.Airplane,
      Category.AirplaneSingles,
      Category.AirplanePairs,
      Category.FourPlusTwoSingles,
      Category.FourPlusTwoPairs,
      Category.Bomb,
      Category.Rocket,
    ]));
    expect(new Set(tops.filter((top) => top.category === Category.Straight).map((top) => top.length)))
      .toEqual(new Set([5, 6, 7, 12]));
    expect(new Set(tops.filter((top) => top.category === Category.ConsecutivePairs).map((top) => top.length)))
      .toEqual(new Set([6, 8, 10]));
    for (const category of [Category.Airplane, Category.AirplaneSingles, Category.AirplanePairs]) {
      expect(new Set(tops.filter((top) => top.category === category).map((top) => top.length)).size)
        .toBe(3);
    }
  });

  it('166 手牌 × 49 牌权：Move 集合、顺序、牌序与 pattern 逐字节等价旧实现', () => {
    const tops = topPatterns();
    const hands = broadHands();
    const mismatches: string[] = [];
    let cases = 0;
    for (let handIndex = 0; handIndex < hands.length; handIndex += 1) {
      const hand = hands[handIndex]!;
      const enumerated = enumerateMoves(hand);
      for (let topIndex = 0; topIndex < tops.length; topIndex += 1) {
        const top = tops[topIndex]!;
        const expected = enumerated.filter((move) => beats(move.pattern, top)).map(moveKey);
        const actual = legalFollows(hand, top).map(moveKey);
        cases += 1;
        if ((expected.length !== actual.length || expected.some((key, index) => key !== actual[index]))
          && mismatches.length < 8) {
          mismatches.push([
            `hand#${handIndex}`,
            `top#${topIndex}:${Category[top.category]}/${top.length}/${top.mainRank}`,
            `expected=${expected.join(';')}`,
            `actual=${actual.join(';')}`,
          ].join(' '));
        }
      }
    }
    expect(cases).toBe(166 * 49);
    expect(mismatches).toEqual([]);
  });
});
