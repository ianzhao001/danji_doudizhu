import { describe, expect, it } from 'vitest';

import { SAVE_VERSION, toResumePayload, type SaveSlot } from '../../assets/scripts/data/save';
import { GamePhase, resumeRound, Side, type GameEvent, type ResumePayload, type RoundState } from '../../assets/scripts/game';
import { Rank, Suit } from '../../assets/scripts/rules';

function round(): RoundState {
  return {
    phase: GamePhase.Playing,
    landlord: 2,
    seats: [
      { index: 0, hand: [{ rank: Rank.R3, suit: Suit.Spade }] },
      { index: 1, hand: [{ rank: Rank.R4, suit: Suit.Heart }] },
      { index: 2, hand: [{ rank: Rank.R5, suit: Suit.Club }] },
    ],
    turn: 2,
    top: null,
    passesInARow: 0,
    winner: null,
    bombsPlayed: 0,
  };
}

describe('resume payload layering', () => {
  it('resumes from a game-owned ResumePayload without data SaveSlot metadata', () => {
    const events: GameEvent[] = [{ type: 'win', seat: 2, side: Side.Landlord }];
    const payload: ResumePayload = { round: round(), heroSeat: 0, bidMultiplier: 4, events };

    expect(resumeRound(payload)).toEqual({
      state: payload.round,
      heroSeat: 0,
      bidMultiplier: 4,
      events,
    });
  });

  it('projects a SaveSlot to ResumePayload and preserves v1 fallback semantics', () => {
    const slot: SaveSlot = { version: SAVE_VERSION, savedAt: 123, round: round() };

    expect(resumeRound(toResumePayload(slot))).toEqual({
      state: slot.round,
      heroSeat: slot.round.landlord,
      bidMultiplier: 1,
      events: [],
    });
  });
});
