import { describe, expect, it } from 'vitest';

import { deserializeSave, SAVE_VERSION, serializeSave, type SaveSlot } from '../../assets/scripts/data/save';
import { GamePhase, Side, type GameEvent, type RoundState } from '../../assets/scripts/game';
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

function slot(overrides: Partial<SaveSlot> = {}): SaveSlot {
  return { version: SAVE_VERSION, savedAt: 10, round: round(), ...overrides };
}

function baseWire(): Record<string, unknown> {
  return JSON.parse(serializeSave(slot()));
}

describe('save events validation', () => {
  it('preserves valid resume events', () => {
    const events: GameEvent[] = [
      { type: 'pass', seat: 0 },
      { type: 'reset', leader: 1 },
      { type: 'win', seat: 1, side: Side.Landlord },
    ];

    expect(deserializeSave(serializeSave(slot({ events }))).events).toEqual(events);
  });

  it('rejects invalid event entries instead of blindly casting them', () => {
    for (const events of [
      [null],
      [{ type: 'unknown', seat: 0 }],
      [{ type: 'pass', seat: 9 }],
      [{ type: 'win', seat: 1, side: 'x' }],
      [{ type: 'play', seat: 1 }],
    ]) {
      expect(() => deserializeSave(JSON.stringify({ ...baseWire(), events }))).toThrow(/events contains invalid entry/);
    }
  });
});
