import type { AiLevel } from '../ai';
import {
  GamePhase,
  IllegalActionError,
  Side,
  snapshot,
  type BidAction,
  type BiddingState,
  type GameEvent,
  type GameSnapshot,
  type ResumeSnapshot,
  type RoundAction,
  type RoundFinishInput,
  type RoundState,
  type SeatIndex,
  type Settlement,
} from '../game';
import { createRng, enumerateMoves, legalFollows, type Deal, type Rng } from '../rules';
import { realClock, type Clock } from './clock';
import {
  applyBiddingStep,
  applyPlayStep,
  biddingEvent,
  createPlayingState,
  createRoundDeal,
  decideBidAction,
  decidePlayAction,
  defaultPlayPolicy,
  pushRoundEvents,
  settleFromGameEvents,
  winEventFrom,
} from './driver';
import { levelPolicies } from './policies';
import { defaultBidPolicy, type BidPolicy, type BiddingDealView, type FlowEvent, type PlayPolicy } from './types';
import { createBidding } from '../game';

const DEFAULT_BASE_SCORE = 1;
const DEFAULT_THINKING_DELAY_MS = 0;
const DEFAULT_START_SEAT: SeatIndex = 0;
const DEFAULT_MAX_REDEALS = 10;
const DEFAULT_MAX_TURNS = 300;
const INTERNAL_ERROR_REASON = 'INTERNAL_ERROR';

export type RuntimeTerminationReason = 'settled' | 'redealExhausted' | 'error';

export interface RuntimeConfig {
  seed: number;
  heroSeat: SeatIndex;
  levels: [AiLevel, AiLevel, AiLevel];
  baseScore?: number;
  thinkingDelayMs?: number;
  clock?: Clock;
  bidPolicy?: BidPolicy;
  playPolicy?: PlayPolicy;
  maxTurns?: number;
  maxRedeals?: number;
  persist?: (payload: { round: RoundState; heroSeat: SeatIndex; bidMultiplier: number; events: GameEvent[] }) => void;
  onSettled?: (finish: RoundFinishInput) => void;
}

export type PlayerInput =
  | { kind: 'bid'; action: BidAction }
  | { kind: 'play'; action: RoundAction };

export interface SubmitResult {
  ok: boolean;
  snapshot?: GameSnapshot;
  bidding?: BiddingState;
  events?: FlowEvent[];
  error?: { reason: string };
}

export interface RoundRuntime {
  phase(): 'bidding' | 'playing' | 'settled' | 'disposed';
  currentSnapshot(): GameSnapshot | null;
  currentBidding(): BiddingState | null;
  /** 叫抢期只读发牌视图（T-FLOW-BID）：bidding 相返回英雄 17 张副本 + [17,17,17]；其余相返回 null。 */
  biddingDeal(): BiddingDealView | null;
  isPlayerTurn(): boolean;
  legalInputs(): PlayerInput[] | null;
  submitPlayerAction(input: PlayerInput): Promise<SubmitResult>;
  onEvent(cb: (e: FlowEvent) => void): () => void;
  settlement(): Settlement | null;
  terminationReason(): RuntimeTerminationReason | null;
  terminationDetail(): unknown;
  dispose(): void;
}

type RuntimePhase = ReturnType<RoundRuntime['phase']>;

function readonlyBidding(state: BiddingState): BiddingState {
  const clone = { ...state, grabQueue: state.grabQueue.slice() };
  Object.freeze(clone.grabQueue);
  return Object.freeze(clone) as BiddingState;
}

class RoundRuntimeImpl implements RoundRuntime {
  private readonly rng: Rng;
  private readonly baseScore: number;
  private readonly thinkingDelayMs: number;
  private readonly clock: Clock;
  private readonly bidPolicy: BidPolicy;
  private readonly playPolicy: PlayPolicy;
  private readonly maxTurns: number;
  private readonly maxRedeals: number;
  private readonly persist?: RuntimeConfig['persist'];
  private readonly onSettled?: RuntimeConfig['onSettled'];
  private readonly subscribers = new Set<(e: FlowEvent) => void>();
  private readonly pendingReplayEvents: FlowEvent[] = [];

