import { describe, expect, it } from 'vitest';

import { SAVE_VERSION, type SaveSlot } from '../../assets/scripts/data/save';
import { GamePhase, resumeRound, Side, type GameEvent, type RoundState } from '../../assets/scripts/game';
import { Rank, Suit } from '../../assets/scripts/rules';

function round(): RoundState {
  return {
    phase: GamePhase.Playing,
    landlord: 1,
    seats: [
      { index: 0, hand: [{ rank: Rank.R3, suit: Suit.Spade }] },
      { index: 1, hand: [{ rank: Rank.R4, suit: Suit.Heart }] },
      { index: 2, hand: [{ rank: Rank.R5, suit: Suit.Club }] },
    ],
    turn: 1,
    top: null,
    passesInARow: 0,
    winner: null,
    bombsPlayed: 0,
  };
}

describe('resumeRound', () => {
  it('returns a complete resume snapshot from a full save slot', () => {
    const events: GameEvent[] = [{ type: 'win', seat: 1, side: Side.Landlord }];
    const slot: SaveSlot = { version: SAVE_VERSION, savedAt: 1, round: round(), heroSeat: 0, bidMultiplier: 4, events };

    expect(resumeRound(slot)).toEqual({
      state: slot.round,
      heroSeat: 0,
      bidMultiplier: 4,
      events,
    });
  });

  it('falls back for v1 save slots without resume payload fields', () => {
    const slot: SaveSlot = { version: SAVE_VERSION, savedAt: 1, round: round() };

    expect(resumeRound(slot)).toEqual({
      state: slot.round,
      heroSeat: slot.round.landlord,
      bidMultiplier: 1,
      events: [],
    });
  });
});
