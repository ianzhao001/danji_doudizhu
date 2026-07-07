/**
 * P-BID-POLISH G3 阈值对齐失败测试（规划者预写种子·2026-07-08）。
 * 落位机制（压缩轮次·批次连做）：执行者开工 P-BID-POLISH 时将本文件**原样复制**到
 * `test/ai/bidding-advisor.test.ts`（覆盖旧版），作为独立 commit「seed(P-BID-POLISH): relocate planner seed」；
 * 内容一字不得改动，审查者对 seeds 源文件与落位文件做逐字节一致核。
 * 契约：adviseBid(hand, phase, level) 按 bidding-levels 的 thresholdFor(level) 取阈值
 * （Simple 3 / Normal 2 / Hard 1）——与三档 AI 叫牌同一真相源，不再硬编码 2。
 * 预期红因：现 adviseBid 为两参硬编码阈值 2（TS2554）+ thresholdFor 未导出（TS2305）；
 * P-BID-POLISH 实现后全绿、typecheck 须净。
 */
import { describe, it, expect } from 'vitest';
import { adviseBid } from '../../assets/scripts/ai/bidding-advisor';
import { isStrongHand } from '../../assets/scripts/ai/bidding';
import { thresholdFor } from '../../assets/scripts/ai/bidding-levels';
import { AiLevel } from '../../assets/scripts/ai/strategy';
import { Rank, Suit, type Card } from '../../assets/scripts/rules';

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit });
// 高牌 = rank ≥ R2（含 2 与双王）；三手均不含火箭/炸弹，强弱完全由高牌数决定。
const twoHigh = [c(Rank.R2, Suit.Spade), c(Rank.SmallJoker, Suit.Joker), c(Rank.R5, Suit.Heart)];
const oneHigh = [c(Rank.R2, Suit.Spade), c(Rank.R9, Suit.Club), c(Rank.R5, Suit.Heart)];
const zeroHigh = [c(Rank.R3, Suit.Spade), c(Rank.R7, Suit.Heart), c(Rank.K, Suit.Club)];
const ALL_LEVELS = [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard];

describe('P-BID-POLISH G3 adviseBid 按档阈值对齐', () => {
  it('Simple(阈3)：两高牌手 pass——比 Normal 更保守', () => {
    expect(adviseBid(twoHigh, 'calling', AiLevel.Simple)).toEqual({ suggestion: 'pass', strong: false });
    expect(adviseBid(twoHigh, 'grabbing', AiLevel.Simple)).toEqual({ suggestion: 'pass', strong: false });
  });

  it('Normal(阈2)：两高牌手 call/grab、单高牌手 pass——与旧硬编码阈值 2 行为一致', () => {
    expect(adviseBid(twoHigh, 'calling', AiLevel.Normal)).toEqual({ suggestion: 'call', strong: true });
    expect(adviseBid(twoHigh, 'grabbing', AiLevel.Normal)).toEqual({ suggestion: 'grab', strong: true });
    expect(adviseBid(oneHigh, 'calling', AiLevel.Normal)).toEqual({ suggestion: 'pass', strong: false });
  });

  it('Hard(阈1)：单高牌手即 call/grab——比 Normal 更激进', () => {
    expect(adviseBid(oneHigh, 'calling', AiLevel.Hard)).toEqual({ suggestion: 'call', strong: true });
    expect(adviseBid(oneHigh, 'grabbing', AiLevel.Hard)).toEqual({ suggestion: 'grab', strong: true });
  });

  it('零高牌手三档两相全 pass', () => {
    for (const lv of ALL_LEVELS) {
      expect(adviseBid(zeroHigh, 'calling', lv)).toEqual({ suggestion: 'pass', strong: false });
      expect(adviseBid(zeroHigh, 'grabbing', lv)).toEqual({ suggestion: 'pass', strong: false });
    }
  });

  it('同一真相源：strong ≡ isStrongHand(hand, thresholdFor(level))·三档×三手全对齐且确定', () => {
    for (const lv of ALL_LEVELS) {
      for (const hand of [twoHigh, oneHigh, zeroHigh]) {
        expect(adviseBid(hand, 'calling', lv).strong).toBe(isStrongHand(hand, thresholdFor(lv)));
        expect(adviseBid(hand, 'calling', lv)).toEqual(adviseBid(hand, 'calling', lv));
      }
    }
  });
});
