/**
 * game 层公共类型（单局状态机）。架构维护的契约——实现方只读不改。
 * 纯逻辑，禁止 import `cc`。RoundState 必须可 JSON 序列化（纯数据）。
 */

import { Card, HandPattern } from '../rules';
import type { Settlement } from './settlement';

export type SeatIndex = 0 | 1 | 2;

export enum GamePhase {
  Playing = 'playing',
  Settled = 'settled',
}

export enum Side {
  Landlord = 'landlord',
  Farmer = 'farmer',
}

export interface PlayerSeat {
  index: SeatIndex;
  hand: Card[];
}

export type RoundAction =
  | { type: 'play'; seat: SeatIndex; cards: Card[] }
  | { type: 'pass'; seat: SeatIndex };

export interface TopPlay {
  seat: SeatIndex;
  pattern: HandPattern;
}

/** 当前对局状态——纯数据、可序列化、可作存档。 */
export interface RoundState {
  phase: GamePhase;
  landlord: SeatIndex;
  seats: PlayerSeat[]; // 长度 3，按 index 排序
  turn: SeatIndex; // 当前轮到的座位
  top: TopPlay | null; // null = 当前可自由领出
  passesInARow: number; // 连续过牌计数
  winner: Side | null;
  bombsPlayed: number; // 炸弹/火箭累计（供 settlement）
}

/** 断局恢复所需的纯数据负载（不含 savedAt/version 等 IO 元数据）。 */
export interface ResumePayload {
  round: RoundState;
  heroSeat?: SeatIndex;
  bidMultiplier?: number;
  events?: GameEvent[];
}

export type GameEvent =
  | { type: 'play'; seat: SeatIndex; pattern: HandPattern }
  | { type: 'pass'; seat: SeatIndex }
  | { type: 'bomb'; seat: SeatIndex }
  | { type: 'rocket'; seat: SeatIndex }
  | { type: 'reset'; leader: SeatIndex } // 连续两过：牌权回到 leader 自由领出
  | { type: 'win'; seat: SeatIndex; side: Side };

/** 只读快照（给 ai/ui）：隐藏他人手牌，仅暴露剩牌数。 */
export interface GameSnapshot {
  phase: GamePhase;
  turn: SeatIndex;
  landlord: SeatIndex;
  top: TopPlay | null;
  handCounts: [number, number, number];
  winner: Side | null;
  bidMultiplier?: number;
  bombsPlayed?: number;
  viewerHand?: Card[]; // 指定 viewer 时附其手牌
}

export interface ApplyResult {
  state: RoundState; // 新状态（不可变更新）
  events: GameEvent[]; // 发生了什么
}

/** 结束一局后，战绩/历史聚合所需的最小纯数据。 */
export interface RoundFinishInput {
  landlord: SeatIndex;
  winner: Side;
  settlement: Settlement;
}

export class IllegalActionError extends Error {
  constructor(public reason: string) {
    super(reason);
    this.name = 'IllegalActionError';
  }
}
