/**
 * M5-10 断局恢复纯函数。组合 SaveSlot 中的可选恢复负载，不复制 RoundState 内部。
 */

import type { SaveSlot } from '../data/save';
import type { GameEvent, RoundState, SeatIndex } from './types';

export interface ResumeSnapshot {
  state: RoundState;
  heroSeat: SeatIndex;
  bidMultiplier: number;
  events: GameEvent[];
}

export function resumeRound(slot: SaveSlot): ResumeSnapshot {
  return {
    state: slot.round,
    heroSeat: slot.heroSeat ?? slot.round.landlord,
    bidMultiplier: slot.bidMultiplier ?? 1,
    events: slot.events ?? [],
  };
}
