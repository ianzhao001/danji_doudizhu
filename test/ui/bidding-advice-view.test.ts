import { describe, expect, it } from 'vitest';
import { deriveBiddingAdviceView } from '../../assets/scripts/ui/bidding-advice-view';

describe('deriveBiddingAdviceView', () => {
  it('maps call advice', () => {
    expect(deriveBiddingAdviceView({ suggestion: 'call', strong: true })).toEqual({
      text: '建议叫地主',
      emphasize: true,
    });
  });

  it('maps grab advice', () => {
    expect(deriveBiddingAdviceView({ suggestion: 'grab', strong: true })).toEqual({
      text: '建议抢地主',
      emphasize: true,
    });
  });

  it('maps pass advice and follows strong for emphasis', () => {
    expect(deriveBiddingAdviceView({ suggestion: 'pass', strong: false })).toEqual({
      text: '建议不叫',
      emphasize: false,
    });
  });
});