  private heroSeat: SeatIndex;
  private currentDeal: Deal | null = null;
  private bidding: BiddingState | null = null;
  private state: RoundState | null = null;
  private currentPhase: RuntimePhase = 'bidding';
  private bidMultiplier: number;
  private currentSettlement: Settlement | null = null;
  private redeals = 0;
  private gameEvents: GameEvent[];
  private currentTerminationReason: RuntimeTerminationReason | null = null;
  private currentTerminationDetail: unknown;
  private settledNotified = false;
  private replayClosed = false;

  constructor(config: RuntimeConfig, resume?: ResumeSnapshot) {
    const policies = levelPolicies(config.levels);
    this.rng = createRng(config.seed);
    this.baseScore = config.baseScore ?? DEFAULT_BASE_SCORE;
    this.thinkingDelayMs = config.thinkingDelayMs ?? DEFAULT_THINKING_DELAY_MS;
    this.clock = config.clock ?? realClock;
    this.bidPolicy = config.bidPolicy ?? policies.bidPolicy ?? defaultBidPolicy;
    this.playPolicy = config.playPolicy ?? policies.playPolicy ?? defaultPlayPolicy;
    this.maxTurns = config.maxTurns ?? DEFAULT_MAX_TURNS;
    this.maxRedeals = config.maxRedeals ?? DEFAULT_MAX_REDEALS;
    this.persist = config.persist;
    this.onSettled = config.onSettled;
    this.heroSeat = resume?.heroSeat ?? config.heroSeat;
    this.bidMultiplier = resume?.bidMultiplier ?? 1;
    this.gameEvents = resume?.events.slice() ?? [];

    if (resume) {
      this.state = resume.state;
      this.currentPhase = resume.state.phase === GamePhase.Settled ? 'settled' : 'playing';
      this.finishIfSettled();
    } else {
      this.startDeal();
    }

    this.scheduleAdvance();
  }

  phase(): RuntimePhase {
    return this.currentPhase;
  }

  currentSnapshot(): GameSnapshot | null {
    return this.state ? snapshot(this.state, this.heroSeat) : null;
  }

  currentBidding(): BiddingState | null {
    return this.currentPhase === 'bidding' && this.bidding ? readonlyBidding(this.bidding) : null;
  }

  biddingDeal(): BiddingDealView | null {
    // T-FLOW-BID 架构桩——实现方实现函数体（见 coordination/tasks/T-FLOW-BID.md）。
    return null;
  }

  isPlayerTurn(): boolean {
    if (this.currentPhase === 'bidding') return this.bidding?.turn === this.heroSeat;
    if (this.currentPhase === 'playing') return this.state?.turn === this.heroSeat;
    return false;
  }

  legalInputs(): PlayerInput[] | null {
    if (!this.isPlayerTurn()) return null;

    if (this.currentPhase === 'bidding' && this.bidding) {
      const pass: PlayerInput = { kind: 'bid', action: { type: 'pass', seat: this.heroSeat } };
      const positive: PlayerInput =
        this.bidding.phase === 'calling'
          ? { kind: 'bid', action: { type: 'call', seat: this.heroSeat } }
          : { kind: 'bid', action: { type: 'grab', seat: this.heroSeat } };
      return [positive, pass];
    }

    if (this.currentPhase === 'playing' && this.state) {
      const snap = snapshot(this.state, this.heroSeat);
      const hand = snap.viewerHand ?? [];
      const moves = this.state.top === null ? enumerateMoves(hand) : legalFollows(hand, this.state.top.pattern);
      const inputs: PlayerInput[] = moves.map((move) => ({
        kind: 'play',
        action: { type: 'play', seat: this.heroSeat, cards: move.cards.slice() },
      }));
      if (this.state.top !== null) inputs.push({ kind: 'play', action: { type: 'pass', seat: this.heroSeat } });
      return inputs;
    }

    return null;
  }

