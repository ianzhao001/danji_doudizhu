/**
 * W-AI 修订版：玩家叫牌建议同源（规划者修订种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/ai/bidding-advisor.test.ts，独立 seed commit（B2 棒）。
 *
 * ── 修订依据（修复口径分裂）──
 *   旧实现：adviseBid 走 thresholdFor（Hard=阈1「逢局必叫」），而 AI 实际走结构化判强——
 *   给玩家的建议与 AI 自己的行为不一致。新契约：adviseBid ≡ isStrongByScore 同一真相源，
 *   建议即「同难度 AI 会怎么叫」。旧「Hard 单高牌即 call」激进钉随之废止。
 *
 * ── 预期红（对 main 现实现）── isStrongByScore 不存在 → 全文件红（4 用例）。
 *
 * ── 负向变异自证（执行者实现后自查）──
 *   ① adviseBid 改回 thresholdFor 口径 → 同源恒等用例红（22345 @Simple 分叉）。
 *   ② suggestion 相位映射写反（calling→grab）→ 相位用例红。
 */
import { describe, it, expect } from 'vitest';
import { adviseBid } from '../../assets/scripts/ai/bidding-advisor';
import { isStrongByScore } from '../../assets/scripts/ai/bidding-eval';
import { AiLevel } from '../../assets/scripts/ai/strategy';
import { cards } from '../rules/_util';

const LEVELS = [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard] as const;
const HANDS = ['2 2 3 4 5', '2 3 4 5 6', 'x X 3 4 5', '3 4 5 6 7', '6 6 6 6 3', '2 2 3 3 4 4'];

describe('W-AI adviseBid 与 AI 同源（isStrongByScore 单一真相源）', () => {
  it('同源恒等：strong ≡ isStrongByScore(hand, level)，suggestion 随相位映射（六手×三档×两相）', () => {
    for (const spec of HANDS) {
      for (const level of LEVELS) {
        const strong = isStrongByScore(cards(spec), level);
        expect(adviseBid(cards(spec), 'calling', level))
          .toEqual({ suggestion: strong ? 'call' : 'pass', strong });
        expect(adviseBid(cards(spec), 'grabbing', level))
          .toEqual({ suggestion: strong ? 'grab' : 'pass', strong });
      }
    }
  });

  it('全体上移锚：两控牌 2 2 3 4 5 三档建议 call（Simple 不再劝退）', () => {
    for (const level of LEVELS) {
      expect(adviseBid(cards('2 2 3 4 5'), 'calling', level).suggestion, `@${level}`).toBe('call');
    }
  });

  it('口径分裂修复锚：单控散手 2 3 4 5 6 三档建议 pass（旧 Hard 阈1「逢局必叫」废止）', () => {
    for (const level of LEVELS) {
      expect(adviseBid(cards('2 3 4 5 6'), 'calling', level)).toEqual({ suggestion: 'pass', strong: false });
      expect(adviseBid(cards('2 3 4 5 6'), 'grabbing', level)).toEqual({ suggestion: 'pass', strong: false });
    }
  });

  it('确定性：同入参重复调用深相等', () => {
    for (const level of LEVELS) {
      expect(adviseBid(cards('2 2 3 4 5'), 'calling', level))
        .toEqual(adviseBid(cards('2 2 3 4 5'), 'calling', level));
    }
  });
});
