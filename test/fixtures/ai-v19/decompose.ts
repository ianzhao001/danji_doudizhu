/**
 * v1.6 W-AUDIT-AI B1:精确手牌拆解引擎——最少手数与最优分解。
 * 纯层纯函数:零 cc / 零时基 / 零随机(architecture-gates 门①③护航)。
 * 算法:最低点覆盖分支——任何分解必有且仅有一个组件覆盖当前最低点,
 * 枚举所有含最低点的合法组件(单/对/三/炸/火箭/顺子/连对/三带翼/飞机±翼/[可选]四带二),
 * 递归 + 按「点数计数状态」记忆化;确定性:分支序固定、无时基预算——
 * 节点预算按展开状态数计,耗尽整查询回退确定性贪心(exact=false)。
 */
import { Rank, isSequenceable, recognize, type Card, type HandPattern } from '../../../assets/scripts/rules';

export interface DecomposeComponent {
  cards: Card[];
  pattern: HandPattern;
}

export interface DecomposeResult {
  /** 最少手数;exact=false 时为可达上界(贪心)。 */
  moveCount: number;
  exact: boolean;
  /** 达成 moveCount 的一个分解(组件即整手可出的合法牌型,含翼)。 */
  components: DecomposeComponent[];
}

export interface DecomposeOptions {
  /** 允许拆散四张炸(单/对/三/顺子取用)并作四带二载体;默认 false:炸弹与火箭恒作独立控牌。 */
  spendBombs?: boolean;
  /** 展开状态数预算;耗尽整查询走贪心回退。默认 80000。 */
  nodeBudget?: number;
}

/** 组件消耗描述:[rank, 张数] 列表(翼与主体并列)。 */
type Take = ReadonlyArray<readonly [number, number]>;

interface MemoEntry {
  count: number;
  best: Take | null;
}

const MIN_RANK = Rank.R3;
const MAX_RANK = Rank.BigJoker;
const DEFAULT_NODE_BUDGET = 80_000;
const BUDGET_EXCEEDED = Symbol('decompose-budget-exceeded');

function combinationsOf(pool: readonly number[], size: number): number[][] {
  if (size === 0) return [[]];
  if (size > pool.length) return [];
  const out: number[][] = [];
  const walk = (start: number, picked: number[]): void => {
    if (picked.length === size) {
      out.push(picked.slice());
      return;
    }
    const need = size - picked.length;
    for (let i = start; i <= pool.length - need; i++) {
      picked.push(pool[i]);
      walk(i + 1, picked);
      picked.pop();
    }
  };
  walk(0, []);
  return out;
}

/** 手牌拆解器:同一实例内所有查询共享 memo(同一决策帧的候选间大量复用子状态)。 */
export class Decomposer {
  private readonly memo = new Map<string, MemoEntry>();
  private readonly spendBombs: boolean;
  private readonly nodeBudget: number;
  private expanded = 0;

  constructor(options?: DecomposeOptions) {
    this.spendBombs = options?.spendBombs ?? false;
    this.nodeBudget = options?.nodeBudget ?? DEFAULT_NODE_BUDGET;
  }

  decompose(hand: Card[]): DecomposeResult {
    const counts = toCounts(hand);
    try {
      const count = this.dfs(counts);
      const takes = this.rebuild(counts);
      return { moveCount: count, exact: true, components: materialize(hand, takes) };
    } catch (error) {
      if (error !== BUDGET_EXCEEDED) throw error;
      const takes = greedyTakes(toCounts(hand), this.spendBombs);
      return { moveCount: takes.length, exact: false, components: materialize(hand, takes) };
    }
  }

  /** 打出 played 后的结构代价 = (1 + 余牌最少手数) − 原手最少手数;0 即「整组件出牌」。 */
  structureCost(hand: Card[], played: Card[]): number {
    const before = this.decompose(hand).moveCount;
    const after = this.decompose(removeCards(hand, played)).moveCount;
    return 1 + after - before;
  }