  async submitPlayerAction(input: PlayerInput): Promise<SubmitResult> {
    if (!this.isPlayerTurn()) return { ok: false, error: { reason: 'NOT_PLAYER_TURN' } };

    const events: FlowEvent[] = [];
    try {
      if (this.currentPhase === 'bidding') {
        if (input.kind !== 'bid' || !this.bidding) return { ok: false, error: { reason: 'INVALID_INPUT_PHASE' } };
        this.bidding = applyBiddingStep(this.bidding, input.action);
        this.emit(biddingEvent(input.action, this.bidding), events);
      } else if (this.currentPhase === 'playing') {
        if (input.kind !== 'play' || !this.state) return { ok: false, error: { reason: 'INVALID_INPUT_PHASE' } };
        const result = applyPlayStep(this.state, input.action);
        this.state = result.state;
        this.pushApplyResult(result, events);
        this.finishIfSettled(events);
      }
    } catch (error) {
      if (error instanceof IllegalActionError) return { ok: false, error: { reason: error.reason } };
      this.terminateWithError(error);
      return { ok: false, events, error: { reason: INTERNAL_ERROR_REASON } };
    }

    await this.advanceUntilPause(events);
    if (this.currentTerminationReason === 'error') {
      return { ok: false, events, error: { reason: INTERNAL_ERROR_REASON } };
    }
    return {
      ok: true,
      snapshot: this.currentSnapshot() ?? undefined,
      bidding: this.currentBidding() ?? undefined,
      events,
    };
  }

  onEvent(cb: (e: FlowEvent) => void): () => void {
    this.subscribers.add(cb);
    if (!this.replayClosed) for (const event of this.pendingReplayEvents) this.deliver(cb, event);
    return () => void this.subscribers.delete(cb);
  }

  settlement(): Settlement | null {
    return this.currentSettlement;
  }

  terminationReason(): RuntimeTerminationReason | null {
    return this.currentTerminationReason;
  }

  terminationDetail(): unknown {
    return this.currentTerminationDetail;
  }

  dispose(): void {
    this.currentPhase = 'disposed';
    this.subscribers.clear();
  }

  private startDeal(): void {
    this.gameEvents = [];
    this.currentDeal = createRoundDeal(this.rng);
    this.bidding = createBidding(DEFAULT_START_SEAT);
    this.currentPhase = 'bidding';
    this.emit({ type: 'deal' });
  }

  private scheduleAdvance(): void {
    void this.advanceUntilPause().catch((error) => this.terminateWithError(error));
  }

  private async advanceUntilPause(bucket?: FlowEvent[]): Promise<void> {
    try {
      let steps = 0;
      while (this.currentPhase !== 'disposed') {
        if (steps >= this.maxTurns) {
          this.terminateWithError(new Error('ROUND_RUNTIME_MAX_TURNS'));
          return;
        }
        steps++;

        if (this.currentPhase === 'bidding') {
          if (!this.bidding || !this.currentDeal) {
            this.terminateWithError(new Error('BIDDING_STATE_MISSING'));
            return;
          }
          if (this.bidding.phase === 'done') {
            this.enterPlaying(bucket);
            continue;
          }
          if (this.bidding.phase === 'redeal') {
            this.redeal(bucket);
            continue;
          }
          if (this.bidding.turn === this.heroSeat) return;

          await this.sleepForAi();
          if (this.isDisposed()) return;
          const action = decideBidAction({ bidding: this.bidding, deal: this.currentDeal, bidPolicy: this.bidPolicy });
          this.bidding = applyBiddingStep(this.bidding, action);
          this.emit(biddingEvent(action, this.bidding), bucket);
          continue;
        }

        if (this.currentPhase === 'playing') {
          if (!this.state || this.state.phase === GamePhase.Settled) {
            this.finishIfSettled(bucket);
            return;
          }
          if (this.state.turn === this.heroSeat) return;

          await this.sleepForAi();
          if (this.isDisposed()) return;
          const action = decidePlayAction({ state: this.state, playPolicy: this.playPolicy, rng: this.rng });
          const result = applyPlayStep(this.state, action);
          this.state = result.state;
          this.pushApplyResult(result, bucket);
          this.finishIfSettled(bucket);
          continue;
        }

        return;
      }
    } catch (error) {
      this.terminateWithError(error);
    }
  }

  private async sleepForAi(): Promise<void> {
    await this.clock.sleep(this.thinkingDelayMs);
  }

