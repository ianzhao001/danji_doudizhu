import { describe, expect, it } from 'vitest';

import { apply, GamePhase, IllegalActionError, RoundState } from '../../assets/scripts/game';
import { applyBid, createBidding } from '../../assets/scripts/game/bidding';
import { recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

function expectReason(fn: () => unknown, reason: string): void {
  try {
    fn();
    throw new Error('expected IllegalActionError');
  } catch (error) {
    expect(error).toBeInstanceOf(IllegalActionError);
    expect((error as IllegalActionError).reason).toBe(reason);
  }
}

function playing(opts: Partial<RoundState> = {}): RoundState {
  return {
    phase: GamePhase.Playing,
    landlord: 0,
    seats: [
      { index: 0, hand: cards('3 3 4 4 5 6 7') },
      { index: 1, hand: cards('4 4 6 6 8') },
      { index: 2, hand: cards('9 10 J') },
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

describe('IllegalActionError reasons in game core', () => {
  it('reports ROUND_SETTLED for actions after settlement', () => {
    expectReason(
      () => apply(playing({ phase: GamePhase.Settled }), { type: 'play', seat: 0, cards: cards('3') }),
      'ROUND_SETTLED',
    );
  });

  it('reports NOT_TURN for a non-current seat', () => {
    expectReason(() => apply(playing(), { type: 'play', seat: 1, cards: cards('4') }), 'NOT_TURN');
  });

  it('reports CARD_NOT_IN_HAND when the player lacks a card', () => {
    expectReason(() => apply(playing(), { type: 'play', seat: 0, cards: cards('A') }), 'CARD_NOT_IN_HAND');
  });

  it('reports PASS_WITHOUT_TOP when passing before any top play exists', () => {
    expectReason(() => apply(playing(), { type: 'pass', seat: 0 }), 'PASS_WITHOUT_TOP');
  });

  it('reports INVALID_PATTERN for an invalid lead pattern', () => {
    expectReason(() => apply(playing(), { type: 'play', seat: 0, cards: cards('3 4') }), 'INVALID_PATTERN');
  });

  it('reports CANNOT_BEAT for a valid pattern that cannot beat top', () => {
    const top = { seat: 0 as const, pattern: recognize(cards('5 5'))! };
    expectReason(
      () => apply(playing({ turn: 1, top }), { type: 'play', seat: 1, cards: cards('4 4') }),
      'CANNOT_BEAT',
    );
  });
});

describe('IllegalActionError reasons in bidding', () => {
  it('reports BIDDING_CLOSED for done and redeal phases', () => {
    let done = createBidding(0);
    done = applyBid(done, { type: 'call', seat: 0 });
    done = applyBid(done, { type: 'pass', seat: 1 });
    done = applyBid(done, { type: 'pass', seat: 2 });

    let redeal = createBidding(0);
    redeal = applyBid(redeal, { type: 'pass', seat: 0 });
    redeal = applyBid(redeal, { type: 'pass', seat: 1 });
    redeal = applyBid(redeal, { type: 'pass', seat: 2 });

    expectReason(() => applyBid(done, { type: 'grab', seat: 0 }), 'BIDDING_CLOSED');
    expectReason(() => applyBid(redeal, { type: 'call', seat: 0 }), 'BIDDING_CLOSED');
  });

  it('reports NOT_TURN for a bidding action from the wrong seat', () => {
    expectReason(() => applyBid(createBidding(0), { type: 'pass', seat: 1 }), 'NOT_TURN');
  });

  it('reports CANNOT_GRAB_BEFORE_CALL in calling phase', () => {
    expectReason(() => applyBid(createBidding(0), { type: 'grab', seat: 0 }), 'CANNOT_GRAB_BEFORE_CALL');
  });

  it('reports CANNOT_CALL_WHILE_GRABBING in grabbing phase', () => {
    const grabbing = applyBid(createBidding(0), { type: 'call', seat: 0 });

    expectReason(() => applyBid(grabbing, { type: 'call', seat: 1 }), 'CANNOT_CALL_WHILE_GRABBING');
  });
});
