import {
  isBombLike,
  type Card,
  type HandPattern,
  type Move,
  enumerateMoves,
  legalFollows,
} from '../rules';
import { compareMoves } from './levels/_shared';

export interface HintResult {
  moves: Move[];
}

function compareHintMoves(a: Move, b: Move): number {
  const aBombLike = isBombLike(a.pattern.category);
  const bBombLike = isBombLike(b.pattern.category);
  if (aBombLike !== bBombLike) return aBombLike ? 1 : -1;
  return compareMoves(a, b);
}

function cardKey(card: Card): string {
  return `${card.rank}:${card.suit}`;
}

function cardsKey(cards: Card[]): string {
  return cards.map(cardKey).sort().join('|');
}

export function hintSuggestions(hand: Card[], current: HandPattern | null): Move[] {
  const moves = current === null ? enumerateMoves(hand) : legalFollows(hand, current);
  return moves.slice().sort(compareHintMoves);
}

export function nextHint(hand: Card[], current: HandPattern | null, prev?: Card[]): Move | null {
  const moves = hintSuggestions(hand, current);
  if (moves.length === 0) return null;
  if (!prev) return moves[0];

  const prevKey = cardsKey(prev);
  const currentIndex = moves.findIndex((move) => cardsKey(move.cards) === prevKey);
  if (currentIndex < 0) return moves[0];
  return moves[(currentIndex + 1) % moves.length];
}
