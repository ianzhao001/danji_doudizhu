/**
 * flow 层公共契约（headless 回合驱动器）。架构维护——实现方只读不改。
 * 纯逻辑、只做编排，禁止 import `cc`。
 */

import { Card } from '../rules';
import { SeatIndex, Side, BiddingState, BidAction, GameEvent, RoundState, Settlement } from '../game';
import { Clock } from './clock';

/** 叫抢策略：依当前叫抢态与该座手牌产出一个 BidAction（seat 必须等于 state.turn）。 */
export type BidPolicy = (args: { seat: SeatIndex; state: BiddingState; hand: Card[] }) => BidAction;

export interface FlowConfig {
  seed: number;
  startSeat?: SeatIndex; // 默认 0
  baseScore?: number; // 默认 1
  thinkingDelayMs?: number; // 默认 0；每个 AI 行动前 await clock.sleep
  clock?: Clock; // 默认 realClock
  bidPolicy?: BidPolicy; // 默认 defaultBidPolicy
  maxTurns?: number; // 默认 300；超出抛错（消息含 seed/turn）
  maxRedeals?: number; // 默认 10；超出抛错（消息含 seed）
}

/** 包装一局过程的事件流；'round' 透传 game 的 GameEvent，不改 GameEvent 本身。 */
export type FlowEvent =
  | { type: 'deal' }
  | { type: 'bid'; action: BidAction; multiplier: number }
  | { type: 'redeal'; attempt: number }
  | { type: 'landlordDecided'; landlord: SeatIndex; bidMultiplier: number }
  | { type: 'round'; event: GameEvent }
  | { type: 'settled'; settlement: Settlement };

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
 * 默认叫抢策略：calling 阶段叫地主、grabbing 阶段不抢
 * → 起始座位成地主、首轮即定庄、不会无限 redeal。
 */
export const defaultBidPolicy: BidPolicy = ({ seat, state }) =>
  state.phase === 'calling' ? { type: 'call', seat } : { type: 'pass', seat };
