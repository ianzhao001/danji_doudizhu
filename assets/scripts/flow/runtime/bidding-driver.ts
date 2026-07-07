import type { Clock } from '../clock';
import {
  GamePhase,
  IllegalActionError,
  createBidding,
  snapshot,
  type BidAction,
  type BiddingState,
  type GameEvent,
  type GameSnapshot,
  type RoundAction,
  type RoundFinishInput,
  type RoundState,
  type SeatIndex,
  type Settlement,
} from '../../game';
import { enumerateMoves, legalFollows, type Deal, type Rng } from '../../rules';
import {
  applyBiddingStep,
  applyPlayStep,
  biddingEvent,
  createPlayingState,
  createRoundDeal,
  decideBidAction,
  decidePlayAction,
} from '../driver';
import type { BidPolicy, BiddingDealView, FlowEvent, PlayPolicy } from '../types';
import {
  finishRuntimeIfSettled,
  persistRuntimePlayingStart,
  pushRuntimeApplyResult,
} from './persistence';

const DEFAULT_START_SEAT: SeatIndex = 0;
const INTERNAL_ERROR_REASON = 'INTERNAL_ERROR';

type RuntimePhase = 'bidding' | 'playing' | 'settled' | 'disposed';
type RuntimeTerminationReason = 'settled' | 'redealExhausted' | 'error';

export type RuntimePlayerInput =
  | { kind: 'bid'; action: BidAction }
  | { kind: 'play'; action: RoundAction };

export interface RuntimeSubmitResult {
  ok: boolean;
  snapshot?: GameSnapshot;
  bidding?: BiddingState;
  events?: FlowEvent[];
  error?: { reason: string };
}

export interface RuntimeDriverContext {
  rng: Rng;
  thinkingDelayMs: number;
  clock: Clock;
  bidPolicy: BidPolicy;
  playPolicy: PlayPolicy;
  maxTurns: number;
  maxRedeals: number;
  baseScore: number;
  heroSeat: SeatIndex;
  currentDeal: Deal | null;
  bidding: BiddingState | null;
  state: RoundState | null;
  currentPhase: RuntimePhase;
  bidMultiplier: number;
  currentSettlement: Settlement | null;
  redeals: number;
  gameEvents: GameEvent[];
  currentTerminationReason: RuntimeTerminationReason | null;
  currentTerminationDetail: unknown;
  settledNotified: boolean;
  paused: boolean;
  pauseRequested: boolean;
  persist?: (payload: { round: RoundState; heroSeat: SeatIndex; bidMultiplier: number; events: GameEvent[] }) => void;
  onSettled?: (finish: RoundFinishInput) => void;
  emit(event: FlowEvent, bucket?: FlowEvent[]): void;
  isDisposed(): boolean;
}

export function runtimeSnapshot(runtime: RuntimeDriverContext): GameSnapshot | null {
  if (!runtime.state) return null;
  return { ...snapshot(runtime.state, runtime.heroSeat), bidMultiplier: runtime.bidMultiplier };
}

export function runtimeBidding(runtime: RuntimeDriverContext): BiddingState | null {
  return runtime.currentPhase === 'bidding' && runtime.bidding ? readonlyBidding(runtime.bidding) : null;
}

export function runtimeBiddingDeal(runtime: RuntimeDriverContext): BiddingDealView | null {
  if (runtime.currentPhase !== 'bidding' || !runtime.currentDeal) return null;
  return {
    viewerHand: runtime.currentDeal.hands[runtime.heroSeat].slice(),
    handCounts: [
      runtime.currentDeal.hands[0].length,
      runtime.currentDeal.hands[1].length,
      runtime.currentDeal.hands[2].length,
    ],
  };
}

export function runtimeIsPlayerTurn(runtime: RuntimeDriverContext): boolean {
  if (runtime.currentPhase === 'bidding') return runtime.bidding?.turn === runtime.heroSeat;
  if (runtime.currentPhase === 'playing') return runtime.state?.turn === runtime.heroSeat;
  return false;
}

