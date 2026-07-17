/**
 * W-VISION S3 engine-free card choreography island.
 *
 * A choreography is a deterministic description of how to travel from one
 * authoritative CardStage to the next. It never owns card content or node
 * lifetime. Its only animated properties are transform and opacity, and every
 * track finishes at the exact transform derived by the next CardStage.
 */

import { cardChoreographyParams } from './animation-params';
import type { CardPlacement, CardStage } from './card-stage';

export interface CardTransform {
  x: number;
  y: number;
  scale: number;
  angle: number;
  z: number;
}

export type CardEasing = 'linear' | 'quadIn' | 'quadOut' | 'quadInOut';

export interface CardChoreographySegment {
  durationMs: number;
  easing: CardEasing;
  to: CardTransform;
  opacity: number;
}

export interface CardChoreographyTrack {
  key: string;
  from: CardTransform;
  fromOpacity: number;
  segments: readonly CardChoreographySegment[];
}

export interface CardChoreography {
  /** Stable event identity used by the animator for R1 idempotence. */
  id: string;
  /** Blocking choreographies disable card actions until settled. */
  blocking: boolean;
  tracks: readonly CardChoreographyTrack[];
  /** Cards absent from next; render remains responsible for removing them. */
  removedKeys: readonly string[];
  /** Longest track, including deterministic per-card holds. */
  durationMs: number;
}

export interface PlanCardChoreographyArgs {
  id: string;
  previous: CardStage;
  next: CardStage;
  blocking?: boolean;
}

export type CardChoreographyStartDecision =
  | { kind: 'ignore' }
  | { kind: 'settle-and-start'; choreography: CardChoreography };

/** Engine adapter boundary for the behavior-tested animation lifecycle. */
export interface CardAnimationSink<TNode> {
  apply(node: TNode, transform: CardTransform, opacity: number): void;
  stop(node: TNode): void;
  animate(node: TNode, track: CardChoreographyTrack, done: () => void): void;
}

interface LifecycleTrack<TNode> {
  node: TNode;
  terminal: CardTransform;
  terminalOpacity: number;
}

interface LifecycleRun<TNode> {
  id: string;
  blocking: boolean;
  tracks: Map<string, LifecycleTrack<TNode>>;
}

/**
 * Pure ownership/interruption state machine shared by Vitest and Cocos.
 * The sink is the only engine-specific surface. Both natural completion and
 * R2 settlement apply the authoritative terminal before releasing ownership.
 */
export class CardAnimationLifecycle<TNode> {
  private prepared: CardChoreography | null = null;
  private active: LifecycleRun<TNode> | null = null;
  private ownedKeys = new Set<string>();
  private lastStartedId: string | null = null;

  constructor(
    private readonly sink: CardAnimationSink<TNode>,
    private readonly onSettled?: () => void,
  ) {}

  owns(key: string): boolean {
    return this.ownedKeys.has(key);
  }

  isAnimating(): boolean {
    return this.ownedKeys.size > 0;
  }

  isBusy(): boolean {
    return Boolean((this.prepared?.blocking && this.prepared.tracks.length > 0)
      || (this.active?.blocking && this.active.tracks.size > 0));
  }

  prepare(choreography: CardChoreography): boolean {
    const decision = decideCardChoreographyStart(this.lastStartedId, choreography);
    if (decision.kind === 'ignore') return false;

    this.settleAll(false);
    this.lastStartedId = choreography.id;
    this.prepared = choreography;
    this.ownedKeys = new Set(choreography.tracks.map((track) => track.key));
    return true;
  }

  startPrepared(resolveNode: (key: string) => TNode | null): void {
    const choreography = this.prepared;
    this.prepared = null;
    if (!choreography || choreography.tracks.length === 0) {
      this.ownedKeys.clear();
      return;
    }

    const run: LifecycleRun<TNode> = {
      id: choreography.id,
      blocking: choreography.blocking,
      tracks: new Map<string, LifecycleTrack<TNode>>(),
    };
    this.active = run;

    for (const track of choreography.tracks) {
      const node = resolveNode(track.key);
      if (node === null) {
        this.ownedKeys.delete(track.key);
        continue;
      }
      const terminal = track.segments.at(-1);
      if (!terminal) throw new Error(`card choreography track ${track.key} has no terminal segment`);
      run.tracks.set(track.key, {
        node,
        terminal: terminal.to,
        terminalOpacity: terminal.opacity,
      });
      this.sink.apply(node, track.from, track.fromOpacity);
    }

    if (run.tracks.size === 0) {
      this.finishRun(run, true);
      return;
    }

    const immediate = choreography.tracks.every((track) =>
      track.segments.every((segment) => segment.durationMs === 0));
    if (immediate) {
      for (const entry of run.tracks.values()) {
        this.sink.apply(entry.node, entry.terminal, entry.terminalOpacity);
      }
      this.finishRun(run, true);
      return;
    }

    for (const track of choreography.tracks) {
      const entry = run.tracks.get(track.key);
      if (!entry) continue;
      this.sink.animate(entry.node, track, () => this.finishTrack(run, track.key));
    }
  }

