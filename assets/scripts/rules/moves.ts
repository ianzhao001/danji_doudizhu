/**
 * 合法着法枚举，供 AI 决策与 UI「提示」复用。
 * 所有候选都经 recognize() 守卫，保证只产出合法牌型。
 * 枚举按点数组合完整覆盖，不展开同点数不同花色的等价排列。
 */

import { Card, Rank, isSequenceable } from './card';
import { HandPattern, recognize } from './pattern';
import { beats } from './compare';

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
  const ranks = [...byRank.keys()].sort((a, b) => a - b);
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
  return enumerateMoves(hand).filter((m) => beats(m.pattern, current));
}