export function runtimeLegalInputs(runtime: RuntimeDriverContext): RuntimePlayerInput[] | null {
  if (!runtimeIsPlayerTurn(runtime)) return null;

  if (runtime.currentPhase === 'bidding' && runtime.bidding) {
    const pass: RuntimePlayerInput = { kind: 'bid', action: { type: 'pass', seat: runtime.heroSeat } };
    const positive: RuntimePlayerInput =
      runtime.bidding.phase === 'calling'
        ? { kind: 'bid', action: { type: 'call', seat: runtime.heroSeat } }
        : { kind: 'bid', action: { type: 'grab', seat: runtime.heroSeat } };
    return [positive, pass];
  }

  if (runtime.currentPhase === 'playing' && runtime.state) {
    const snap = snapshot(runtime.state, runtime.heroSeat);
    const hand = snap.viewerHand ?? [];
    const moves = runtime.state.top === null ? enumerateMoves(hand) : legalFollows(hand, runtime.state.top.pattern);
    const inputs: RuntimePlayerInput[] = moves.map((move) => ({
      kind: 'play',
      action: { type: 'play', seat: runtime.heroSeat, cards: move.cards.slice() },
    }));
    if (runtime.state.top !== null) inputs.push({ kind: 'play', action: { type: 'pass', seat: runtime.heroSeat } });
    return inputs;
  }

  return null;
}

export function runtimePause(runtime: RuntimeDriverContext): void {
  if (isRuntimeDisposed(runtime)) return;
  runtime.paused = true;
  runtime.pauseRequested = true;
}

export function runtimeResume(runtime: RuntimeDriverContext): void {
  if (isRuntimeDisposed(runtime)) return;
  if (!runtime.paused && !runtime.pauseRequested) return;
  runtime.paused = false;
  runtime.pauseRequested = false;
  scheduleRuntimeAdvance(runtime);
}

export function runtimeIsPaused(runtime: RuntimeDriverContext): boolean {
  return !isRuntimeDisposed(runtime) && (runtime.paused || runtime.pauseRequested);
}

export async function submitRuntimePlayerAction(
  runtime: RuntimeDriverContext,
  input: RuntimePlayerInput,
): Promise<RuntimeSubmitResult> {
  if (!runtimeIsPlayerTurn(runtime)) return { ok: false, error: { reason: 'NOT_PLAYER_TURN' } };

  const events: FlowEvent[] = [];
  try {
    if (runtime.currentPhase === 'bidding') {
      if (input.kind !== 'bid' || !runtime.bidding) return { ok: false, error: { reason: 'INVALID_INPUT_PHASE' } };
      runtime.bidding = applyBiddingStep(runtime.bidding, input.action);
      runtime.emit(biddingEvent(input.action, runtime.bidding), events);
    } else if (runtime.currentPhase === 'playing') {
      if (input.kind !== 'play' || !runtime.state) return { ok: false, error: { reason: 'INVALID_INPUT_PHASE' } };
      const result = applyPlayStep(runtime.state, input.action);
      runtime.state = result.state;
      pushRuntimeApplyResult(runtime, result, events);
      finishRuntimeIfSettled(runtime, events);
    }
  } catch (error) {
    if (error instanceof IllegalActionError) return { ok: false, error: { reason: error.reason } };
    terminateRuntimeWithError(runtime, error);
    return { ok: false, events, error: { reason: INTERNAL_ERROR_REASON } };
  }

  await advanceRuntimeUntilPause(runtime, events);
  if (runtime.currentTerminationReason === 'error') {
    return { ok: false, events, error: { reason: INTERNAL_ERROR_REASON } };
  }
  return {
    ok: true,
    snapshot: runtimeSnapshot(runtime) ?? undefined,
    bidding: runtimeBidding(runtime) ?? undefined,
    events,
  };
}

export function startRuntimeDeal(runtime: RuntimeDriverContext): void {
  runtime.gameEvents = [];
  runtime.currentDeal = createRoundDeal(runtime.rng);
  runtime.bidding = createBidding(DEFAULT_START_SEAT);
  runtime.currentPhase = 'bidding';
  runtime.emit({ type: 'deal' });
}

export function scheduleRuntimeAdvance(runtime: RuntimeDriverContext): void {
  void advanceRuntimeUntilPause(runtime).catch((error) => terminateRuntimeWithError(runtime, error));
}

