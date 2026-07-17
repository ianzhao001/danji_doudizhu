/**
 * W-AI S8 种子：统一叫牌评分（规划者预写红种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制到 test/ai/bidding-eval.test.ts（新建），独立 seed commit。
 * 实现目标：assets/scripts/ai/bidding-eval.ts ——
 *   bidScore(hand): number —— 控牌轴（火箭/炸弹/高牌）+ 短手型溢价（decompose 手数）+ evaluateHand 兜底连续量；
 *   bidThresholdFor(level): number —— 三档阈值，Simple > Normal > Hard（Hard 最精准激进）；
 *   isStrongByScore(hand, level): boolean ≡ bidScore(hand) ≥ bidThresholdFor(level)。
 *   同一真相源：chooseBidByLevel 与 adviseBid、AI 与玩家建议全部走本模块
 *   （修复旧口径分裂：advisor 的 Hard 仍走「阈 1 逢局必叫」而 AI 走结构化判强）。
 *   常量校准以 W-AI-bidding-levels-revised 的行为矩阵为准；本文件只钉方向性与结构性质（常数鲁棒）。
 *
 * ── 预期红（实现前）── 模块不存在 → 全文件红（5 用例）。
 *
 * ── 负向变异自证（执行者实现后自查，报告注明红几条）──
 *   ① 三档阈值写反（Hard 最高）→ 阈值单调用例红。
 *   ② bidScore 漏掉炸弹项 → 炸弹方向用例红。
 *   ③ isStrongByScore 不走 bidScore（另起炉灶）→ 恒等式用例红。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai/strategy';
import { bidScore, bidThresholdFor, isStrongByScore } from '../../assets/scripts/ai/bidding-eval';
import { cards } from '../rules/_util';

const LEVELS = [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard] as const;

describe('W-AI S8 bidding-eval 统一叫牌评分', () => {
  it('阈值单调：Simple > Normal > Hard（档位越高判强越准越敢叫）', () => {
    expect(bidThresholdFor(AiLevel.Simple)).toBeGreaterThan(bidThresholdFor(AiLevel.Normal));
    expect(bidThresholdFor(AiLevel.Normal)).toBeGreaterThan(bidThresholdFor(AiLevel.Hard));
  });

  it('方向性：火箭手 > 无控散手；带炸弹 > 拆掉炸弹的同型手；多控 > 少控', () => {
    expect(bidScore(cards('x X 3 4 5'))).toBeGreaterThan(bidScore(cards('3 4 5 6 7')));
    expect(bidScore(cards('6 6 6 6 3'))).toBeGreaterThan(bidScore(cards('6 6 6 3 3')));
    expect(bidScore(cards('2 2 3 4 5'))).toBeGreaterThan(bidScore(cards('2 3 4 5 6')));
  });

  it('恒强底线：火箭/炸弹手在三档全部判强（恒强语义并入评分后不得丢失）', () => {
    for (const level of LEVELS) {
      expect(isStrongByScore(cards('x X 3 4 5'), level), `火箭 @${level}`).toBe(true);
      expect(isStrongByScore(cards('6 6 6 6 3'), level), `炸弹 @${level}`).toBe(true);
    }
  });

  it('恒弱底线：零控散手（3 4 5 6 7 与 2 3 4 5 6）三档全不判强', () => {
    for (const level of LEVELS) {
      expect(isStrongByScore(cards('3 4 5 6 7'), level), `纯顺散手 @${level}`).toBe(false);
      expect(isStrongByScore(cards('2 3 4 5 6'), level), `单控散手 @${level}`).toBe(false);
    }
  });

  it('恒等式与确定性：isStrongByScore ≡ bidScore≥阈值；纯函数不改入参', () => {
    const hands = ['2 2 3 4 5', '2 3 4 5 6', 'x X 3 4 5', '3 4 5 6 7', '6 6 6 6 3', '2 2 3 3 4 4'];
    for (const spec of hands) {
      const hand = cards(spec);
      const before = hand.map((card) => `${card.rank}:${card.suit}`).join(',');
      for (const level of LEVELS) {
        expect(isStrongByScore(hand, level)).toBe(bidScore(hand) >= bidThresholdFor(level));
      }
      expect(bidScore(hand)).toBe(bidScore(hand));
      expect(hand.map((card) => `${card.rank}:${card.suit}`).join(',')).toBe(before);
    }
  });
});
