import type { FlowEvent } from '../flow/types';
import type { GameEvent } from '../game';

/** Rebuild recentEvents from persisted round history (resume path). Mirrors live cap at skeleton onEvent. */
export function rebuildRecentEvents(events: GameEvent[]): FlowEvent[] {
  return events.slice(-12).map((event) => ({ type: 'round' as const, event }));
}
