import type { BidAdvice } from '../ai/bidding-advisor';

export interface BiddingAdviceView {
  text: string;
  emphasize: boolean;
}

const TEXT_BY_SUGGESTION: Record<BidAdvice['suggestion'], string> = {
  call: '建议叫地主',
  grab: '建议抢地主',
  pass: '建议不叫',
};

export function deriveBiddingAdviceView(advice: BidAdvice): BiddingAdviceView {
  return {
    text: TEXT_BY_SUGGESTION[advice.suggestion],
    emphasize: advice.strong,
  };
}
