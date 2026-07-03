import { Category, Rank, isBombLike, type Card, type Move } from '../../rules';
import { compareMoves, pickSmallest, protectedCards, usesProtectedCards } from './_shared';

const COMBO_BONUS: Partial<Record<Category, number>> = {
  [Category.ConsecutivePairs]: 1000,
  [Category.Straight]: 960,
  [Category.AirplanePairs]: 940,
  [Category.AirplaneSingles]: 920,
  [Category.Airplane]: 900,
  [Category.TripsPair]: 840,
  [Category.TripsSingle]: 820,
  [Category.Trips]: 700,
  [Category.Pair]: 120,
};

function leadScore(move: Move): number {
  const comboBonus = COMBO_BONUS[move.pattern.category] ?? 0;
  const lengthBonus = move.cards.length >= 2 ? move.cards.length * 12 : 0;
  return comboBonus + lengthBonus - move.pattern.mainRank;
}

function byBestLeadScore(left: Move, right: Move): number {
  const byScore = leadScore(right) - leadScore(left);
  return byScore !== 0 ? byScore : compareMoves(left, right);
}

function hasDuplicatedRank(cards: readonly Card[]): boolean {
  const seen = new Set<Rank>();
  for (const card of cards) {
    if (seen.has(card.rank)) return true;
    seen.add(card.rank);
  }
  return false;
}

function isFragileShortStraight(hand: readonly Card[], move: Move): boolean {
  return (
    move.pattern.category === Category.Straight &&
    move.cards.length === 5 &&
    hand.length - move.cards.length >= 2 &&
    !hasDuplicatedRank(hand)
  );
}

export function safeLeadMoves(hand: Card[], moves: readonly Move[]): Move[] {
  const protectedSet = protectedCards(hand);
  return moves.filter(
    (move) => !isBombLike(move.pattern.category) && !usesProtectedCards(move, protectedSet),
  );
}

export function chooseNormalLeadMove(hand: Card[], moves: Move[]): Move {
  const candidates = safeLeadMoves(hand, moves);
  if (candidates.length === 0) return pickSmallest(moves);

  const combos = candidates.filter(
    (move) => move.cards.length >= 2 && !isFragileShortStraight(hand, move),
  );
  if (combos.length === 0) return pickSmallest(candidates);

  return combos.slice().sort(byBestLeadScore)[0]!;
}
