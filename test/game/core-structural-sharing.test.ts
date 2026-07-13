import { describe, expect, it } from 'vitest';
import { recognize } from '../../assets/scripts/rules';
import { apply, GamePhase, type RoundState } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

function playing(hands: [string, string, string], opts: Partial<RoundState> = {}): RoundState {
  return {
    phase: GamePhase.Playing,
    landlord: 0,
    seats: [
      { index: 0, hand: cards(hands[0]) },
      { index: 1, hand: cards(hands[1]) },
      { index: 2, hand: cards(hands[2]) },
    ],
    turn: 0,
    top: null,
    passesInARow: 0,
    winner: null,
    bombsPlayed: 0,
    bottom: null,
    ...opts,
  };
}

describe('game-core structural sharing', () => {
  it('keeps all seat and hand references when a pass only advances turn', () => {
    const top = { seat: 0 as const, pattern: recognize(cards('9'))! };
    const state = playing(['9', '4 5', '6'], { turn: 1, top });

    const result = apply(state, { type: 'pass', seat: 1 });

    expect(result.state.seats).toBe(state.seats);
    expect(result.state.seats[0]).toBe(state.seats[0]);
    expect(result.state.seats[1]).toBe(state.seats[1]);
    expect(result.state.seats[2]).toBe(state.seats[2]);
    expect(result.state.seats[1].hand).toBe(state.seats[1].hand);
    expect(result.state.turn).toBe(2);
    expect(result.state.passesInARow).toBe(1);
  });

  it('keeps all seat references when the second pass resets top', () => {
    const top = { seat: 0 as const, pattern: recognize(cards('9'))! };
    const state = playing(['9', '4', '6'], { turn: 2, top, passesInARow: 1 });

    const result = apply(state, { type: 'pass', seat: 2 });

    expect(result.state.seats).toBe(state.seats);
    expect(result.state.seats[0]).toBe(state.seats[0]);
    expect(result.state.seats[1]).toBe(state.seats[1]);
    expect(result.state.seats[2]).toBe(state.seats[2]);
    expect(result.state.top).toBeNull();
    expect(result.state.turn).toBe(0);
  });

  it('replaces only the playing seat and leaves old state hands unchanged', () => {
    const state = playing(['3 4 5', '6 7', '8'], { turn: 0 });
    const originalHand = state.seats[0].hand;

    const result = apply(state, { type: 'play', seat: 0, cards: cards('3') });

    expect(result.state.seats).not.toBe(state.seats);
    expect(result.state.seats[0]).not.toBe(state.seats[0]);
    expect(result.state.seats[0].hand).not.toBe(originalHand);
    expect(result.state.seats[0].hand).toEqual(cards('4 5'));
    expect(originalHand).toEqual(cards('3 4 5'));
    expect(result.state.seats[1]).toBe(state.seats[1]);
    expect(result.state.seats[2]).toBe(state.seats[2]);
  });
});
