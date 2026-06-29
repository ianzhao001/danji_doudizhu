import { Side, type GameEvent, type SeatIndex } from './types';
import { Category, Rank, Suit, type Card, type HandPattern } from '../rules';

export const REPLAY_VERSION = 1;

function corrupted(reason: string): never {
  throw new Error(`corrupted replay: ${reason}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSeat(value: unknown): value is SeatIndex {
  return value === 0 || value === 1 || value === 2;
}

function isRank(value: unknown): value is Rank {
  return typeof value === 'number' && Object.values(Rank).includes(value as Rank);
}

function isSuit(value: unknown): value is Suit {
  return typeof value === 'string' && Object.values(Suit).includes(value as Suit);
}

function isCategory(value: unknown): value is Category {
  return typeof value === 'number' && Object.values(Category).includes(value as Category);
}

function isCard(value: unknown): value is Card {
  return isRecord(value) && isRank(value.rank) && isSuit(value.suit);
}

function isPattern(value: unknown): value is HandPattern {
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

function isGameEvent(value: unknown): value is GameEvent {
  if (!isRecord(value) || typeof value.type !== 'string') return false;
  switch (value.type) {
    case 'play':
      return isSeat(value.seat) && isPattern(value.pattern);
    case 'pass':
    case 'bomb':
    case 'rocket':
      return isSeat(value.seat);
    case 'reset':
      return isSeat(value.leader);
    case 'win':
      return isSeat(value.seat) && (value.side === Side.Landlord || value.side === Side.Farmer);
    default:
      return false;
  }
}

function parseEvents(value: unknown): GameEvent[] {
  if (!Array.isArray(value)) corrupted('events must be an array');
  if (!value.every(isGameEvent)) corrupted('events contains invalid entry');
  return value;
}

export function encodeReplay(events: GameEvent[]): string {
  return JSON.stringify({ version: REPLAY_VERSION, events });
}

export function decodeReplay(text: string): GameEvent[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    corrupted('invalid JSON');
  }
  if (!isRecord(parsed)) corrupted('expected object');
  if (parsed.version !== REPLAY_VERSION) corrupted(`unsupported version: ${String(parsed.version)}`);
  return parseEvents(parsed.events);
}
