/**
 * 合法着法枚举，供 AI 决策与 UI「提示」复用。
 * 所有候选都经 recognize() 守卫，保证只产出合法牌型。
 * 枚举按点数组合完整覆盖，不展开同点数不同花色的等价排列。
 */

import { Card, Rank, isSequenceable } from './card';
import { Category, HandPattern, recognize } from './pattern';

export interface Move {
  cards: Card[];
  pattern: HandPattern;
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (size > items.length) return [];

  const out: T[][] = [];
  const walk = (start: number, picked: T[]): void => {
    if (picked.length === size) {
      out.push(picked.slice());
      return;
    }

    const need = size - picked.length;
    for (let i = start; i <= items.length - need; i++) {
      picked.push(items[i]);
      walk(i + 1, picked);
      picked.pop();
    }
  };

  walk(0, []);
  return out;
}

interface RankedHand {
  ranks: Rank[];
  countOf: (rank: Rank) => number;
  take: (rank: Rank, count: number) => Card[];
}

function indexHand(hand: Card[]): RankedHand {
  const byRank = new Map<Rank, Card[]>();
  for (const card of hand) {
    const sameRank = byRank.get(card.rank);
    if (sameRank) sameRank.push(card);
    else byRank.set(card.rank, [card]);
  }
  const ranks = Array.from(byRank.keys()).sort((left, right) => left - right);
  return {
    ranks,
    countOf: (rank) => byRank.get(rank)?.length ?? 0,
    take: (rank, count) => (byRank.get(rank) ?? []).slice(0, count),
  };
}

interface MoveCollector {
  moves: Move[];
  add: (cards: Card[]) => void;
}

function createMoveCollector(): MoveCollector {
  const moves: Move[] = [];
  const seen = new Set<string>();
  const add = (cards: Card[]): void => {
    if (cards.length === 0) return;
    const pattern = recognize(cards);
    if (!pattern) return;
    const key = pattern.category + '|' + cards.map((card) => `${card.rank}${card.suit}`).sort().join(',');
    if (seen.has(key)) return;
    seen.add(key);
    moves.push({ cards: cards.slice(), pattern });
  };
  return { moves, add };
}

function consecutiveRunsWith(hand: RankedHand, minCount: number): Rank[][] {
  const eligible = hand.ranks.filter((rank) => isSequenceable(rank) && hand.countOf(rank) >= minCount);
  const runs: Rank[][] = [];
  let current: Rank[] = [];
  for (const rank of eligible) {
    if (current.length === 0 || rank === current[current.length - 1] + 1) current.push(rank);
    else {
      runs.push(current);
      current = [rank];
    }
  }
  if (current.length > 0) runs.push(current);
  return runs;
}

function subRuns(run: Rank[], minLength: number): Rank[][] {
  const out: Rank[][] = [];
  for (let length = minLength; length <= run.length; length += 1) {
    for (let index = 0; index + length <= run.length; index += 1) {
      out.push(run.slice(index, index + length));
    }
  }
  return out;
}

function exactRuns(hand: RankedHand, minCount: number, length: number): Rank[][] {
  if (!Number.isInteger(length) || length <= 0) return [];
  const out: Rank[][] = [];
  for (const run of consecutiveRunsWith(hand, minCount)) {
    for (let index = 0; index + length <= run.length; index += 1) {
      out.push(run.slice(index, index + length));
    }
  }
  return out;
}

function addRocket(hand: RankedHand, add: (cards: Card[]) => void): void {
  if (hand.countOf(Rank.SmallJoker) >= 1 && hand.countOf(Rank.BigJoker) >= 1) {
    add([...hand.take(Rank.SmallJoker, 1), ...hand.take(Rank.BigJoker, 1)]);
  }
}

