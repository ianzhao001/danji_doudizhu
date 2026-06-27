/**
 * M2-04 RoundState 序列化/反序列化（为 M5 断局重开铺垫）。
 * 实现方：实现两个函数体，使 test/game/serialize.test.ts 转绿。
 * 规则见 coordination/tasks/M2-04-serialization.md。纯函数，禁止 import `cc`，禁止改签名。
 */

import { Category, Rank, Suit, recognize } from '../rules';
import { GamePhase, Side, type RoundState } from './types';

const CURRENT_VERSION = 1;
const REQUIRED_STATE_FIELDS = [
  'phase',
  'landlord',
  'seats',
  'turn',
  'top',
  'passesInARow',
  'winner',
  'bombsPlayed',
];

const SEATS = [0, 1, 2] as const;
const GAME_PHASES = new Set(Object.values(GamePhase));
const SIDES = new Set(Object.values(Side));
const CATEGORIES = new Set(Object.values(Category).filter((value): value is Category => typeof value === 'number'));
const RANKS = new Set(Object.values(Rank).filter((value): value is Rank => typeof value === 'number'));
const SUITS = new Set(Object.values(Suit));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function fail(reason: string): never {
  throw new Error(`corrupted round state: ${reason}`);
}

function isSeat(value: unknown): value is 0 | 1 | 2 {
  return value === 0 || value === 1 || value === 2;
}

function assertNonNegativeNumber(value: unknown, field: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) fail(`${field} must be a non-negative number`);
}

function assertNonNegativeInteger(value: unknown, field: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    fail(`${field} must be a non-negative integer`);
  }
}

function assertCard(value: unknown, field: string): void {
  if (!isRecord(value)) fail(`${field} must be a card object`);
  if (!RANKS.has(value.rank as Rank)) fail(`${field}.rank is invalid`);
  if (!SUITS.has(value.suit as Suit)) fail(`${field}.suit is invalid`);
}

function assertSeats(value: unknown): void {
  if (!Array.isArray(value)) fail('seats must be an array');
  if (value.length !== 3) fail('seats length must be 3');

  const seen = new Set<number>();
  value.forEach((seat, index) => {
    if (!isRecord(seat)) fail(`seats[${index}] must be an object`);
    if (!isSeat(seat.index)) fail(`seats[${index}].index is invalid`);
    if (seen.has(seat.index)) fail('seats index must be unique');
    seen.add(seat.index);
    if (!Array.isArray(seat.hand)) fail(`seats[${index}].hand must be an array`);
    seat.hand.forEach((card, cardIndex) => assertCard(card, `seats[${index}].hand[${cardIndex}]`));
  });

  for (const seat of SEATS) {
    if (!seen.has(seat)) fail('seats indexes must be 0,1,2');
  }
}

function assertTop(value: unknown): void {
  if (value === null) return;
  if (!isRecord(value)) fail('top must be null or an object');
  if (!isSeat(value.seat)) fail('top.seat is invalid');
  if (!isRecord(value.pattern)) fail('top.pattern must be an object');
  if (!CATEGORIES.has(value.pattern.category as Category)) fail('top.pattern.category is invalid');
  if (!RANKS.has(value.pattern.mainRank as Rank)) fail('top.pattern.mainRank is invalid');
  assertNonNegativeInteger(value.pattern.length, 'top.pattern.length');
  if (!Array.isArray(value.pattern.cards)) fail('top.pattern.cards must be an array');
  value.pattern.cards.forEach((card, index) => assertCard(card, `top.pattern.cards[${index}]`));
  if (value.pattern.length !== value.pattern.cards.length) fail('top.pattern.length must match cards length');

  const recognized = recognize(value.pattern.cards);
  if (recognized === null) fail('top.pattern.cards is not a valid pattern');
  if (
    recognized.category !== value.pattern.category ||
    recognized.mainRank !== value.pattern.mainRank ||
    recognized.length !== value.pattern.length
  ) {
    fail('top.pattern semantics mismatch');
  }
}

function assertRoundState(value: Record<string, unknown>): RoundState {
  for (const field of REQUIRED_STATE_FIELDS) {
    if (!hasOwn(value, field)) fail(`missing ${field}`);
  }

  if (!GAME_PHASES.has(value.phase as GamePhase)) fail('phase is invalid');
  if (!isSeat(value.landlord)) fail('landlord is invalid');
  assertSeats(value.seats);
  if (!isSeat(value.turn)) fail('turn is invalid');
  assertTop(value.top);
  assertNonNegativeInteger(value.passesInARow, 'passesInARow');
  if (value.winner !== null && !SIDES.has(value.winner as Side)) fail('winner is invalid');
  assertNonNegativeInteger(value.bombsPlayed, 'bombsPlayed');

  return value as unknown as RoundState;
}

function assertVersionedSave(value: unknown): RoundState {
  if (!isRecord(value)) fail('expected versioned save object');
  if (!hasOwn(value, 'version')) fail('missing version');
  if (value.version !== CURRENT_VERSION) {
    fail(`unsupported version: ${String(value.version)}`);
  }
  if (!hasOwn(value, 'state') || !isRecord(value.state)) {
    fail('missing state');
  }

  return assertRoundState(value.state);
}

/** 序列化为字符串（往返一致、纯 JSON）。 */
export function serializeRound(state: RoundState): string {
  return JSON.stringify({ version: CURRENT_VERSION, state });
}

/** 反序列化；对非法 JSON 抛错。 */
export function deserializeRound(json: string): RoundState {
  return assertVersionedSave(JSON.parse(json));
}
