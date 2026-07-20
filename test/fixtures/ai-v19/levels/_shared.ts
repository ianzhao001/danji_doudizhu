import {
  Category,
  Rank,
  Suit,
  isBombLike,
  type Card,
  type Move,
} from '../../../../assets/scripts/rules';
import type { AiStrategy } from '../strategy';
import { canFinishInOneMove, finishingFollow } from '../endgame';

interface ProtectedCards {
  bombRanks: Set<Rank>;
  rocket: boolean;
}

type Snapshot = Parameters<AiStrategy>[0];

const SUIT_ORDER: Record<Suit, number> = {
  [Suit.Spade]: 0,
  [Suit.Heart]: 1,
  [Suit.Club]: 2,
  [Suit.Diamond]: 3,
  [Suit.Joker]: 4,
};

export function requireHand(snapshot: Snapshot): Card[] {
  if (!snapshot.viewerHand || snapshot.viewerHand.length === 0) throw new Error('VIEWER_HAND_REQUIRED');
  return snapshot.viewerHand;
}

export function isTeammateTop(snapshot: Snapshot): boolean {
  return (
    snapshot.top !== null &&
    snapshot.turn !== snapshot.landlord &&
    snapshot.top.seat !== snapshot.landlord &&
    snapshot.top.seat !== snapshot.turn
  );
}

function sortedCards(move: Move): Card[] {
  return move.cards.slice().sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
  });
}

export function compareMoves(a: Move, b: Move): number {
  if (a.cards.length !== b.cards.length) return a.cards.length - b.cards.length;
  if (a.pattern.category !== b.pattern.category) return a.pattern.category - b.pattern.category;
  if (a.pattern.mainRank !== b.pattern.mainRank) return a.pattern.mainRank - b.pattern.mainRank;

  const aCards = sortedCards(a);
  const bCards = sortedCards(b);
  for (let i = 0; i < Math.min(aCards.length, bCards.length); i++) {
    if (aCards[i].rank !== bCards[i].rank) return aCards[i].rank - bCards[i].rank;
  }
  for (let i = 0; i < Math.min(aCards.length, bCards.length); i++) {
    const suitDiff = SUIT_ORDER[aCards[i].suit] - SUIT_ORDER[bCards[i].suit];
    if (suitDiff !== 0) return suitDiff;
  }
  return 0;
}

function compareBombLike(a: Move, b: Move): number {
  const aRocket = a.pattern.category === Category.Rocket;
  const bRocket = b.pattern.category === Category.Rocket;
  if (aRocket !== bRocket) return aRocket ? 1 : -1;
  return compareMoves(a, b);
}

export function pickSmallest(moves: Move[]): Move {
  if (moves.length === 0) throw new Error('NO_LEGAL_MOVES');
  return moves.slice().sort(compareMoves)[0];
}

export function pickLargest(moves: Move[]): Move {
  if (moves.length === 0) throw new Error('NO_LEGAL_MOVES');
  return moves.slice().sort(compareMoves)[moves.length - 1];
}

export function pickSmallestBombLike(moves: Move[]): Move {
  if (moves.length === 0) throw new Error('NO_LEGAL_BOMB');
  return moves.slice().sort(compareBombLike)[0];
}

export function protectedCards(hand: Card[]): ProtectedCards {
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

export function usesProtectedCards(move: Move, protectedSet: ProtectedCards): boolean {
  return move.cards.some(
    (card) => protectedSet.bombRanks.has(card.rank) || (protectedSet.rocket && isRocketCard(card)),
  );
}

export function bombLikeMoves(moves: Move[]): Move[] {
  return moves.filter((move) => isBombLike(move.pattern.category));
}

export function toPlay(snapshot: Snapshot, move: Move) {
  return { type: 'play' as const, seat: snapshot.turn, cards: move.cards.slice() };
}

export function conservativeAction(snapshot: Snapshot, hand: Card[], moves: Move[]) {
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

/** 三档共用的清手前置：领出整手或跟牌整手均优先结束牌局。 */
export function chooseFinishingMove(snapshot: Snapshot, hand: Card[], moves: Move[]): Move | null {
  if (snapshot.top === null) {
    if (!canFinishInOneMove(hand)) return null;
    return moves.find((move) => move.cards.length === hand.length) ?? null;
  }
  return finishingFollow(hand, snapshot.top.pattern);
}

/** 农民队友报单/报双且地主未告急时，喂出最小安全单/对。 */
export function chooseFeedTeammateLead(snapshot: Snapshot, hand: Card[], moves: Move[]): Move | null {
  if (snapshot.turn === snapshot.landlord || snapshot.top !== null) return null;
  const teammate = ([0, 1, 2] as const).find(
    (seat) => seat !== snapshot.turn && seat !== snapshot.landlord,
  );
  if (teammate === undefined) return null;
  const teammateCount = snapshot.handCounts[teammate];
  if (teammateCount > 2 || snapshot.handCounts[snapshot.landlord] <= 2) return null;
  const protectedSet = protectedCards(hand);
  const wanted = teammateCount === 1 ? Category.Single : Category.Pair;
  const feeds = moves.filter(
    (move) => move.pattern.category === wanted
      && move.pattern.mainRank < Rank.A
      && !usesProtectedCards(move, protectedSet),
  );
  return feeds.length > 0 ? pickSmallest(feeds) : null;
}
