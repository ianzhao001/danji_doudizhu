import { describe, expect, it } from 'vitest';

import { deserializeSave, SAVE_VERSION, serializeSave, type SaveSlot } from '../../assets/scripts/data/save';
import { GamePhase, Side, type GameEvent, type RoundState } from '../../assets/scripts/game';
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
    bottom: null,
  };
}

function slot(overrides: Partial<SaveSlot> = {}): SaveSlot {
  return { version: SAVE_VERSION, savedAt: 10, round: round(), ...overrides };
}

describe('save resume payload fields', () => {
  it('omits optional resume fields when they are absent', () => {
    const wire = JSON.parse(serializeSave(slot()));

    expect(wire).not.toHaveProperty('heroSeat');
    expect(wire).not.toHaveProperty('bidMultiplier');
    expect(wire).not.toHaveProperty('events');
  });

  it('serializes and deserializes optional resume fields', () => {
    const events: GameEvent[] = [{ type: 'win', seat: 2, side: Side.Landlord }];
    const back = deserializeSave(serializeSave(slot({ heroSeat: 0, bidMultiplier: 4, events })));

    expect(back.heroSeat).toBe(0);
    expect(back.bidMultiplier).toBe(4);
    expect(back.events).toEqual(events);
  });

  it('normalizes invalid bidMultiplier values to one', () => {
    for (const bidMultiplier of [0, -1, 1.5, Number.NaN]) {
      const json = JSON.stringify({ ...JSON.parse(serializeSave(slot())), bidMultiplier });
      expect(deserializeSave(json).bidMultiplier).toBe(1);
    }
  });

  it('normalizes invalid bidMultiplier during serialization', () => {
    const wire = JSON.parse(serializeSave(slot({ bidMultiplier: 0 })));

    expect(wire.bidMultiplier).toBe(1);
  });

  it('rejects invalid heroSeat and non-array events', () => {
    const base = JSON.parse(serializeSave(slot()));

    expect(() => deserializeSave(JSON.stringify({ ...base, heroSeat: 9 }))).toThrow(/heroSeat/);
    expect(() => deserializeSave(JSON.stringify({ ...base, events: 'x' }))).toThrow(/events/);
  });

  it('requires savedAt to be a non-negative integer', () => {
    const base = JSON.parse(serializeSave(slot()));

    expect(() => deserializeSave(JSON.stringify({ ...base, savedAt: 1.5 }))).toThrow(/savedAt/);
    expect(() => deserializeSave(JSON.stringify({ ...base, savedAt: -1 }))).toThrow(/savedAt/);
    expect(deserializeSave(JSON.stringify({ ...base, savedAt: 0 })).savedAt).toBe(0);
  });
});