  private isDisposed(): boolean {
    return this.currentPhase === 'disposed';
  }

  private emit(event: FlowEvent, bucket?: FlowEvent[]): void {
    if (this.currentPhase === 'disposed') return;
    bucket?.push(event);
    if (
      !this.replayClosed &&
      this.subscribers.size === 0 &&
      this.pendingReplayEvents.length === 0 &&
      this.isReplayableStartupEvent(event)
    ) {
      this.pendingReplayEvents.push(event);
    }
    const closeReplayAfterDelivery = this.subscribers.size > 0 && this.pendingReplayEvents.length > 0;
    for (const subscriber of this.subscribers) this.deliver(subscriber, event);
    if (closeReplayAfterDelivery) {
      this.replayClosed = true;
      this.pendingReplayEvents.length = 0;
    }
  }

  private isReplayableStartupEvent(event: FlowEvent): boolean {
    return event.type === 'deal';
  }

  private deliver(subscriber: (event: FlowEvent) => void, event: FlowEvent): void {
    try {
      subscriber(event);
    } catch {
      // Subscriber failures must not break runtime advancement or other subscribers.
    }
  }

  private pushApplyResult(result: { events: GameEvent[] }, bucket?: FlowEvent[]): void {
    if (!this.state) return;
    const flowEvents: FlowEvent[] = [];
    pushRoundEvents(flowEvents, this.gameEvents, { state: this.state, events: result.events });
    for (const event of flowEvents) this.emit(event, bucket);
  }

  private enterPlaying(bucket?: FlowEvent[]): void {
    if (!this.bidding || this.bidding.landlord === null || !this.currentDeal) {
      this.terminateWithError(new Error('BIDDING_DONE_WITHOUT_LANDLORD'));
      return;
    }
    this.bidMultiplier = this.bidding.multiplier;
    this.emit(
      { type: 'landlordDecided', landlord: this.bidding.landlord, bidMultiplier: this.bidding.multiplier },
      bucket,
    );
    if (this.isDisposed()) return;
    this.state = createPlayingState(this.currentDeal, this.bidding.landlord);
    if (this.isDisposed()) return;
    this.persist?.({
      round: this.state,
      heroSeat: this.heroSeat,
      bidMultiplier: this.bidMultiplier,
      events: this.gameEvents.slice(),
    });
    this.bidding = null;
    this.currentPhase = 'playing';
  }

  private redeal(bucket?: FlowEvent[]): void {
    this.redeals++;
    this.emit({ type: 'redeal', attempt: this.redeals }, bucket);
    if (this.isDisposed()) return;
    if (this.redeals > this.maxRedeals) {
      this.currentTerminationReason = 'redealExhausted';
      this.currentPhase = 'disposed';
      return;
    }
    this.startDeal();
  }

  private finishIfSettled(bucket?: FlowEvent[]): void {
    if (!this.state || this.state.phase !== GamePhase.Settled || this.settledNotified) return;
    const win = winEventFrom(this.gameEvents);
    if (!win) return;
    this.currentSettlement = settleFromGameEvents({
      landlord: this.state.landlord,
      winner: win.side,
      bidMultiplier: this.bidMultiplier,
      events: this.gameEvents,
      baseScore: this.baseScore,
    });
    this.currentPhase = 'settled';
    this.currentTerminationReason = 'settled';
    this.settledNotified = true;
    this.emit({ type: 'settled', settlement: this.currentSettlement }, bucket);
    if (this.isDisposed()) return;
    this.onSettled?.({
      landlord: this.state.landlord,
      winner: win.side,
      settlement: this.currentSettlement,
    });
  }

  private terminateWithError(error: unknown): void {
    if (this.currentTerminationReason === 'settled') return;
    this.currentTerminationReason = 'error';
    this.currentTerminationDetail = error;
    this.currentPhase = 'disposed';
  }
}

export function startRoundRuntime(config: RuntimeConfig): RoundRuntime {
  return new RoundRuntimeImpl(config);
}

export function resumeRoundRuntime(resume: ResumeSnapshot, config: RuntimeConfig): RoundRuntime {
  return new RoundRuntimeImpl(config, resume);
}
