import { hintSuggestions } from './hint';
import { compareMoves } from './levels/_shared';
import { isBombLike, type Card, type HandPattern, type Move } from '../rules';

function cardKey(move: Move): string {
  return move.cards
    .map((card) => `${card.rank}:${card.suit}`)
    .sort()
    .join('|');
}

function compareRankedHints(a: Move, b: Move): number {
  const aBombLike = isBombLike(a.pattern.category);
  const bBombLike = isBombLike(b.pattern.category);
  if (aBombLike !== bBombLike) return aBombLike ? 1 : -1;
  if (a.pattern.mainRank !== b.pattern.mainRank) return a.pattern.mainRank - b.pattern.mainRank;
  if (a.cards.length !== b.cards.length) return a.cards.length - b.cards.length;
  const moveDiff = compareMoves(a, b);
  if (moveDiff !== 0) return moveDiff;
  return cardKey(a).localeCompare(cardKey(b));
}

export function rankHints(hand: Card[], current: HandPattern | null): Move[] {
  return hintSuggestions(hand, current).slice().sort(compareRankedHints);
}

export function bestHint(hand: Card[], current: HandPattern | null): Move | null {
  const ranked = rankHints(hand, current);
  return ranked[0] ?? null;
}