  settleAll(notify = true): void {
    const prepared = this.prepared;
    const run = this.active;
    const hadWork = Boolean(prepared?.tracks.length || run?.tracks.size);
    this.prepared = null;

    if (run) {
      for (const entry of run.tracks.values()) {
        this.sink.stop(entry.node);
        this.sink.apply(entry.node, entry.terminal, entry.terminalOpacity);
      }
    }

    this.active = null;
    this.ownedKeys.clear();
    if (notify && hadWork) this.onSettled?.();
  }

  reset(): void {
    this.settleAll(false);
    this.lastStartedId = null;
  }

  private finishTrack(run: LifecycleRun<TNode>, key: string): void {
    if (this.active !== run) return;
    const entry = run.tracks.get(key);
    if (!entry) return;

    this.sink.apply(entry.node, entry.terminal, entry.terminalOpacity);
    run.tracks.delete(key);
    this.ownedKeys.delete(key);
    if (run.tracks.size === 0) this.finishRun(run, true);
  }

  private finishRun(run: LifecycleRun<TNode>, notify: boolean): void {
    if (this.active !== run) return;
    this.active = null;
    this.ownedKeys.clear();
    if (notify) this.onSettled?.();
  }
}

/**
 * Diff two authoritative stages into stable, key-addressed animation tracks.
 * Tracks follow next.placements order, which CardStage guarantees is ascending
 * z order. Cards removed from next deliberately have no track: there is no
 * authoritative terminal placement for an exit animation to target.
 */
export function planCardChoreography(args: PlanCardChoreographyArgs): CardChoreography {
  if (args.id.length === 0) throw new Error('card choreography id must not be empty');
  validateStage(args.previous, 'previous');
  validateStage(args.next, 'next');

  const params = cardChoreographyParams();
  const tracks: CardChoreographyTrack[] = [];
  let newHandIndex = 0;

  for (const placement of args.next.placements) {
    const previous = args.previous.byKey.get(placement.key);
    const terminal = cardTransform(placement);
    const from = previous ? cardTransform(previous) : spawnTransform(placement);
    const fromOpacity = previous ? 255 : 0;

    if (previous && sameTransform(from, terminal)) continue;

    const holdMs = !previous && placement.zone === 'hand'
      ? params.dealStaggerMs * newHandIndex++
      : 0;
    const segments: CardChoreographySegment[] = [];
    if (holdMs > 0) {
      segments.push({
        durationMs: holdMs,
        easing: 'linear',
        to: cloneTransform(from),
        opacity: fromOpacity,
      });
    }

    if (placement.zone === 'table') {
      segments.push(...playSegments(placement.key, from, terminal, fromOpacity));
    } else {
      const durationMs = placement.zone === 'hand' && !previous
        ? params.dealMs
        : placement.zone === 'bottom' && !previous
          ? params.revealMs
          : params.reflowMs;
      segments.push({
        durationMs,
        easing: 'quadOut',
        to: cloneTransform(terminal),
        opacity: 255,
      });
    }

    tracks.push({
      key: placement.key,
      from,
      fromOpacity,
      segments,
    });
  }

  const removedKeys = args.previous.placements
    .filter((placement) => !args.next.byKey.has(placement.key))
    .map((placement) => placement.key);

  return {
    id: args.id,
    blocking: args.blocking ?? true,
    tracks,
    removedKeys,
    durationMs: tracks.reduce((longest, track) => (
      Math.max(longest, track.segments.reduce((sum, segment) => sum + segment.durationMs, 0))
    ), 0),
  };
}

/** Stage-neutral cues (bomb/rocket/audio-only events) must not interrupt a live flight. */
export function isNoopCardChoreography(choreography: CardChoreography): boolean {
  return choreography.tracks.length === 0 && choreography.removedKeys.length === 0;
}

