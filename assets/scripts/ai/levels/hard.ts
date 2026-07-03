/**
 * M4-03 困难 AI（积极控权 + 择时炸弹·确定性）。实现方：实现 hardStrategy 函数体，
 * 使 test/ai/hard.test.ts 转绿。规则见 coordination/tasks/M4-03-ai-hard.md。
 * 仅依赖 rules + 只读快照，禁止 import `cc`，禁止改签名。
 */

import {
  Category,
  Rank,
  enumerateMoves,
  isBombLike,
  legalFollows,
  type Card,
  type Move,
} from '../../rules';
import { cardKey } from '../../rules/guards';
import { trackPlayed } from '../cardMemory';
import { canFinishInOneMove, finishingFollow } from '../endgame';
import { evaluateHand } from '../handStrength';
import type { AiStrategy } from '../strategy';
import {
  bombLikeMoves,
  compareMoves,
  conservativeAction,
  isTeammateTop,
  pickLargest,
  pickSmallest,
  pickSmallestBombLike,
  protectedCards,
  requireHand,
  toPlay,
  usesProtectedCards,
} from './_shared';

function isPressing(snapshot: Parameters<AiStrategy>[0]): boolean {
  return snapshot.handCounts.some((count, seat) => seat !== snapshot.turn && count <= 2);
}

function rankCounts(cards: Card[]): ReadonlyMap<Rank, number> {
  const counts = new Map<Rank, number>();
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
  }
  return counts;
}

function removeMoveCards(hand: Card[], move: Move): Card[] {
  const remainingMoveCards = new Map<string, number>();
  for (const card of move.cards) {
    const key = cardKey(card);
    remainingMoveCards.set(key, (remainingMoveCards.get(key) ?? 0) + 1);
  }

  const remaining: Card[] = [];
  for (const card of hand) {
    const key = cardKey(card);
    const used = remainingMoveCards.get(key) ?? 0;
    if (used > 0) {
      remainingMoveCards.set(key, used - 1);
    } else {
      remaining.push(card);
    }
  }

  return remaining;
}

function roughTurnCount(cards: Card[]): number {
  if (cards.length === 0) return 0;
  if (canFinishInOneMove(cards)) return 1;

  const counts = rankCounts(cards);
  const groups = Array.from(counts.values()).filter((count) => count > 0).length;
  const { bombs, longestStraight, rockets } = evaluateHand(cards);
  const straightReduction = Math.max(0, longestStraight - 4);
  const controlGroups = bombs + rockets;

  return Math.max(1, groups - straightReduction - controlGroups);
}

type MemoryPressure = Readonly<{
  highPressure: boolean;
  unseenHighCards: number;
  possibleBombRanks: number;
}>;

function estimateMemoryPressure(hand: Card[]): MemoryPressure {
  const memory = trackPlayed([], hand);
  const highRanks = [Rank.R2, Rank.SmallJoker, Rank.BigJoker] as const;
  const unseenHighCards = highRanks.reduce((sum, rank) => sum + (memory.remainingByRank[rank] ?? 0), 0);
  const possibleBombRanks = Object.entries(memory.remainingByRank).filter(
    ([rank, count]) => Number(rank) <= Rank.R2 && count === 4,
  ).length;

  return {
    highPressure: unseenHighCards >= 3 || possibleBombRanks >= 3,
    unseenHighCards,
    possibleBombRanks,
  };
}

function categoryShapingBonus(move: Move): number {
  switch (move.pattern.category) {
    case Category.Straight:
      return 42;
    case Category.Airplane:
    case Category.AirplaneSingles:
    case Category.AirplanePairs:
      return 40;
    case Category.ConsecutivePairs:
      return 34;
    case Category.TripsPair:
      return 24;
    case Category.TripsSingle:
      return 18;
    case Category.Trips:
      return 14;
    case Category.Pair:
      return 6;
    default:
      return 0;
  }
}

function highCardSpendPenalty(move: Move, pressure: MemoryPressure): number {
  const pressureMultiplier = pressure.highPressure ? 7 : 3;
  return move.cards.reduce((sum, card) => {
    if (card.rank >= Rank.R2) return sum + pressureMultiplier * 2;
    if (card.rank >= Rank.A) return sum + pressureMultiplier;
    return sum;
  }, 0);
}

function scoreLeadMove(hand: Card[], move: Move, pressure: MemoryPressure): number {
  const remaining = removeMoveCards(hand, move);
  const remainingStrength = evaluateHand(remaining);
  return (
    roughTurnCount(remaining) * 120 +
    remainingStrength.score * 0.35 -
    move.cards.length * 10 -
    categoryShapingBonus(move) +
    highCardSpendPenalty(move, pressure)
  );
}

function chooseByLowestScore(moves: readonly Move[], score: (move: Move) => number): Move {
  return moves.slice().sort((left, right) => {
    const byScore = score(left) - score(right);
    return byScore !== 0 ? byScore : compareMoves(left, right);
  })[0]!;
}

function chooseFinishingMove(
  hand: Card[],
  moves: readonly Move[],
  snapshot: Parameters<AiStrategy>[0],
): Move | null {
  if (snapshot.top === null) {
    if (!canFinishInOneMove(hand)) return null;
    return moves.find((move) => move.cards.length === hand.length) ?? null;
  }

  return finishingFollow(hand, snapshot.top.pattern);
}

function chooseLeadMove(hand: Card[], moves: Move[]): Move {
  const protectedSet = protectedCards(hand);
  const pressure = estimateMemoryPressure(hand);
  const shapingCandidates = moves.filter(
    (move) => !isBombLike(move.pattern.category) && !usesProtectedCards(move, protectedSet),
  );

  if (shapingCandidates.length === 0) return pickSmallest(moves);
  return chooseByLowestScore(shapingCandidates, (move) => scoreLeadMove(hand, move, pressure));
}

/** 积极控权策略桩：实现见 M4-03。 */
export const hardStrategy: AiStrategy = (snapshot) => {
  const hand = requireHand(snapshot);
  const moves = snapshot.top ? legalFollows(hand, snapshot.top.pattern) : enumerateMoves(hand);

  if (snapshot.top && moves.length === 0) return { type: 'pass', seat: snapshot.turn };

  const finishingMove = chooseFinishingMove(hand, moves, snapshot);
  if (finishingMove !== null) return toPlay(snapshot, finishingMove);

  if (isTeammateTop(snapshot)) return { type: 'pass', seat: snapshot.turn };

  if (isPressing(snapshot)) {
    const bombs = bombLikeMoves(moves);
    if (bombs.length > 0) return toPlay(snapshot, pickSmallestBombLike(bombs));
    if (snapshot.top) return toPlay(snapshot, pickLargest(moves));
  }

  if (!snapshot.top) return toPlay(snapshot, chooseLeadMove(hand, moves));

  return conservativeAction(snapshot, hand, moves);
};
