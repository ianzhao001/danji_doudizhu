import { Rank, Suit, type Card } from './card';
import { Category, type HandPattern } from './pattern';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function cardKey(card: Card): string {
  return `${card.rank}:${card.suit}`;
}

export function isRank(value: unknown): value is Rank {
  return typeof value === 'number' && Object.values(Rank).includes(value as Rank);
}

export function isSuit(value: unknown): value is Suit {
  return typeof value === 'string' && Object.values(Suit).includes(value as Suit);
}

export function isCategory(value: unknown): value is Category {
  return typeof value === 'number' && Object.values(Category).includes(value as Category);
}

export function isCard(value: unknown): value is Card {
  return isRecord(value) && isRank(value.rank) && isSuit(value.suit);
}

export function isHandPattern(value: unknown): value is HandPattern {
  return (
    isRecord(value) &&
    isCategory(value.category) &&
    isRank(value.mainRank) &&
    typeof value.length === 'number' &&
    Number.isInteger(value.length) &&
    Array.isArray(value.cards) &&
    value.cards.every(isCard) &&
    value.length === value.cards.length
  );
}
