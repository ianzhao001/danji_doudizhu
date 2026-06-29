import { describe, expect, it } from 'vitest';
import { settle } from '../../assets/scripts/game/settlement';
import { Side, type GameEvent, type SeatIndex } from '../../assets/scripts/game/types';
import { Category, Rank, Suit, type Card, type HandPattern } from '../../assets/scripts/rules';

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

function singlePattern(c: Card): HandPattern {
  return { category: Category.Single, mainRank: c.rank, length: 1, cards: [c] };
}

const LANDLORD: SeatIndex = 0;
const FARMER: SeatIndex = 1;
const R3 = card(Rank.R3, Suit.Spade);
const R4 = card(Rank.R4, Suit.Heart);

type SpringCase = 'none-landlord' | 'none-farmer' | 'spring' | 'anti-spring';

function play(seat: SeatIndex, c: Card): GameEvent {
  return { type: 'play', seat, pattern: singlePattern(c) };
}

function win(winner: Side): GameEvent {
  return { type: 'win', seat: winner === Side.Landlord ? LANDLORD : FARMER, side: winner };
}

function bombEvents(count: number, includeRocket: boolean): GameEvent[] {
  const events: GameEvent[] = [];
  for (let index = 0; index < count; index++) {
    events.push(index === 0 && includeRocket ? { type: 'rocket', seat: FARMER } : { type: 'bomb', seat: LANDLORD });
  }
  return events;
}

function eventsFor(springCase: SpringCase, bombs: GameEvent[]): { winner: Side; events: GameEvent[] } {
  switch (springCase) {
    case 'spring':
      return { winner: Side.Landlord, events: [play(LANDLORD, R3), ...bombs, win(Side.Landlord)] };
    case 'anti-spring':
      return { winner: Side.Farmer, events: [play(LANDLORD, R3), play(FARMER, R4), ...bombs, win(Side.Farmer)] };
    case 'none-farmer':
      return {
        winner: Side.Farmer,
        events: [play(LANDLORD, R3), play(FARMER, R4), play(LANDLORD, R3), ...bombs, win(Side.Farmer)],
      };
    case 'none-landlord':
      return { winner: Side.Landlord, events: [play(LANDLORD, R3), play(FARMER, R4), ...bombs, win(Side.Landlord)] };
  }
}

describe('settlement multiplier stacking', () => {
  it('multiplies bid, bombs/rocket, and spring sources while keeping scores zero-sum', () => {
    const bidMultipliers = [1, 2, 4];
    const bombMatrix = [
      { count: 0, includeRocket: false },
      { count: 1, includeRocket: false },
      { count: 1, includeRocket: true },
      { count: 2, includeRocket: true },
      { count: 3, includeRocket: true },
    ];
    const springCases: SpringCase[] = ['none-landlord', 'none-farmer', 'spring', 'anti-spring'];
    const baseScore = 3;

    for (const bidMultiplier of bidMultipliers) {
      for (const bombSpec of bombMatrix) {
        for (const springCase of springCases) {
          const bombs = bombEvents(bombSpec.count, bombSpec.includeRocket);
          const { winner, events } = eventsFor(springCase, bombs);
          const result = settle({ landlord: LANDLORD, winner, bidMultiplier, events, baseScore });
          const springMultiplier = springCase === 'spring' || springCase === 'anti-spring' ? 2 : 1;
          const expectedMultiplier = bidMultiplier * 2 ** bombSpec.count * springMultiplier;
          const unit = baseScore * expectedMultiplier;

          expect(result.multiplier, `${bidMultiplier}/${bombSpec.count}/${springCase}`).toBe(expectedMultiplier);
          expect(result.bombs).toBe(bombSpec.count);
          expect(Number.isInteger(result.multiplier)).toBe(true);
          expect(result.multiplier).toBeGreaterThanOrEqual(1);
          expect(result.scores[0] + result.scores[1] + result.scores[2]).toBe(0);
          expect(result.scores).toEqual(winner === Side.Landlord ? [2 * unit, -unit, -unit] : [-2 * unit, unit, unit]);
        }
      }
    }
  });
});
