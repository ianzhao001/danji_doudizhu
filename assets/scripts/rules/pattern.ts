/**
 * 牌型识别。把一组牌识别为唯一的合法牌型，否则返回 null。
 * 规则边界见 docs/RULES.md：顺子/连对/飞机连续段排除 2 和王；
 * 四带二非炸弹；飞机翼数=三张组数且翼型一致。
 */

import { Card, Rank, isSequenceable } from './card';

export enum Category {
  Single,
  Pair,
  Trips,
  TripsSingle,
  TripsPair,
  Straight,
  ConsecutivePairs,
  Airplane,
  AirplaneSingles,
  AirplanePairs,
  FourPlusTwoSingles,
  FourPlusTwoPairs,
  Bomb,
  Rocket,
}

export interface HandPattern {
  category: Category;
  /** 用于同型比较的主点数（序列型取连续段最大点数）。 */
  mainRank: Rank;
  /** 总张数（同型比较时需张数一致）。 */
  length: number;
  cards: Card[];
}

export function isBombLike(category: Category): boolean {
  return category === Category.Bomb || category === Category.Rocket;
}

function make(category: Category, mainRank: Rank, cards: Card[]): HandPattern {
  return { category, mainRank, length: cards.length, cards: cards.slice() };
}

function isConsecutive(sorted: Rank[]): boolean {
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) return false;
  }
  return true;
}

/** 识别牌型；不合法返回 null。 */
export function recognize(cards: Card[]): HandPattern | null {
  if (!cards || cards.length === 0) return null;
  const n = cards.length;

  const counts = new Map<Rank, number>();
  for (const c of cards) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);
  const ranks = Array.from(counts.keys()).sort((a, b) => a - b);
  const byCount = (k: number): Rank[] => ranks.filter((r) => counts.get(r) === k);
  const singles = byCount(1);
  const pairs = byCount(2);
  const trips = byCount(3);
  const quads = byCount(4);

  // 火箭：大小王
  if (n === 2 && counts.get(Rank.SmallJoker) === 1 && counts.get(Rank.BigJoker) === 1) {
    return make(Category.Rocket, Rank.BigJoker, cards);
  }

  // 炸弹：四张同点
  if (n === 4 && quads.length === 1) {
    return make(Category.Bomb, quads[0], cards);
  }

  // 单张
  if (n === 1) return make(Category.Single, ranks[0], cards);

  // 对子
  if (n === 2 && pairs.length === 1) return make(Category.Pair, pairs[0], cards);

  // 三张 / 三带一 / 三带二
  if (trips.length === 1 && quads.length === 0) {
    const t = trips[0];
    if (n === 3 && pairs.length === 0 && singles.length === 0) {
      return make(Category.Trips, t, cards);
    }
    if (n === 4 && singles.length === 1 && pairs.length === 0) {
      return make(Category.TripsSingle, t, cards);
    }
    if (n === 5 && pairs.length === 1 && singles.length === 0) {
      return make(Category.TripsPair, t, cards);
    }
  }

  // 四带二（非炸弹）：四带两张单牌(6) 或 四带两对(8)
  if (quads.length === 1) {
    const q = quads[0];
    if (n === 6 && singles.length === 2 && pairs.length === 0 && trips.length === 0) {
      return make(Category.FourPlusTwoSingles, q, cards);
    }
    if (n === 8 && pairs.length === 2 && singles.length === 0 && trips.length === 0) {
      return make(Category.FourPlusTwoPairs, q, cards);
    }
  }

  // 顺子：>=5 张连续单牌，排除 2 和王
  if (n >= 5 && singles.length === n && isConsecutive(ranks) && ranks.every(isSequenceable)) {
    return make(Category.Straight, ranks[ranks.length - 1], cards);
  }

  // 连对：>=3 对连续对子，排除 2 和王
  if (
    n >= 6 &&
    n % 2 === 0 &&
    pairs.length === n / 2 &&
    pairs.length >= 3 &&
    isConsecutive(pairs) &&
    pairs.every(isSequenceable)
  ) {
    return make(Category.ConsecutivePairs, pairs[pairs.length - 1], cards);
  }

  // 飞机：>=2 个连续三张，排除 2 和王；可不带 / 带等量单 / 带等量对
  if (trips.length >= 2 && quads.length === 0 && isConsecutive(trips) && trips.every(isSequenceable)) {
    const t = trips.length;
    const main = trips[trips.length - 1];
    if (n === 3 * t && singles.length === 0 && pairs.length === 0) {
      return make(Category.Airplane, main, cards);
    }
    if (n === 4 * t && singles.length === t && pairs.length === 0) {
      return make(Category.AirplaneSingles, main, cards);
    }
    if (n === 5 * t && pairs.length === t && singles.length === 0) {
      return make(Category.AirplanePairs, main, cards);
    }
  }

  return null;
}
