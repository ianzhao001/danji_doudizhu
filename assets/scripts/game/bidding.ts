/**
 * M2-02 叫抢地主（抢翻倍）。实现方：实现 createBidding / applyBid 函数体，
 * 使 test/game/bidding.test.ts 转绿。协议见 coordination/tasks/M2-02-bidding.md。
 * 禁止 import `cc`，禁止改本文件已有的类型与签名。
 */

import { SeatIndex, IllegalActionError } from './types';

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
}

const notImplemented = (): never => {
  throw new Error('not implemented');
};

interface BiddingContext {
  callingPasses: number;
  caller: SeatIndex | null;
  grabQueue: SeatIndex[];
  grabbed: boolean;
}

const contexts = new WeakMap<BiddingState, BiddingContext>();

function nextSeat(seat: SeatIndex): SeatIndex {
  return ((seat + 1) % 3) as SeatIndex;
}

function makeState(state: BiddingState, context: BiddingContext): BiddingState {
  contexts.set(state, {
    callingPasses: context.callingPasses,
    caller: context.caller,
    grabQueue: context.grabQueue.slice(),
    grabbed: context.grabbed,
  });
  return state;
}

function contextOf(state: BiddingState): BiddingContext {
  const context = contexts.get(state);
  if (!context) throw new IllegalActionError('BIDDING_CONTEXT_MISSING');
  return context;
}

function grabQueueFor(caller: SeatIndex): SeatIndex[] {
  return [nextSeat(caller), nextSeat(nextSeat(caller))];
}

function done(state: BiddingState, context: BiddingContext): BiddingState {
  if (state.provisional === null) throw new IllegalActionError('NO_PROVISIONAL_LANDLORD');
  return makeState(
    {
      ...state,
      phase: 'done',
      landlord: state.provisional,
    },
    { ...context, grabQueue: [] },
  );
}

/** 创建叫地主初始状态：从 startSeat 开始 calling。 */
export function createBidding(startSeat: SeatIndex): BiddingState {
  return makeState(
    {
      phase: 'calling',
      turn: startSeat,
      provisional: null,
      multiplier: 0,
      landlord: null,
    },
    {
      callingPasses: 0,
      caller: null,
      grabQueue: [],
      grabbed: false,
    },
  );
}

/** 应用一个叫/抢/不动作；非法抛 IllegalActionError；不可变更新。 */
export function applyBid(state: BiddingState, action: BidAction): BiddingState {
  if (state.phase === 'done' || state.phase === 'redeal') {
    throw new IllegalActionError('BIDDING_CLOSED');
  }
  if (action.seat !== state.turn) throw new IllegalActionError('NOT_TURN');

  const context = contextOf(state);

  if (state.phase === 'calling') {
    if (action.type === 'grab') throw new IllegalActionError('CANNOT_GRAB_BEFORE_CALL');

    if (action.type === 'call') {
      const queue = grabQueueFor(action.seat);
      return makeState(
        {
          phase: 'grabbing',
          turn: queue[0],
          provisional: action.seat,
          multiplier: 1,
          landlord: null,
        },
        {
          callingPasses: context.callingPasses,
          caller: action.seat,
          grabQueue: queue,
          grabbed: false,
        },
      );
    }

    const callingPasses = context.callingPasses + 1;
    if (callingPasses >= 3) {
      return makeState(
        {
          ...state,
          phase: 'redeal',
        },
        { ...context, callingPasses },
      );
    }

    return makeState(
      {
        ...state,
        turn: nextSeat(action.seat),
      },
      { ...context, callingPasses },
    );
  }

  if (action.type === 'call') throw new IllegalActionError('CANNOT_CALL_WHILE_GRABBING');
  if (context.caller === null) throw new IllegalActionError('CALLER_MISSING');
  if (context.grabQueue[0] !== action.seat) throw new IllegalActionError('NOT_TURN');

  const grabbed = context.grabbed || action.type === 'grab';
  const nextState: BiddingState = {
    ...state,
    provisional: action.type === 'grab' ? action.seat : state.provisional,
    multiplier: action.type === 'grab' ? state.multiplier * 2 : state.multiplier,
  };
  const remainingQueue = context.grabQueue.slice(1);
  const nextContext: BiddingContext = {
    ...context,
    grabQueue: remainingQueue,
    grabbed,
  };

  if (remainingQueue.length > 0) {
    return makeState({ ...nextState, turn: remainingQueue[0] }, nextContext);
  }

  if (action.seat !== context.caller && grabbed) {
    const counterQueue = [context.caller];
    return makeState(
      {
        ...nextState,
        turn: context.caller,
      },
      { ...nextContext, grabQueue: counterQueue },
    );
  }

  return done(nextState, nextContext);
}
