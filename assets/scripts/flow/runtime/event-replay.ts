import type { FlowEvent } from '../types';

type RuntimePhase = 'bidding' | 'playing' | 'settled' | 'disposed';

export interface RuntimeEventReplayContext {
  currentPhase: RuntimePhase;
  subscribers: Set<(e: FlowEvent) => void>;
  pendingReplayEvents: FlowEvent[];
  replayClosed: boolean;
}

export function subscribeRuntimeEvent(
  runtime: RuntimeEventReplayContext,
  cb: (e: FlowEvent) => void,
): () => void {
  runtime.subscribers.add(cb);
  if (!runtime.replayClosed) for (const event of runtime.pendingReplayEvents) deliverRuntimeEvent(cb, event);
  return () => void runtime.subscribers.delete(cb);
}

export function emitRuntimeEvent(
  runtime: RuntimeEventReplayContext,
  event: FlowEvent,
  bucket?: FlowEvent[],
): void {
  if (runtime.currentPhase === 'disposed') return;
  bucket?.push(event);
  if (
    !runtime.replayClosed &&
    runtime.subscribers.size === 0 &&
    runtime.pendingReplayEvents.length === 0 &&
    isReplayableStartupEvent(event)
  ) {
    runtime.pendingReplayEvents.push(event);
  }
  const closeReplayAfterDelivery = runtime.subscribers.size > 0 && runtime.pendingReplayEvents.length > 0;
  for (const subscriber of runtime.subscribers) deliverRuntimeEvent(subscriber, event);
  if (closeReplayAfterDelivery) {
    runtime.replayClosed = true;
    runtime.pendingReplayEvents.length = 0;
  }
}

function isReplayableStartupEvent(event: FlowEvent): boolean {
  return event.type === 'deal';
}

function deliverRuntimeEvent(subscriber: (event: FlowEvent) => void, event: FlowEvent): void {
  try {
    subscriber(event);
  } catch {
    // Subscriber failures must not break runtime advancement or other subscribers.
  }
}
