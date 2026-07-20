import { createDeck, type Card } from '../../../assets/scripts/rules';
import type { GameEvent, GameSnapshot } from '../../../assets/scripts/game';
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

/**
 * 公开底牌归因下界：农民视角把尚未由地主打出的底牌点数钉在地主手中。
 * 地主所出同点牌可能来自原手，扣除只会低估，不会制造隐藏信息。
 */
export function certainLandlordByRank(
  snapshot: GameSnapshot,
  history: GameEvent[],
): Readonly<Record<number, number>> | null {
  if (snapshot.turn === snapshot.landlord || !snapshot.bottom || snapshot.bottom.length === 0) return null;
  const certain: Record<number, number> = {};
  for (const rank of ALL_RANKS) certain[rank] = 0;
  for (const card of snapshot.bottom) certain[card.rank] += 1;
  for (const event of history) {
    if (event.type !== 'play' || event.seat !== snapshot.landlord) continue;
    for (const card of event.pattern.cards) {
      if (certain[card.rank] > 0) certain[card.rank] -= 1;
    }
  }
  return Object.freeze(certain);
}
