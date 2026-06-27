/**
 * M5-10 断局恢复纯函数。组合恢复负载中的可选字段，不复制 RoundState 内部。
 */

import type { GameEvent, ResumePayload, RoundState, SeatIndex } from './types';

export interface ResumeSnapshot {
  state: RoundState;
  heroSeat: SeatIndex;
  bidMultiplier: number;
  events: GameEvent[];
}

export function resumeRound(payload: ResumePayload): ResumeSnapshot {
  return {
    state: payload.round,
    heroSeat: payload.heroSeat ?? payload.round.landlord,
    bidMultiplier: payload.bidMultiplier ?? 1,
    events: payload.events ?? [],
  };
}