  private dfs(counts: number[]): number {
    const key = counts.join('');
    const hit = this.memo.get(key);
    if (hit) return hit.count;

    const r = lowestRank(counts);
    if (r === -1) {
      this.memo.set(key, { count: 0, best: null });
      return 0;
    }
    if (++this.expanded > this.nodeBudget) throw BUDGET_EXCEEDED;

    let best = Number.POSITIVE_INFINITY;
    let bestTake: Take | null = null;
    for (const take of this.branches(counts, r)) {
      applyTake(counts, take, -1);
      const sub = 1 + this.dfs(counts);
      applyTake(counts, take, +1);
      if (sub < best) {
        best = sub;
        bestTake = take;
      }
    }
    this.memo.set(key, { count: best, best: bestTake });
    return best;
  }

  /** 沿 memo 的 best 链重建一条最优分解路径(dfs 已算完,全程命中)。 */
  private rebuild(counts: number[]): Take[] {
    const takes: Take[] = [];
    const cur = counts.slice();
    for (;;) {
      const entry = this.memo.get(cur.join(''));
      if (!entry || entry.best === null) break;
      takes.push(entry.best);
      applyTake(cur, entry.best, -1);
    }
    return takes;
  }

  /**
   * 覆盖最低点 r 的全部合法组件,固定顺序(结构优先,保证重建偏好链/翼)。
   * 两类:① r 作主体(单/对/三/炸/火箭/顺/连对/飞机核起点);② r 作更高载体的翼
   * (三带一/二、飞机翼、[可选]四带二翼)。形状与 rules/moves.ts 枚举口径一致,
   * 最终由 materialize 的 recognize 复核。
   */
  private branches(counts: number[], r: number): Take[] {
    const out: Take[] = [];
    const c = counts[r];
    const spend = this.spendBombs;

    // 火箭(仅当最低点已是小王)。Codex R1 阻断②修正:火箭保护下(!spendBombs)
    // 双王只许整出火箭——与四张炸同款早返回,否则王会漏成单牌/翼。
    if (r === Rank.SmallJoker && counts[Rank.BigJoker] > 0) {
      out.push([[Rank.SmallJoker, 1], [Rank.BigJoker, 1]]);
      if (!spend) return out;
    }

    // 四张炸:spendBombs=false 时强制整出(不许被顺子/翼/三带拆用)。
    if (c === 4) {
      out.push([[r, 4]]);
      if (!spend) return out;
      // r 作四带二主体(两单/两对翼,翼点各不同且 ≠ r)。
      const singlePool = ranksWith(counts, 1, spend, r);
      for (const wings of combinationsOf(singlePool, 2)) {
        out.push([[r, 4], [wings[0], 1], [wings[1], 1]]);
      }
      const pairPool = ranksWith(counts, 2, spend, r);
      for (const wings of combinationsOf(pairPool, 2)) {
        out.push([[r, 4], [wings[0], 2], [wings[1], 2]]);
      }
    }

    const availR = available(counts, r, spend);
    const chainCapFrom = (start: number, need: number): number => {
      if (!isSequenceable(start)) return 0;
      let len = 0;
      while (isSequenceable(start + len) && available(counts, start + len, spend) >= need) len += 1;
      return len;
    };

    // —— r 作飞机核起点(±翼,长核长翼优先) ——
    if (availR >= 3) {
      const cap = chainCapFrom(r, 3);
      for (let t = Math.min(cap, 6); t >= 2; t--) {
        this.pushPlane(out, counts, r, t, null);
      }
    }

    // —— r 作顺子起点(长优先,≥5) ——
    {
      const cap = Math.min(chainCapFrom(r, 1), 12);
      for (let len = cap; len >= 5; len--) {
        const take: Array<readonly [number, number]> = [];
        for (let i = 0; i < len; i++) take.push([r + i, 1]);
        out.push(take);
      }
    }

    // —— r 作连对起点(长优先,≥3) ——
    {
      const cap = Math.min(chainCapFrom(r, 2), 10);
      for (let len = cap; len >= 3; len--) {
        const take: Array<readonly [number, number]> = [];
        for (let i = 0; i < len; i++) take.push([r + i, 2]);
        out.push(take);
      }
    }

    // —— r 作三条主体(带二/带一/裸) ——
    if (availR >= 3) {
      for (const wing of ranksWith(counts, 2, spend, r)) out.push([[r, 3], [wing, 2]]);
      for (const wing of ranksWith(counts, 1, spend, r)) out.push([[r, 3], [wing, 1]]);
      out.push([[r, 3]]);
    }

    // —— r 作更高载体的翼 ——
    // 三带一翼=r / 三带二翼=rr(载体三条点 t > r)。
    for (const t of ranksWith(counts, 3, spend, r)) {
      out.push([[t, 3], [r, 1]]);
      if (availR >= 2) out.push([[t, 3], [r, 2]]);
    }
    // 飞机翼含 r:核心起点 s > r(核心不含 r,否则已由「r 作核起点」覆盖)。
    for (let s = r + 1; s <= Rank.A; s++) {
      if (available(counts, s, spend) < 3) continue;
      const cap = chainCapFrom(s, 3);
      for (let t = Math.min(cap, 6); t >= 2; t--) {
        this.pushPlane(out, counts, s, t, r);
      }
    }
    // 四带二翼含 r(spendBombs 才有四带二):[[q,4],[r,·],[s,·]]。
    if (spend) {
      for (let q = MIN_RANK; q <= Rank.R2; q++) {
        if (q === r || counts[q] !== 4) continue;
        for (const s of ranksWith(counts, 1, spend, q).filter((rank) => rank !== r)) {
          out.push([[q, 4], [r, 1], [s, 1]]);
        }
        if (availR >= 2) {
          for (const s of ranksWith(counts, 2, spend, q).filter((rank) => rank !== r)) {
            out.push([[q, 4], [r, 2], [s, 2]]);
          }
        }
      }
    }

    // —— r 作对/单(炸弹点在 spendBombs=false 下已提前 return,不会走到) ——
    if (availR >= 2) out.push([[r, 2]]);
    out.push([[r, 1]]);

    return out;
  }