export async function advanceRuntimeUntilPause(
  runtime: RuntimeDriverContext,
  bucket?: FlowEvent[],
): Promise<void> {
  try {
    let steps = 0;
    while (runtime.currentPhase !== 'disposed') {
      if (runtimeIsPaused(runtime)) return;
      if (steps >= runtime.maxTurns) {
        terminateRuntimeWithError(runtime, new Error('ROUND_RUNTIME_MAX_TURNS'));
        return;
      }
      steps++;

      if (runtime.currentPhase === 'bidding') {
        if (!runtime.bidding || !runtime.currentDeal) {
          terminateRuntimeWithError(runtime, new Error('BIDDING_STATE_MISSING'));
          return;
        }
        if (runtime.bidding.phase === 'done') {
          enterRuntimePlaying(runtime, bucket);
          continue;
        }
        if (runtime.bidding.phase === 'redeal') {
          redealRuntime(runtime, bucket);
          continue;
        }
        if (runtime.bidding.turn === runtime.heroSeat) return;

        await sleepForRuntimeAi(runtime);
        if (isRuntimeDisposed(runtime)) return;
        if (runtimeIsPaused(runtime)) return;
        const action = decideBidAction({ bidding: runtime.bidding, deal: runtime.currentDeal, bidPolicy: runtime.bidPolicy });
        runtime.bidding = applyBiddingStep(runtime.bidding, action);
        runtime.emit(biddingEvent(action, runtime.bidding), bucket);
        continue;
      }

      if (runtime.currentPhase === 'playing') {
        if (!runtime.state || runtime.state.phase === GamePhase.Settled) {
          finishRuntimeIfSettled(runtime, bucket);
          return;
        }
        if (runtime.state.turn === runtime.heroSeat) return;

        await sleepForRuntimeAi(runtime);
        if (isRuntimeDisposed(runtime)) return;
        if (runtimeIsPaused(runtime)) return;
        const action = decidePlayAction({
          state: runtime.state,
          playPolicy: runtime.playPolicy,
          rng: runtime.rng,
          history: runtime.gameEvents,
        });
        const result = applyPlayStep(runtime.state, action);
        runtime.state = result.state;
        pushRuntimeApplyResult(runtime, result, bucket);
        finishRuntimeIfSettled(runtime, bucket);
        continue;
      }

      return;
    }
  } catch (error) {
    terminateRuntimeWithError(runtime, error);
  }
}

export async function sleepForRuntimeAi(runtime: RuntimeDriverContext): Promise<void> {
  await runtime.clock.sleep(runtime.thinkingDelayMs);
}

export function isRuntimeDisposed(runtime: RuntimeDriverContext): boolean {
  return runtime.currentPhase === 'disposed';
}

export function enterRuntimePlaying(runtime: RuntimeDriverContext, bucket?: FlowEvent[]): void {
  if (!runtime.bidding || runtime.bidding.landlord === null || !runtime.currentDeal) {
    terminateRuntimeWithError(runtime, new Error('BIDDING_DONE_WITHOUT_LANDLORD'));
    return;
  }
  runtime.bidMultiplier = runtime.bidding.multiplier;
  runtime.emit(
    { type: 'landlordDecided', landlord: runtime.bidding.landlord, bidMultiplier: runtime.bidding.multiplier },
    bucket,
  );
  if (isRuntimeDisposed(runtime)) return;
  runtime.emit({ type: 'bottomRevealed', cards: runtime.currentDeal.bottom.slice() }, bucket);
  if (isRuntimeDisposed(runtime)) return;
  runtime.state = createPlayingState(runtime.currentDeal, runtime.bidding.landlord);
  if (isRuntimeDisposed(runtime)) return;
  persistRuntimePlayingStart(runtime);
  runtime.bidding = null;
  runtime.currentPhase = 'playing';
}

export function redealRuntime(runtime: RuntimeDriverContext, bucket?: FlowEvent[]): void {
  runtime.redeals++;
  runtime.emit({ type: 'redeal', attempt: runtime.redeals }, bucket);
  if (isRuntimeDisposed(runtime)) return;
  if (runtime.redeals > runtime.maxRedeals) {
    runtime.currentTerminationReason = 'redealExhausted';
    runtime.currentPhase = 'disposed';
    return;
  }
  startRuntimeDeal(runtime);
}

export function terminateRuntimeWithError(runtime: RuntimeDriverContext, error: unknown): void {
  if (runtime.currentTerminationReason === 'settled') return;
  runtime.currentTerminationReason = 'error';
  runtime.currentTerminationDetail = error;
  runtime.currentPhase = 'disposed';
}

function readonlyBidding(state: BiddingState): BiddingState {
  const clone = { ...state, grabQueue: state.grabQueue.slice() };
  Object.freeze(clone.grabQueue);
  return Object.freeze(clone) as BiddingState;
}
