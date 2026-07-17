import { createDeck, type Card } from '../../../assets/scripts/rules';
import type { GameEvent } from '../../../assets/scripts/game';
import { ALL_RANKS } from './handStrength';

export interface CardMemory {
  readonly remainingByRank: Readonly<Record<number, number>>;
  readonly playedCount: number;
}

function initialRemaining(): Record<number, number> {
  const remaining: Record<number, number> = {};
  for (const rank of ALL_RANKS) remaining[rank] = 0;
  for (const card of createDeck()) remaining[card.rank] += 1;
  return remaining;
}

function decrement(remaining: Record<number, number>, cards: Card[]): number {
  let deducted = 0;
  for (const card of cards) {
    const current = remaining[card.rank] ?? 0;
    if (current <= 0) continue;
    remaining[card.rank] = current - 1;
    deducted += 1;
  }
  return deducted;
}

export function trackPlayed(events: GameEvent[], ownHand: Card[] = []): CardMemory {
  const remainingByRank = initialRemaining();
  let playedCount = 0;

  decrement(remainingByRank, ownHand);

  for (const event of events) {
    if (event.type === 'play') {
      playedCount += decrement(remainingByRank, event.pattern.cards);
    }
  }

  return Object.freeze({ remainingByRank: Object.freeze(remainingByRank), playedCount });
}