  /** 生成起点 start、长度 t 的飞机(裸核 + 全部单翼/对翼组合);mustWing≠null 时翼必须含该点。 */
  private pushPlane(out: Take[], counts: number[], start: number, t: number, mustWing: number | null): void {
    const spend = this.spendBombs;
    const core: Array<readonly [number, number]> = [];
    for (let i = 0; i < t; i++) core.push([start + i, 3]);
    const inChain = new Set(core.map(([rank]) => rank));
    if (mustWing !== null && inChain.has(mustWing)) return;

    const singlePool = ranksWith(counts, 1, spend).filter(
      (rank) => !inChain.has(rank) && rank !== mustWing,
    );
    const singleNeed = mustWing === null ? t : t - 1;
    for (const wings of combinationsOf(singlePool, singleNeed)) {
      const wingTakes = wings.map((rank) => [rank, 1] as const);
      if (mustWing !== null) wingTakes.push([mustWing, 1] as const);
      out.push([...core, ...wingTakes]);
    }

    const pairPool = ranksWith(counts, 2, spend).filter(
      (rank) => !inChain.has(rank) && rank !== mustWing,
    );
    if (mustWing === null || available(counts, mustWing, spend) >= 2) {
      for (const wings of combinationsOf(pairPool, singleNeed)) {
        const wingTakes = wings.map((rank) => [rank, 2] as const);
        if (mustWing !== null) wingTakes.push([mustWing, 2] as const);
        out.push([...core, ...wingTakes]);
      }
    }

    if (mustWing === null) out.push(core);
  }
}

/** 便捷一次性拆解(内部新建 Decomposer,memo 不跨调用)。 */
export function decompose(hand: Card[], options?: DecomposeOptions): DecomposeResult {
  return new Decomposer(options).decompose(hand);
}

/** 便捷结构代价(同一 Decomposer 内两次拆解共享 memo)。 */
export function structureCost(hand: Card[], played: Card[], options?: DecomposeOptions): number {
  return new Decomposer(options).structureCost(hand, played);
}

function toCounts(hand: Card[]): number[] {
  const counts = new Array<number>(MAX_RANK + 1).fill(0);
  for (const card of hand) {
    if (card.rank < MIN_RANK || card.rank > MAX_RANK) throw new Error(`invalid rank: ${card.rank}`);
    counts[card.rank] += 1;
  }
  return counts;
}

function lowestRank(counts: number[]): number {
  for (let r = MIN_RANK; r <= MAX_RANK; r++) if (counts[r] > 0) return r;
  return -1;
}

