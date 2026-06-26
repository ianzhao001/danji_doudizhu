/**
 * M3-00 失败测试：结算弹窗视图模型（架构种入·不可改）。当前 result-view.ts 为桩 → 应先红。
 */
import { describe, it, expect } from 'vitest';
import { deriveResultView } from '../../assets/scripts/ui/result-view';
import { type Settlement, Side } from '../../assets/scripts/game';

function settlement(winner: Side, multiplier = 1, bombs = 0, spring: 'none' | 'spring' | 'anti-spring' = 'none'): Settlement {
  // 地主赢：地主 +2unit，农民 -unit； Farmer 赢反之。这里 unit=multiplier（baseScore=1, 2^0）
  const unit = multiplier;
  const landlordScore = winner === Side.Landlord ? 2 * unit : -2 * unit;
  const farmerScore = winner === Side.Landlord ? -unit : unit;
  return {
    multiplier,
    spring,
    bombs,
    scores: [landlordScore, farmerScore, farmerScore],
  };
}

describe('M3-00 结算弹窗视图模型', () => {
  it('地主赢、hero 是地主：胜利、isLandlord、score>0', () => {
    const s = settlement(Side.Landlord, 2, 1);
    const v = deriveResultView({ settlement: s, landlord: 0, heroSeat: 0 });
    expect(v.resultText).toBe('胜利');
    const hero = v.scores.find((r) => r.seat === 0)!;
    expect(hero.isLandlord).toBe(true);
    expect(hero.score).toBeGreaterThan(0);
  });

  it('地主赢、hero 是农民：失败、score<0', () => {
    const s = settlement(Side.Landlord);
    const v = deriveResultView({ settlement: s, landlord: 0, heroSeat: 1 });
    expect(v.resultText).toBe('失败');
    expect(v.scores.find((r) => r.seat === 1)!.score).toBeLessThan(0);
  });

  it('农民赢、hero 是农民：胜利、score>0', () => {
    const s = settlement(Side.Farmer);
    const v = deriveResultView({ settlement: s, landlord: 0, heroSeat: 1 });
    expect(v.resultText).toBe('胜利');
    expect(v.scores.find((r) => r.seat === 1)!.score).toBeGreaterThan(0);
  });

  it('三家 score 之和为 0；multiplier/bombs 透传', () => {
    const s = settlement(Side.Landlord, 4, 2);
    const v = deriveResultView({ settlement: s, landlord: 0, heroSeat: 0 });
    const sum = v.scores.reduce((a, b) => a + b.score, 0);
    expect(sum).toBe(0);
    expect(v.multiplier).toBe(4);
    expect(v.bombs).toBe(2);
  });

  it('spring 各值文案正确', () => {
    for (const [spring, text] of [['none', ''], ['spring', '春天'], ['anti-spring', '反春天']] as const) {
      const s = settlement(Side.Landlord, 1, 0, spring);
      expect(deriveResultView({ settlement: s, landlord: 0, heroSeat: 0 }).springText).toBe(text);
    }
  });

  it('入参不变', () => {
    const s = settlement(Side.Landlord);
    const frozen = { ...s, scores: [...s.scores] as [number, number, number] };
    deriveResultView({ settlement: s, landlord: 0, heroSeat: 0 });
    expect(s).toEqual(frozen);
  });
});
