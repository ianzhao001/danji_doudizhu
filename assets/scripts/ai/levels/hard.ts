/**
 * M4-03 困难 AI（积极控权 + 择时炸弹·确定性）。实现方：实现 hardStrategy 函数体，
 * 使 test/ai/hard.test.ts 转绿。规则见 coordination/tasks/M4-03-ai-hard.md。
 * 仅依赖 rules + 只读快照，禁止 import `cc`，禁止改签名。
 */

import { Category, enumerateMoves, isBombLike, legalFollows, Rank, type Card, type Move } from '../../rules';
import type { AiStrategy } from '../strategy';

interface ProtectedCards {
  bombRanks: Set<Rank>;
  rocket: boolean;
}

function requireHand(snapshot: Parameters<AiStrategy>[0]): Card[] {
  if (!snapshot.viewerHand || snapshot.viewerHand.length === 0) throw new Error('VIEWER_HAND_REQUIRED');
  return snapshot.viewerHand;
}

function compareMoves(a: Move, b: Move): number {
  if (a.cards.length !== b.cards.length) return a.cards.length - b.cards.length;
  return a.pattern.mainRank - b.pattern.mainRank;
}

function compareBombLike(a: Move, b: Move): number {
  const aRocket = a.pattern.category === Category.Rocket;
  const bRocket = b.pattern.category === Category.Rocket;
  if (aRocket !== bRocket) return aRocket ? 1 : -1;
  return a.pattern.mainRank - b.pattern.mainRank;
}

function pickSmallest(moves: Move[]): Move {
  if (moves.length === 0) throw new Error('NO_LEGAL_MOVES');
  return moves.slice().sort(compareMoves)[0];
}

function pickSmallestBombLike(moves: Move[]): Move {
  if (moves.length === 0) throw new Error('NO_LEGAL_BOMB');
  return moves.slice().sort(compareBombLike)[0];
}

function protectedCards(hand: Card[]): ProtectedCards {
  const counts = new Map<Rank, number>();
  for (const card of hand) counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);

  const bombRanks = new Set<Rank>();
  for (const [rank, count] of counts) {
    if (count === 4) bombRanks.add(rank);
  }

  return {
    bombRanks,
    rocket: (counts.get(Rank.SmallJoker) ?? 0) > 0 && (counts.get(Rank.BigJoker) ?? 0) > 0,
  };
}

function isRocketCard(card: Card): boolean {
  return card.rank === Rank.SmallJoker || card.rank === Rank.BigJoker;
}

function usesProtectedCards(move: Move, protectedSet: ProtectedCards): boolean {
  return move.cards.some(
    (card) => protectedSet.bombRanks.has(card.rank) || (protectedSet.rocket && isRocketCard(card)),
  );
}

function bombLikeMoves(moves: Move[]): Move[] {
  return moves.filter((move) => isBombLike(move.pattern.category));
}

function toPlay(snapshot: Parameters<AiStrategy>[0], move: Move) {
  return { type: 'play' as const, seat: snapshot.turn, cards: move.cards.slice() };
}

function isPressing(snapshot: Parameters<AiStrategy>[0]): boolean {
  return snapshot.handCounts.some((count, seat) => seat !== snapshot.turn && count <= 2);
}

function conservativeAction(snapshot: Parameters<AiStrategy>[0], hand: Card[], moves: Move[]) {
  const protectedSet = protectedCards(hand);
  const safeMoves = moves.filter(
    (move) => !isBombLike(move.pattern.category) && !usesProtectedCards(move, protectedSet),
  );
  if (safeMoves.length > 0) return toPlay(snapshot, pickSmallest(safeMoves));

  const bombs = bombLikeMoves(moves);
  const finishingBombs = bombs.filter((move) => move.cards.length === hand.length);
  if (finishingBombs.length > 0) return toPlay(snapshot, pickSmallestBombLike(finishingBombs));

  if (snapshot.top) {
    if (bombs.length > 0) return toPlay(snapshot, pickSmallestBombLike(bombs));
    return { type: 'pass' as const, seat: snapshot.turn };
  }

  return toPlay(snapshot, pickSmallest(moves));
}

/** 积极控权策略桩：实现见 M4-03。 */
export const hardStrategy: AiStrategy = (snapshot) => {
  const hand = requireHand(snapshot);
  const moves = snapshot.top ? legalFollows(hand, snapshot.top.pattern) : enumerateMoves(hand);

  if (snapshot.top && moves.length === 0) return { type: 'pass', seat: snapshot.turn };

  if (isPressing(snapshot)) {
    const bombs = bombLikeMoves(moves);
    if (bombs.length > 0) return toPlay(snapshot, pickSmallestBombLike(bombs));
  }

  return conservativeAction(snapshot, hand, moves);
};
