/**
 * M2-02 叫抢地主（抢翻倍）。实现方：实现 createBidding / applyBid 函数体，
 * 使 test/game/bidding.test.ts 转绿。协议见 coordination/tasks/M2-02-bidding.md。
 * 禁止 import `cc`，禁止改本文件已有的类型与签名。
 */

import { SeatIndex, IllegalActionError } from './types';
import { nextSeat } from './seat';

export type BidActionType = 'call' | 'grab' | 'pass';
export interface BidAction {
  type: BidActionType;
  seat: SeatIndex;
}

export type BiddingPhase = 'calling' | 'grabbing' | 'done' | 'redeal';
export interface BiddingState {
  phase: BiddingPhase;
  turn: SeatIndex;
  provisional: SeatIndex | null; // 当前临时地主
  multiplier: number; // 叫=1，每抢/反抢 ×2
  landlord: SeatIndex | null; // done 时确定
  // M2-08：以下 4 个字段从模块级 WeakMap 显式并入公开状态，使 BiddingState 成为纯数据、可序列化。
  caller: SeatIndex | null; // 首叫者（反抢判定用）
  callingPasses: number; // calling 阶段累计 pass 数
  grabQueue: SeatIndex[]; // grabbing 阶段「待行动座位」队列
  grabbed: boolean; // 本 grabbing 轮是否已发生过 grab
}

function grabQueueFor(caller: SeatIndex): SeatIndex[] {
  return [nextSeat(caller), nextSeat(nextSeat(caller))];
}

function done(state: BiddingState): BiddingState {
  if (state.provisional === null) throw new IllegalActionError('NO_PROVISIONAL_LANDLORD');
  return {
    ...state,
    phase: 'done',
    landlord: state.provisional,
    grabQueue: [],
  };
}

/** 创建叫地主初始状态：从 startSeat 开始 calling。 */
export function createBidding(startSeat: SeatIndex): BiddingState {
  return {
    phase: 'calling',
    turn: startSeat,
    provisional: null,
    multiplier: 0,
    landlord: null,
    caller: null,
    callingPasses: 0,
    grabQueue: [],
    grabbed: false,
  };
}

/** 应用一个叫/抢/不动作；非法抛 IllegalActionError；不可变更新。 */
export function applyBid(state: BiddingState, action: BidAction): BiddingState {
  if (state.phase === 'done' || state.phase === 'redeal') {
    throw new IllegalActionError('BIDDING_CLOSED');
  }
  if (action.seat !== state.turn) throw new IllegalActionError('NOT_TURN');

  if (state.phase === 'calling') {
    if (action.type === 'grab') throw new IllegalActionError('CANNOT_GRAB_BEFORE_CALL');

    if (action.type === 'call') {
      const queue = grabQueueFor(action.seat);
      return {
        phase: 'grabbing',
        turn: queue[0],
        provisional: action.seat,
        multiplier: 1,
        landlord: null,
        caller: action.seat,
        callingPasses: state.callingPasses,
        grabQueue: queue,
        grabbed: false,
      };
    }

    const callingPasses = state.callingPasses + 1;
    if (callingPasses >= 3) {
      return {
        ...state,
        phase: 'redeal',
        callingPasses,
      };
    }

    return {
      ...state,
      turn: nextSeat(action.seat),
      callingPasses,
    };
  }

  if (action.type === 'call') throw new IllegalActionError('CANNOT_CALL_WHILE_GRABBING');
  if (state.caller === null) throw new IllegalActionError('CALLER_MISSING');
  if (state.grabQueue[0] !== action.seat) throw new IllegalActionError('NOT_TURN');

  const grabbed = state.grabbed || action.type === 'grab';
  const remainingQueue = state.grabQueue.slice(1);
  const nextState: BiddingState = {
    ...state,
    provisional: action.type === 'grab' ? action.seat : state.provisional,
    multiplier: action.type === 'grab' ? state.multiplier * 2 : state.multiplier,
    grabQueue: remainingQueue,
    grabbed,
  };

  if (remainingQueue.length > 0) {
    return { ...nextState, turn: remainingQueue[0] };
  }

  if (action.seat !== state.caller && grabbed) {
    return {
      ...nextState,
      turn: state.caller,
      grabQueue: [state.caller],
    };
  }

  return done(nextState);
}
