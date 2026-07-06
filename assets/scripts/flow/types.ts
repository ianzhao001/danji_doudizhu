/**
 * flow 层公共契约（headless 回合驱动器）。架构维护——实现方只读不改。
 * 纯逻辑、只做编排，禁止 import `cc`。
 */

import { Card, Rng } from '../rules';
import {
  SeatIndex,
  Side,
  BiddingState,
  BidAction,
  GameEvent,
  GameSnapshot,
  RoundAction,
  RoundState,
  Settlement,
} from '../game';
import { Clock } from './clock';

/** 叫抢策略：依当前叫抢态与该座手牌产出一个 BidAction（seat 必须等于 state.turn）。 */
export type BidPolicy = (args: { seat: SeatIndex; state: BiddingState; hand: Card[] }) => BidAction;

/**
 * 出牌策略（M-FLOW 注入点）：依当前座位、只读快照与 rng 产出一个 RoundAction（seat 必须等于 snapshot.turn）。
 * 默认包装 baseline `chooseAction`；可用于让不同座位采用不同难度（M4-04 难度差异 selfplay）。
 */
export type PlayPolicy = (args: { seat: SeatIndex; snapshot: GameSnapshot; rng: Rng; history?: GameEvent[] }) => RoundAction;

export interface FlowConfig {
  seed: number;
  startSeat?: SeatIndex; // 默认 0
  baseScore?: number; // 默认 1
  thinkingDelayMs?: number; // 默认 0；每个 AI 行动前 await clock.sleep
  clock?: Clock; // 默认 realClock
  bidPolicy?: BidPolicy; // 默认 defaultBidPolicy
  playPolicy?: PlayPolicy; // 默认 = baseline chooseAction（M-FLOW 实现消费）
  maxTurns?: number; // 默认 300；超出抛 HeadlessRoundError（携带 seed/turns/landlord/lastEvents）
  maxRedeals?: number; // 默认 10；超出抛错（消息含 seed）
}

/** 包装一局过程的事件流；'round' 透传 game 的 GameEvent，不改 GameEvent 本身。 */
export type FlowEvent =
  | { type: 'deal' }
  | { type: 'bid'; action: BidAction; multiplier: number }
  | { type: 'redeal'; attempt: number }
  | { type: 'landlordDecided'; landlord: SeatIndex; bidMultiplier: number }
  | { type: 'bottomRevealed'; cards: Card[] } // 地主确定后亮 3 张底牌（T-FLOW-BID；在 landlordDecided 之后、首个 round 事件之前）
  | { type: 'round'; event: GameEvent }
  | { type: 'settled'; settlement: Settlement };

/** 叫抢期只读发牌视图（T-FLOW-BID）：只暴露英雄手牌副本与三家计数，不泄露他人手牌/底牌。 */
export interface BiddingDealView {
  viewerHand: Card[];
  handCounts: [number, number, number];
}

export interface FlowResult {
  landlord: SeatIndex;
  winner: Side;
  settlement: Settlement;
  events: FlowEvent[];
  turns: number;
  redeals: number;
  finalState: RoundState;
}

/**
 * headless 跑局异常（M-FLOW）：携带局部诊断，便于 selfplay 定位超 maxTurns / 缺 win / 非法动作。
 * `message` 必须含 seed（向后兼容既有 `rejects.toThrow(seed)` 断言）。
 * 实现方在 driver 的异常路径抛出本错误并填充字段。
 */
export class HeadlessRoundError extends Error {
  readonly seed: number;
  readonly turns: number;
  readonly landlord: SeatIndex | null;
  readonly lastEvents: FlowEvent[];
  /** 原始错误（如出牌循环内非法动作 / apply 抛错）；ES2020 lib 无 Error.cause，显式声明。M-FLOW-02 填充。 */
  readonly cause?: unknown;
  constructor(
    message: string,
    info: { seed: number; turns: number; landlord: SeatIndex | null; lastEvents: FlowEvent[]; cause?: unknown },
  ) {
    super(message);
    this.name = 'HeadlessRoundError';
    this.seed = info.seed;
    this.turns = info.turns;
    this.landlord = info.landlord;
    this.lastEvents = info.lastEvents;
    this.cause = info.cause;
  }
}

/**
 * 默认叫抢策略：calling 阶段叫地主、grabbing 阶段不抢
 * → 起始座位成地主、首轮即定庄、不会无限 redeal。
 */
export const defaultBidPolicy: BidPolicy = ({ seat, state }) =>
  state.phase === 'calling' ? { type: 'call', seat } : { type: 'pass', seat };
