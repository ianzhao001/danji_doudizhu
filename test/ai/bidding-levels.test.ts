/**
 * W-AI 修订版：叫抢难度分层（规划者修订种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/ai/bidding-levels.test.ts，独立 seed commit（B2 棒）。
 *
 * ── 修订依据 ──
 *   ① 单一真相源统一到 bidding-eval：chooseBidByLevel(hand,state,level) ≡
 *      actionForStrength(state, isStrongByScore(hand, level))——三档全走评分（旧 thresholdFor
 *      高牌阈值口径与 isHardStrongHand 快路退役，2 控牌+短手型语义并入 bidScore）。
 *   ② 全体上移：Simple 叫牌口径 ≈ 旧 Normal——两控牌手 `2 2 3 4 5` 由 pass 改 call。
 *   行为矩阵六手为 bidScore 常量的校准集（B2 调参必须同时满足；调不拢=阻断上报，禁改本矩阵）。
 *
 * ── 预期红（对 main 现实现）── isStrongByScore 不存在 → 全文件红（4 用例）。
 *
 * ── 负向变异自证（执行者实现后自查）──
 *   ① chooseBidByLevel 的 Hard 改回 isHardStrongHand 快路 → 同源恒等用例（若行为分叉）红；
 *      快路语义已并入评分，等价时以源码检查（B2 复审 diff）为准。
 *   ② Simple 阈值调回旧口径（两控 pass）→ 矩阵用例红。
 */
import { describe, it, expect } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import { chooseBidByLevel } from '../../assets/scripts/ai/bidding-levels';
import { actionForStrength } from '../../assets/scripts/ai/bidding';
import { isStrongByScore } from '../../assets/scripts/ai/bidding-eval';
import { createBidding, applyBid } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const calling = () => createBidding(0);
const grabbing = () => applyBid(createBidding(0), { type: 'call', seat: 0 }); // turn → 1

const LEVELS = [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard] as const;
const CALIBRATION = ['2 2 3 4 5', '2 3 4 5 6', '2 2 3 3 4 4', 'x X 3 4 5', '3 4 5 6 7', '6 6 6 6 3'];

describe('W-AI 叫抢难度分层（bidding-eval 单一真相源）', () => {
  it('同源恒等：chooseBidByLevel ≡ actionForStrength(state, isStrongByScore)（六手×三档×两相）', () => {
    for (const spec of CALIBRATION) {
      for (const level of LEVELS) {
        const callState = calling();
        expect(chooseBidByLevel(cards(spec), callState, level))
          .toEqual(actionForStrength(callState, isStrongByScore(cards(spec), level)));
        const grabState = grabbing();
        expect(chooseBidByLevel(cards(spec), grabState, level))
          .toEqual(actionForStrength(grabState, isStrongByScore(cards(spec), level)));
      }
    }
  });

  it('行为矩阵（校准集）：强手三档 call、散手三档 pass', () => {
    // 全体上移：两控牌 2 2 3 4 5 —— Simple 也 call（旧口径 Simple=pass 随用户裁决废止）。
    for (const level of LEVELS) {
      expect(chooseBidByLevel(cards('2 2 3 4 5'), calling(), level).type, `22345 @${level}`).toBe('call');
      expect(chooseBidByLevel(cards('2 2 3 3 4 4'), calling(), level).type, `223344 @${level}`).toBe('call');
      expect(chooseBidByLevel(cards('x X 3 4 5'), calling(), level).type, `火箭 @${level}`).toBe('call');
      expect(chooseBidByLevel(cards('6 6 6 6 3'), calling(), level).type, `炸弹 @${level}`).toBe('call');
      expect(chooseBidByLevel(cards('2 3 4 5 6'), calling(), level).type, `单控散手 @${level}`).toBe('pass');
      expect(chooseBidByLevel(cards('3 4 5 6 7'), calling(), level).type, `零控散手 @${level}`).toBe('pass');
    }
  });

  it('grabbing 阶段动作 seat === state.turn（三档）', () => {
    const s = grabbing();
    for (const level of LEVELS) {
      const a = chooseBidByLevel(cards('2 2 3 4 5'), s, level);
      expect(a.seat).toBe(s.turn);
      expect(a.type).toBe('grab');
    }
  });

  it('确定性：同手同态两次调用深相等', () => {
    for (const level of LEVELS) {
      const s = calling();
      expect(chooseBidByLevel(cards('2 2 3 4 5'), s, level))
        .toEqual(chooseBidByLevel(cards('2 2 3 4 5'), s, level));
    }
  });
});