/** 枚举一手牌在「领出」时可出的全部合法牌型。 */
export function enumerateMoves(hand: Card[]): Move[] {
  const moves: Move[] = [];
  const seen = new Set<string>();

  const byRank = new Map<Rank, Card[]>();
  for (const c of hand) {
    const a = byRank.get(c.rank);
    if (a) a.push(c);
    else byRank.set(c.rank, [c]);
  }
  const ranks = Array.from(byRank.keys()).sort((a, b) => a - b);
  const countOf = (r: Rank): number => byRank.get(r)?.length ?? 0;
  const take = (r: Rank, k: number): Card[] => (byRank.get(r) ?? []).slice(0, k);

  const add = (cards: Card[]): void => {
    if (cards.length === 0) return;
    const p = recognize(cards);
    if (!p) return;
    const key =
      p.category + '|' + cards.map((c) => `${c.rank}${c.suit}`).sort().join(',');
    if (seen.has(key)) return;
    seen.add(key);
    moves.push({ cards: cards.slice(), pattern: p });
  };

  // 同点数基础牌型：单/对/三/炸弹
  for (const r of ranks) {
    const c = countOf(r);
    if (c >= 1) add(take(r, 1));
    if (c >= 2) add(take(r, 2));
    if (c >= 3) add(take(r, 3));
    if (c >= 4) add(take(r, 4));
  }

  // 火箭
  if (countOf(Rank.SmallJoker) >= 1 && countOf(Rank.BigJoker) >= 1) {
    add([...take(Rank.SmallJoker, 1), ...take(Rank.BigJoker, 1)]);
  }

  // 三带一 / 三带二
  const tripRanks = ranks.filter((r) => countOf(r) >= 3);
  for (const t of tripRanks) {
    for (const s of ranks) {
      if (s !== t && countOf(s) >= 1) add([...take(t, 3), ...take(s, 1)]);
    }
    for (const p of ranks) {
      if (p !== t && countOf(p) >= 2) add([...take(t, 3), ...take(p, 2)]);
    }
  }

  // 连续段工具
  const consecutiveRunsWith = (minCount: number): Rank[][] => {
    const elig = ranks.filter((r) => isSequenceable(r) && countOf(r) >= minCount);
    const runs: Rank[][] = [];
    let cur: Rank[] = [];
    for (const r of elig) {
      if (cur.length === 0 || r === cur[cur.length - 1] + 1) cur.push(r);
      else {
        runs.push(cur);
        cur = [r];
      }
    }
    if (cur.length) runs.push(cur);
    return runs;
  };
  const subRuns = (run: Rank[], minLen: number): Rank[][] => {
    const out: Rank[][] = [];
    for (let len = minLen; len <= run.length; len++) {
      for (let i = 0; i + len <= run.length; i++) out.push(run.slice(i, i + len));
    }
    return out;
  };

  // 顺子
  for (const run of consecutiveRunsWith(1)) {
    for (const sub of subRuns(run, 5)) add(sub.flatMap((r) => take(r, 1)));
  }

  // 连对
  for (const run of consecutiveRunsWith(2)) {
    for (const sub of subRuns(run, 3)) add(sub.flatMap((r) => take(r, 2)));
  }

  // 飞机（不带 / 带等量单 / 带等量对）
  for (const run of consecutiveRunsWith(3)) {
    for (const sub of subRuns(run, 2)) {
      const t = sub.length;
      const tripCards = sub.flatMap((r) => take(r, 3));
      add(tripCards);
      const inSub = new Set(sub);
      const singleWingRanks = ranks.filter((r) => !inSub.has(r) && countOf(r) >= 1);
      for (const wings of combinations(singleWingRanks, t)) {
        add([...tripCards, ...wings.flatMap((r) => take(r, 1))]);
      }
      const pairWingRanks = ranks.filter((r) => !inSub.has(r) && countOf(r) >= 2);
      for (const wings of combinations(pairWingRanks, t)) {
        add([...tripCards, ...wings.flatMap((r) => take(r, 2))]);
      }
    }
  }

  // 四带二（两张单牌 / 两对）
  for (const q of ranks.filter((r) => countOf(r) >= 4)) {
    const quad = take(q, 4);
    const singleRanks = ranks.filter((r) => r !== q && countOf(r) >= 1);
    for (const wings of combinations(singleRanks, 2)) {
      add([...quad, ...wings.flatMap((r) => take(r, 1))]);
    }
    const pairRanks = ranks.filter((r) => r !== q && countOf(r) >= 2);
    for (const wings of combinations(pairRanks, 2)) {
      add([...quad, ...wings.flatMap((r) => take(r, 2))]);
    }
  }

  return moves;
}

