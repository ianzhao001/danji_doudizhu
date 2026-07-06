import type { AiLevel } from '../ai';
import { GamePhase, type BidAction, type BiddingState, type GameEvent, type GameSnapshot, type ResumeSnapshot, type RoundAction, type RoundFinishInput, type RoundState, type SeatIndex, type Settlement } from '../game';
import { createRng, type Deal, type Rng } from '../rules';
import { realClock, type Clock } from './clock';
import { defaultPlayPolicy } from './driver';
import { levelPolicies } from './policies';
import { defaultBidPolicy, type BidPolicy, type BiddingDealView, type FlowEvent, type PlayPolicy } from './types';
import {
  runtimeBidding,
  runtimeBiddingDeal,
  runtimeIsPlayerTurn,
  runtimeLegalInputs,
  runtimeSnapshot,
  advanceRuntimeUntilPause,
  scheduleRuntimeAdvance,
  startRuntimeDeal,
  submitRuntimePlayerAction,
  type RuntimeDriverContext,
} from './runtime/bidding-driver';
import { emitRuntimeEvent, subscribeRuntimeEvent, type RuntimeEventReplayContext } from './runtime/event-replay';
import { finishRuntimeIfSettled, type RuntimePersistenceContext } from './runtime/persistence';

const DEFAULT_BASE_SCORE = 1;
const DEFAULT_THINKING_DELAY_MS = 0;
const DEFAULT_MAX_REDEALS = 10;
const DEFAULT_MAX_TURNS = 300;

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
      finishRuntimeIfSettled(this.persistenceContext());
    } else {
      startRuntimeDeal(this.driverContext());
    }

    scheduleRuntimeAdvance(this.driverContext());
  }

  phase(): RuntimePhase { return this.currentPhase; }

  currentSnapshot(): GameSnapshot | null { return runtimeSnapshot(this.driverContext()); }

  currentBidding(): BiddingState | null { return runtimeBidding(this.driverContext()); }

  biddingDeal(): BiddingDealView | null { return runtimeBiddingDeal(this.driverContext()); }

  isPlayerTurn(): boolean { return runtimeIsPlayerTurn(this.driverContext()); }

  legalInputs(): PlayerInput[] | null { return runtimeLegalInputs(this.driverContext()); }

  async submitPlayerAction(input: PlayerInput): Promise<SubmitResult> { return submitRuntimePlayerAction(this.driverContext(), input); }

  onEvent(cb: (e: FlowEvent) => void): () => void { return subscribeRuntimeEvent(this.eventReplayContext(), cb); }

  settlement(): Settlement | null { return this.currentSettlement; }

  terminationReason(): RuntimeTerminationReason | null { return this.currentTerminationReason; }

  terminationDetail(): unknown { return this.currentTerminationDetail; }

  dispose(): void {
    this.currentPhase = 'disposed';
    this.subscribers.clear();
  }

  private isDisposed(): boolean { return this.currentPhase === 'disposed'; }

  private async advanceUntilPause(bucket?: FlowEvent[]): Promise<void> { return advanceRuntimeUntilPause(this.driverContext(), bucket); }

  private emit(event: FlowEvent, bucket?: FlowEvent[]): void {
    emitRuntimeEvent(this.eventReplayContext(), event, bucket);
  }

  private driverContext(): RuntimeDriverContext {
    return this as unknown as RuntimeDriverContext;
  }

  private eventReplayContext(): RuntimeEventReplayContext {
    return this as unknown as RuntimeEventReplayContext;
  }

  private persistenceContext(): RuntimePersistenceContext {
    return this as unknown as RuntimePersistenceContext;
  }
}

export function startRoundRuntime(config: RuntimeConfig): RoundRuntime { return new RoundRuntimeImpl(config); }

export function resumeRoundRuntime(resume: ResumeSnapshot, config: RuntimeConfig): RoundRuntime { return new RoundRuntimeImpl(config, resume); }
