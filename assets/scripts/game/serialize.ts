/**
 * M2-04 RoundState 序列化/反序列化（为 M5 断局重开铺垫）。
 * 实现方：实现两个函数体，使 test/game/serialize.test.ts 转绿。
 * 规则见 coordination/tasks/M2-04-serialization.md。纯函数，禁止 import `cc`，禁止改签名。
 *
 * v1.6 审计裁决 P1-3——存档格式通则：改 RoundState/存档字段 = 先想迁移。
 * 新增「可选」字段登记 CURRENT_VERSION_ADDITIVE_DEFAULTS 补默认；其余一律升
 * CURRENT_VERSION + 写 MIGRATIONS 迁移器 + golden 绊线转绿（test/game/serialize-golden-*.test.ts），
 * 禁止原地重定义既有版本字段含义。高于当前版本仍硬拒（只升不降）。
 */

import { Category, Rank, Suit, recognize } from '../rules';
import { hasOwn, isRecord } from '../rules/guards';
import { isSeat } from './seat';
import { GamePhase, Side, type RoundState } from './types';

const CURRENT_VERSION = 2;
const REQUIRED_STATE_FIELDS = [
  'phase',
  'landlord',
  'seats',
  'turn',
  'top',
  'passesInARow',
  'winner',
  'bombsPlayed',
  'bottom', // v2(W-AUDIT-AI B3):三张公开底牌;null=v1 旧档迁移而来
];

const SEATS = [0, 1, 2] as const;
const GAME_PHASES = new Set(Object.values(GamePhase));
const SIDES = new Set(Object.values(Side));
const CATEGORIES = new Set(Object.values(Category).filter((value): value is Category => typeof value === 'number'));
const RANKS = new Set(Object.values(Rank).filter((value): value is Rank => typeof value === 'number'));
const SUITS = new Set(Object.values(Suit));

function fail(reason: string): never {
  throw new Error(`corrupted round state: ${reason}`);
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

function assertBottom(value: unknown): void {
  if (value === null) return; // v1 旧档迁移:底牌未知
  if (!Array.isArray(value)) fail('bottom must be null or an array');
  if (value.length !== 3) fail('bottom length must be 3');
  value.forEach((card, index) => assertCard(card, `bottom[${index}]`));
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
  assertBottom(value.bottom);

  return value as unknown as RoundState;
}

export interface VersionedSave {
  version: number;
  state: Record<string, unknown>;
}

/** 单步迁移器：输入 version=N 的完整存档，返回 version=N+1 的新对象；纯函数，禁止就地改入参。 */
export type SaveMigration = (save: VersionedSave) => VersionedSave;

// 键=源版本 N，值=N→N+1；必须连续覆盖到 CURRENT_VERSION-1，缺链即 fail。
const MIGRATIONS: Readonly<Record<number, SaveMigration>> = {
  // v1→v2:补公开底牌字段。旧档发牌信息已不可考,置 null(=未知),
  // AI 记牌与 UI 底牌托盘对 null 优雅降级(维持 v1 行为)。
  1: (save) => ({ version: 2, state: { ...save.state, bottom: null } }),
};

// 同版本加法可选字段默认值：老存档缺字段时补齐（已有字段永远赢过默认值）。
// 必填字段增删/语义变化不许走这里，必须升版本并配迁移器。
const CURRENT_VERSION_ADDITIVE_DEFAULTS: Readonly<Record<string, unknown>> = {};

function migrateToCurrent(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) fail('expected versioned save object');
  if (!hasOwn(value, 'version')) fail('missing version');
  if (typeof value.version !== 'number' || !Number.isInteger(value.version) || value.version > CURRENT_VERSION) {
    fail(`unsupported version: ${String(value.version)}`);
  }
  if (!hasOwn(value, 'state') || !isRecord(value.state)) {
    fail('missing state');
  }

  let save: VersionedSave = { version: value.version, state: value.state };
  while (save.version < CURRENT_VERSION) {
    const step = MIGRATIONS[save.version];
    if (!step) fail(`no migration from version ${save.version}`);
    const next = step(save);
    if (!isRecord(next) || next.version !== save.version + 1 || !isRecord(next.state)) {
      fail(`migration from version ${save.version} produced invalid save`);
    }
    save = next;
  }

  return { ...CURRENT_VERSION_ADDITIVE_DEFAULTS, ...save.state };
}

/** 序列化为字符串（往返一致、纯 JSON）。 */
export function serializeRound(state: RoundState): string {
  return JSON.stringify({ version: CURRENT_VERSION, state });
}

/** 反序列化；对非法 JSON 抛错。旧版本先经迁移链升到当前版，再做完整结构断言。 */
export function deserializeRound(json: string): RoundState {
  return assertRoundState(migrateToCurrent(JSON.parse(json)));
}
