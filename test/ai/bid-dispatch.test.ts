import { describe, expect, it } from 'vitest';

import { AiLevel, chooseBid, chooseBidByLevel, isStrongHand } from '../../assets/scripts/ai';
import { actionForStrength } from '../../assets/scripts/ai/bidding';
import { applyBid, createBidding, type BiddingState } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

function grabbing(): BiddingState {
  return applyBid(createBidding(0), { type: 'call', seat: 0 });
}

function redeal(): BiddingState {
  let state = createBidding(0);
  state = applyBid(state, { type: 'pass', seat: 0 });
  state = applyBid(state, { type: 'pass', seat: 1 });
  return applyBid(state, { type: 'pass', seat: 2 });
}

function done(): BiddingState {
  let state = createBidding(0);
  state = applyBid(state, { type: 'call', seat: 0 });
  state = applyBid(state, { type: 'pass', seat: 1 });
  return applyBid(state, { type: 'pass', seat: 2 });
}

describe('bid dispatch single source', () => {
  it('makes chooseBid equivalent to actionForStrength in calling phase', () => {
    for (const hand of ['2 2 3 4 5', '3 4 5 6 7', 'x X 3 4 5']) {
      const state = createBidding(0);
      expect(chooseBid(cards(hand), state)).toEqual(actionForStrength(state, isStrongHand(cards(hand), 2)));
    }
  });

  it('makes chooseBid equivalent to actionForStrength in grabbing phase', () => {
    for (const hand of ['2 2 3 4 5', '3 4 5 6 7', '6 6 6 6 3']) {
      const state = grabbing();
      expect(chooseBid(cards(hand), state)).toEqual(actionForStrength(state, isStrongHand(cards(hand), 2)));
    }
  });

  it('throws the same closed-phase error for done and redeal states', () => {
    for (const state of [done(), redeal()]) {
      const expected = () => actionForStrength(state, true);
      const actual = () => chooseBid(cards('x X 3 4 5'), state);

      expect(actual).toThrow('chooseBid cannot act during closed bidding phase');
      expect(expected).toThrow('chooseBid cannot act during closed bidding phase');
    }
  });

  it('keeps level behavior unchanged', () => {
    const state = createBidding(0);

    expect(chooseBidByLevel(cards('2 2 3 4 5'), state, AiLevel.Normal)).toEqual(
      chooseBid(cards('2 2 3 4 5'), state),
    );
    expect(chooseBidByLevel(cards('2 2 3 4 5'), state, AiLevel.Simple).type).toBe('pass');
    // W-AUDIT-AI 契约改写(披露):Hard 弃「1 高牌即抢」,单控牌散手 → pass(见 bidding-hard.ts)。
    expect(chooseBidByLevel(cards('2 3 4 5 6'), state, AiLevel.Hard).type).toBe('pass');
    expect(chooseBidByLevel(cards('2 2 3 4 5'), state, AiLevel.Hard).type).toBe('call');
  });
});
