import { GamePhase, type GameEvent, type RoundFinishInput, type RoundState, type SeatIndex, type Settlement } from '../../game';
import { pushRoundEvents, settleFromGameEvents, winEventFrom } from '../driver';
import type { FlowEvent } from '../types';

type RuntimePhase = 'bidding' | 'playing' | 'settled' | 'disposed';
type RuntimeTerminationReason = 'settled' | 'redealExhausted' | 'error';

type RuntimePersist = (payload: {
  round: RoundState;
  heroSeat: SeatIndex;
  bidMultiplier: number;
  events: GameEvent[];
}) => void;

export interface RuntimePersistenceContext {
  baseScore: number;
  heroSeat: SeatIndex;
  bidMultiplier: number;
  currentPhase: RuntimePhase;
  currentSettlement: Settlement | null;
  currentTerminationReason: RuntimeTerminationReason | null;
  settledNotified: boolean;
  state: RoundState | null;
  gameEvents: GameEvent[];
  persist?: RuntimePersist;
  onSettled?: (finish: RoundFinishInput) => void;
  emit(event: FlowEvent, bucket?: FlowEvent[]): void;
  isDisposed(): boolean;
}

export function pushRuntimeApplyResult(
  runtime: RuntimePersistenceContext,
  result: { events: GameEvent[] },
  bucket?: FlowEvent[],
): void {
  if (!runtime.state) return;
  const flowEvents: FlowEvent[] = [];
  pushRoundEvents(flowEvents, runtime.gameEvents, { state: runtime.state, events: result.events });
  for (const event of flowEvents) runtime.emit(event, bucket);
  runtime.persist?.({
    round: runtime.state,
    heroSeat: runtime.heroSeat,
    bidMultiplier: runtime.bidMultiplier,
    events: runtime.gameEvents.slice(),
  });
}

export function persistRuntimePlayingStart(runtime: RuntimePersistenceContext): void {
  if (!runtime.state) return;
  runtime.persist?.({
    round: runtime.state,
    heroSeat: runtime.heroSeat,
    bidMultiplier: runtime.bidMultiplier,
    events: runtime.gameEvents.slice(),
  });
}

export function finishRuntimeIfSettled(runtime: RuntimePersistenceContext, bucket?: FlowEvent[]): void {
  if (!runtime.state || runtime.state.phase !== GamePhase.Settled || runtime.settledNotified) return;
  const win = winEventFrom(runtime.gameEvents);
  if (!win) return;
  runtime.currentSettlement = settleFromGameEvents({
    landlord: runtime.state.landlord,
    winner: win.side,
    bidMultiplier: runtime.bidMultiplier,
    events: runtime.gameEvents,
    baseScore: runtime.baseScore,
  });
  runtime.currentPhase = 'settled';
  runtime.currentTerminationReason = 'settled';
  runtime.settledNotified = true;
  runtime.emit({ type: 'settled', settlement: runtime.currentSettlement }, bucket);
  if (runtime.isDisposed()) return;
  runtime.onSettled?.({
    landlord: runtime.state.landlord,
    winner: win.side,
    settlement: runtime.currentSettlement,
  });
}
