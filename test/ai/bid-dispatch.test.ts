/**
 * W-AI 修订版：bid dispatch 单一真相源（规划者修订种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/ai/bid-dispatch.test.ts，独立 seed commit（B2 棒）。
 *
 * ── 修订依据（最小修订：仅「keeps level behavior」一例随全体上移换钉）──
 *   基线 chooseBid/actionForStrength/isStrongHand 三者零改动，前三例逐字保留；
 *   末例：Simple 对两控牌手 `2 2 3 4 5` 由 pass 改 call（≈旧 Normal 口径）；
 *   Hard 结构化判强行为（单控散手 pass / 两控短手 call）数值上由 bidding-eval 承接，钉扎保留。
 *
 * ── 预期红（对 main 现实现）── 末例 1 红（Simple 现为 pass）。
 * ── 负向变异自证：Simple 阈值回旧口径 → 末例红。
 */
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

  it('keeps level behavior aligned with the W-AI tier shift', () => {
    const state = createBidding(0);

    expect(chooseBidByLevel(cards('2 2 3 4 5'), state, AiLevel.Normal)).toEqual(
      chooseBid(cards('2 2 3 4 5'), state),
    );
    // W-AI 全体上移(披露):Simple ≈ 旧 Normal——两控牌手由 pass 改 call。
    expect(chooseBidByLevel(cards('2 2 3 4 5'), state, AiLevel.Simple).type).toBe('call');
    // W-AUDIT-AI 契约改写(披露):Hard 弃「1 高牌即抢」,单控牌散手 → pass(语义已并入 bidding-eval)。
    expect(chooseBidByLevel(cards('2 3 4 5 6'), state, AiLevel.Hard).type).toBe('pass');
    expect(chooseBidByLevel(cards('2 2 3 4 5'), state, AiLevel.Hard).type).toBe('call');
  });
});