/**
 * spendBombs=false 时,四张点只允许被「整炸」消耗、双王在手时王只允许整出火箭——
 * 对其他组件(单/对/翼/顺子取用)一律视作不可用。单王在手(火箭不成立)是普通大单,不受限。
 * Codex R1 阻断②修正:此前王被豁免出保护,双王会漏成飞机翼/单牌,违背声明并影响 hard 结构代价。
 */
function available(counts: number[], rank: number, spendBombs: boolean): number {
  if (spendBombs) return counts[rank];
  if ((rank === Rank.SmallJoker || rank === Rank.BigJoker)
    && counts[Rank.SmallJoker] > 0 && counts[Rank.BigJoker] > 0) {
    return 0;
  }
  if (rank <= Rank.R2 && counts[rank] === 4) return 0;
  return counts[rank];
}

function ranksWith(counts: number[], atLeast: number, spendBombs: boolean, exclude?: number): number[] {
  const out: number[] = [];
  for (let r = MIN_RANK; r <= MAX_RANK; r++) {
    if (r === exclude) continue;
    if (available(counts, r, spendBombs) >= atLeast) out.push(r);
  }
  return out;
}

function applyTake(counts: number[], take: Take, sign: 1 | -1): void {
  for (const [rank, n] of take) counts[rank] += sign * n;
}

function removeCards(hand: Card[], played: Card[]): Card[] {
  const rest = hand.slice();
  for (const card of played) {
    const at = rest.findIndex((c) => c.rank === card.rank && c.suit === card.suit);
    if (at === -1) throw new Error(`played card not in hand: ${card.rank}${card.suit}`);
    rest.splice(at, 1);
  }
  return rest;
}

/** 按 take 列表从真实手牌取牌并 recognize 复核,产出合法组件。 */
function materialize(hand: Card[], takes: Take[]): DecomposeComponent[] {
  const byRank = new Map<number, Card[]>();
  const sorted = hand
    .slice()
    .sort((a, b) => (a.rank - b.rank) || (a.suit < b.suit ? -1 : a.suit > b.suit ? 1 : 0));
  for (const card of sorted) {
    const bucket = byRank.get(card.rank);
    if (bucket) bucket.push(card);
    else byRank.set(card.rank, [card]);
  }
  return takes.map((take) => {
    const cards: Card[] = [];
    for (const [rank, n] of take) {
      const bucket = byRank.get(rank) ?? [];
      if (bucket.length < n) throw new Error(`decompose take overdraw at rank ${rank}`);
      cards.push(...bucket.splice(0, n));
    }
    const pattern = recognize(cards);
    if (!pattern) throw new Error(`decompose produced unrecognizable component: ${cards.map((c) => c.rank).join(',')}`);
    return { cards, pattern };
  });
}

/** 确定性贪心回退:顺子→飞机核→连对→整组,只保证合法与可达,不保证最少。 */
function greedyTakes(counts: number[], spendBombs: boolean): Take[] {
  const takes: Take[] = [];
  for (;;) {
    const r = lowestRank(counts);
    if (r === -1) return takes;
    const cap = (need: number): number => {
      if (!isSequenceable(r)) return 0;
      let len = 0;
      while (isSequenceable(r + len) && available(counts, r + len, spendBombs) >= need) len += 1;
      return len;
    };
    let take: Array<readonly [number, number]>;
    const straightCap = Math.min(cap(1), 12);
    const planeCap = Math.min(cap(3), 6);
    const pairCap = Math.min(cap(2), 10);
    if (counts[r] === 4 && !spendBombs) {
      take = [[r, 4]];
    } else if (straightCap >= 5) {
      take = [];
      for (let i = 0; i < straightCap; i++) take.push([r + i, 1]);
    } else if (planeCap >= 2) {
      take = [];
      for (let i = 0; i < planeCap; i++) take.push([r + i, 3]);
    } else if (pairCap >= 3) {
      take = [];
      for (let i = 0; i < pairCap; i++) take.push([r + i, 2]);
    } else if (r === Rank.SmallJoker && counts[Rank.BigJoker] > 0) {
      take = [[Rank.SmallJoker, 1], [Rank.BigJoker, 1]];
    } else {
      take = [[r, counts[r] === 4 ? 4 : Math.min(counts[r], 3)]];
    }
    takes.push(take);
    applyTake(counts, take, -1);
  }
}