/** R1/R2 decision: duplicates/no-ops do nothing; a changed new id settles then starts. */
export function decideCardChoreographyStart(
  lastStartedId: string | null,
  choreography: CardChoreography,
): CardChoreographyStartDecision {
  return lastStartedId === choreography.id || isNoopCardChoreography(choreography)
    ? { kind: 'ignore' }
    : { kind: 'settle-and-start', choreography };
}

/** R3 adapter: retain the same route and terminals while removing all time. */
export function instant(choreography: CardChoreography): CardChoreography {
  return {
    ...choreography,
    durationMs: 0,
    tracks: choreography.tracks.map((track) => ({
      ...track,
      from: cloneTransform(track.from),
      segments: track.segments.map((segment) => ({
        ...segment,
        durationMs: 0,
        to: cloneTransform(segment.to),
      })),
    })),
    removedKeys: [...choreography.removedKeys],
  };
}

/** Public conversion shared by choreography planning and animator settlement. */
export function cardTransform(placement: CardPlacement): CardTransform {
  return {
    x: placement.x,
    y: placement.y,
    scale: placement.scale,
    angle: placement.angle,
    z: placement.z,
  };
}

function playSegments(
  key: string,
  from: CardTransform,
  terminal: CardTransform,
  fromOpacity: number,
): CardChoreographySegment[] {
  const params = cardChoreographyParams();
  const riseMs = params.playMs - params.playImpactMs - params.playReboundMs;
  if (riseMs <= 0) throw new Error('card choreography play timing must leave a positive rise segment');
  const direction = stableDirection(key);
  const middle: CardTransform = {
    x: (from.x + terminal.x) / 2,
    y: Math.max(from.y, terminal.y) + params.playLiftY,
    scale: (from.scale + terminal.scale) / 2,
    angle: (from.angle + terminal.angle) / 2 + direction * params.playRotateDeg,
    z: terminal.z,
  };
  const impact: CardTransform = {
    x: terminal.x,
    y: terminal.y,
    scale: terminal.scale * params.playImpactScale,
    angle: terminal.angle,
    z: terminal.z,
  };
  return [
    {
      durationMs: riseMs,
      easing: 'quadOut',
      to: middle,
      opacity: fromOpacity === 0 ? 255 : fromOpacity,
    },
    {
      durationMs: params.playImpactMs,
      easing: 'quadIn',
      to: impact,
      opacity: 255,
    },
    {
      durationMs: params.playReboundMs,
      easing: 'quadOut',
      to: cloneTransform(terminal),
      opacity: 255,
    },
  ];
}

function spawnTransform(placement: CardPlacement): CardTransform {
  if (!placement.spawnFrom) return cardTransform(placement);
  return {
    x: placement.spawnFrom.x,
    y: placement.spawnFrom.y,
    scale: placement.spawnFrom.scale,
    angle: placement.spawnFrom.angle,
    z: placement.z,
  };
}

function sameTransform(left: CardTransform, right: CardTransform): boolean {
  return left.x === right.x
    && left.y === right.y
    && left.scale === right.scale
    && left.angle === right.angle
    && left.z === right.z;
}

function cloneTransform(transform: CardTransform): CardTransform {
  return { ...transform };
}

function stableDirection(key: string): -1 | 1 {
  let sum = 0;
  for (let index = 0; index < key.length; index += 1) sum += key.charCodeAt(index);
  return sum % 2 === 0 ? 1 : -1;
}

function validateStage(stage: CardStage, label: string): void {
  const seen = new Set<string>();
  for (const placement of stage.placements) {
    if (seen.has(placement.key)) throw new Error(`${label} CardStage contains duplicate key ${placement.key}`);
    seen.add(placement.key);
    if (stage.byKey.get(placement.key) !== placement) {
      throw new Error(`${label} CardStage byKey does not reference placement ${placement.key}`);
    }
    finiteTransform(cardTransform(placement), `${label}.${placement.key}`);
    if (placement.spawnFrom) {
      for (const [name, value] of Object.entries(placement.spawnFrom)) {
        if (!Number.isFinite(value)) throw new Error(`${label}.${placement.key}.spawnFrom.${name} must be finite`);
      }
    }
  }
  if (stage.byKey.size !== seen.size) throw new Error(`${label} CardStage byKey contains an unknown key`);
}

function finiteTransform(transform: CardTransform, label: string): void {
  for (const [name, value] of Object.entries(transform)) {
    if (!Number.isFinite(value)) throw new Error(`${label}.${name} must be finite`);
  }
}