/** 针对当前牌权，枚举手牌中所有能压过它的着法。 */
export function legalFollows(hand: Card[], current: HandPattern): Move[] {
  const ranked = indexHand(hand);
  const { ranks, countOf, take } = ranked;
  const { moves, add } = createMoveCollector();

  // 火箭不可被压。
  if (current.category === Category.Rocket) return moves;

  // 旧枚举器把基础单/对/三与同点炸弹交错产出；这三类跟牌须保留该顺序。
  const basicCount = current.category === Category.Single
    ? 1
    : current.category === Category.Pair
      ? 2
      : current.category === Category.Trips
        ? 3
        : 0;
  if (basicCount > 0) {
    for (const rank of ranks) {
      if (current.length === basicCount && rank > current.mainRank && countOf(rank) >= basicCount) {
        add(take(rank, basicCount));
      }
      if (countOf(rank) >= 4) add(take(rank, 4));
    }
    addRocket(ranked, add);
    return moves;
  }

  // 其余牌型在旧枚举顺序中都位于炸弹、火箭之后。
  for (const rank of ranks) {
    if (countOf(rank) >= 4
      && (current.category !== Category.Bomb || rank > current.mainRank)) {
      add(take(rank, 4));
    }
  }
  addRocket(ranked, add);
  if (current.category === Category.Bomb) return moves;

  if (current.category === Category.TripsSingle && current.length === 4) {
    for (const tripRank of ranks.filter((rank) => countOf(rank) >= 3 && rank > current.mainRank)) {
      for (const wingRank of ranks) {
        if (wingRank !== tripRank && countOf(wingRank) >= 1) {
          add([...take(tripRank, 3), ...take(wingRank, 1)]);
        }
      }
    }
    return moves;
  }

  if (current.category === Category.TripsPair && current.length === 5) {
    for (const tripRank of ranks.filter((rank) => countOf(rank) >= 3 && rank > current.mainRank)) {
      for (const wingRank of ranks) {
        if (wingRank !== tripRank && countOf(wingRank) >= 2) {
          add([...take(tripRank, 3), ...take(wingRank, 2)]);
        }
      }
    }
    return moves;
  }

  if (current.category === Category.Straight && current.length >= 5) {
    for (const run of exactRuns(ranked, 1, current.length)) {
      if (run[run.length - 1] > current.mainRank) add(run.flatMap((rank) => take(rank, 1)));
    }
    return moves;
  }

  if (current.category === Category.ConsecutivePairs
    && current.length >= 6
    && current.length % 2 === 0) {
    for (const run of exactRuns(ranked, 2, current.length / 2)) {
      if (run[run.length - 1] > current.mainRank) add(run.flatMap((rank) => take(rank, 2)));
    }
    return moves;
  }

  const airplaneGroups = current.category === Category.Airplane
    ? current.length / 3
    : current.category === Category.AirplaneSingles
      ? current.length / 4
      : current.category === Category.AirplanePairs
        ? current.length / 5
        : 0;
  if (Number.isInteger(airplaneGroups) && airplaneGroups >= 2) {
    for (const run of exactRuns(ranked, 3, airplaneGroups)) {
      if (run[run.length - 1] <= current.mainRank) continue;
      const tripCards = run.flatMap((rank) => take(rank, 3));
      if (current.category === Category.Airplane) {
        add(tripCards);
        continue;
      }
      const inRun = new Set(run);
      const wingCount = current.category === Category.AirplaneSingles ? 1 : 2;
      const wingRanks = ranks.filter((rank) => !inRun.has(rank) && countOf(rank) >= wingCount);
      for (const wings of combinations(wingRanks, airplaneGroups)) {
        add([...tripCards, ...wings.flatMap((rank) => take(rank, wingCount))]);
      }
    }
    return moves;
  }

  if (current.category === Category.FourPlusTwoSingles && current.length === 6) {
    for (const quadRank of ranks.filter((rank) => countOf(rank) >= 4 && rank > current.mainRank)) {
      const wingRanks = ranks.filter((rank) => rank !== quadRank && countOf(rank) >= 1);
      for (const wings of combinations(wingRanks, 2)) {
        add([...take(quadRank, 4), ...wings.flatMap((rank) => take(rank, 1))]);
      }
    }
    return moves;
  }

  if (current.category === Category.FourPlusTwoPairs && current.length === 8) {
    for (const quadRank of ranks.filter((rank) => countOf(rank) >= 4 && rank > current.mainRank)) {
      const wingRanks = ranks.filter((rank) => rank !== quadRank && countOf(rank) >= 2);
      for (const wings of combinations(wingRanks, 2)) {
        add([...take(quadRank, 4), ...wings.flatMap((rank) => take(rank, 2))]);
      }
    }
  }

  return moves;
}
