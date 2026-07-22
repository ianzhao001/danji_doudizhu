/**
 * 采样世界的三家全明精确求解器。
 *
 * endgameSolver 面向真实隐藏态，把两名对手合并成悲观方来证明 sound win；本模块
 * 面向 PIMC 已采样的全明世界，按地主/农民两阵营做完整极大极小。两者的信息面与
 * 证明目标不同，因此共存而不重复。
 */

import {
  Rank,
  Suit,
  enumerateMoves,
  isBombLike,
  legalFollows,
  type Card,
  type HandPattern,
  type Move,
} from '../rules';
import type { SeatIndex } from '../game';

export type WorldWinner = 'landlord' | 'farmer';

export interface WorldSolverBudget {
  nodes: number;
}

export interface SolveWorldArgs {
  counts: [number[], number[], number[]];
  turn: SeatIndex;
  landlord: SeatIndex;
  top: HandPattern | null;
  topSeat: SeatIndex | null;
  passes?: number;
  budget: WorldSolverBudget;
  table?: Map<string, WorldWinner>;
}

interface SearchState {
  counts: [number[], number[], number[]];
  turn: SeatIndex;
  landlord: SeatIndex;
  top: HandPattern | null;
  topSeat: SeatIndex | null;
  passes: number;
}

const TABLES = new WeakMap<WorldSolverBudget, Map<string, WorldWinner>>();
const NORMAL_SUITS = [Suit.Spade, Suit.Heart, Suit.Club, Suit.Diamond] as const;

function cardCount(counts: readonly number[]): number {
  let total = 0;
  for (let rank = Rank.R3; rank <= Rank.BigJoker; rank += 1) total += counts[rank] ?? 0;
  return total;
}

function cardsFromCounts(counts: readonly number[]): Card[] {
  const cards: Card[] = [];
  for (let rank = Rank.R3; rank <= Rank.R2; rank += 1) {
    const amount = counts[rank] ?? 0;
    for (let index = 0; index < amount; index += 1) {
      cards.push({ rank: rank as Rank, suit: NORMAL_SUITS[index]! });
    }
  }
  if ((counts[Rank.SmallJoker] ?? 0) > 0) cards.push({ rank: Rank.SmallJoker, suit: Suit.Joker });
  if ((counts[Rank.BigJoker] ?? 0) > 0) cards.push({ rank: Rank.BigJoker, suit: Suit.Joker });
  return cards;
}

function removeMove(counts: readonly number[], move: Move): number[] {
  const next = counts.slice();
  for (const card of move.cards) {
    next[card.rank] -= 1;
    if (next[card.rank] < 0) throw new Error('WORLD_SOLVER_OVERDRAW');
  }
  return next;
}

function moveKey(move: Move): string {
  return `${move.pattern.category}:${move.pattern.mainRank}:${move.pattern.length}:${move.cards
    .map((card) => `${card.rank}:${card.suit}`)
    .sort()
    .join(',')}`;
}

function legalMoves(counts: readonly number[], top: HandPattern | null): Move[] {
  const hand = cardsFromCounts(counts);
  const moves = top ? legalFollows(hand, top) : enumerateMoves(hand);
  const total = cardCount(counts);
  return moves.slice().sort((left, right) => {
    const leftPriority = left.cards.length === total ? 0 : isBombLike(left.pattern.category) ? 2 : 1;
    const rightPriority = right.cards.length === total ? 0 : isBombLike(right.pattern.category) ? 2 : 1;
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    const leftKey = moveKey(left);
    const rightKey = moveKey(right);
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
}

function stateKey(state: SearchState): string {
  const top = state.top
    ? `${state.top.category}:${state.top.mainRank}:${state.top.length}`
    : '-';
  return `${state.counts.map((row) => row.join(',')).join('|')}|${state.turn}|${state.landlord}|${top}|${state.topSeat ?? 'n'}|${state.passes}`;
}

function winnerFor(seat: SeatIndex, landlord: SeatIndex): WorldWinner {
  return seat === landlord ? 'landlord' : 'farmer';
}

function opponent(side: WorldWinner): WorldWinner {
  return side === 'landlord' ? 'farmer' : 'landlord';
}

function search(
  state: SearchState,
  budget: WorldSolverBudget,
  table: Map<string, WorldWinner>,
): WorldWinner | null {
  const key = stateKey(state);
  const cached = table.get(key);
  if (cached) return cached;
  // A state needs one node for expansion and at least one for resolving an
  // action/terminal child. Keeping that reserve makes tiny budgets degrade to
  // the caller's rollout path instead of claiming an unsearched exact result.
  if (budget.nodes <= 1) return null;
  budget.nodes -= 1;

  const side = winnerFor(state.turn, state.landlord);
  const moves = legalMoves(state.counts[state.turn], state.top);
  let unknown = false;

  for (const move of moves) {
    const nextCounts = state.counts.map((row) => row.slice()) as [number[], number[], number[]];
    nextCounts[state.turn] = removeMove(nextCounts[state.turn], move);
    let verdict: WorldWinner | null;
    if (cardCount(nextCounts[state.turn]) === 0) {
      verdict = side;
    } else {
      verdict = search({
        counts: nextCounts,
        turn: ((state.turn + 1) % 3) as SeatIndex,
        landlord: state.landlord,
        top: move.pattern,
        topSeat: state.turn,
        passes: 0,
      }, budget, table);
    }
    if (verdict === side) {
      table.set(key, side);
      return side;
    }
    if (verdict === null) unknown = true;
  }

  if (state.top !== null && state.topSeat !== null) {
    const nextPasses = state.passes + 1;
    const verdict = nextPasses >= 2
      ? search({
        counts: state.counts,
        turn: state.topSeat,
        landlord: state.landlord,
        top: null,
        topSeat: null,
        passes: 0,
      }, budget, table)
      : search({
        counts: state.counts,
        turn: ((state.turn + 1) % 3) as SeatIndex,
        landlord: state.landlord,
        top: state.top,
        topSeat: state.topSeat,
        passes: nextPasses,
      }, budget, table);
    if (verdict === side) {
      table.set(key, side);
      return side;
    }
    if (verdict === null) unknown = true;
  }

  if (unknown) return null;
  const result = opponent(side);
  table.set(key, result);
  return result;
}

export function solveWorld(args: SolveWorldArgs): WorldWinner | null {
  if (!Number.isInteger(args.budget.nodes) || args.budget.nodes < 0) {
    throw new Error('INVALID_WORLD_SOLVER_BUDGET');
  }
  let table = args.table ?? TABLES.get(args.budget);
  if (!table) {
    table = new Map<string, WorldWinner>();
    TABLES.set(args.budget, table);
  }
  return search({
    counts: args.counts.map((row) => row.slice()) as [number[], number[], number[]],
    turn: args.turn,
    landlord: args.landlord,
    top: args.top,
    topSeat: args.topSeat,
    passes: args.passes ?? 0,
  }, args.budget, table);
}
