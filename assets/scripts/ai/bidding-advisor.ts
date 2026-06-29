import { isStrongHand } from './bidding';
import type { Card } from '../rules';

export interface BidAdvice {
  suggestion: 'call' | 'grab' | 'pass';
  strong: boolean;
}

export function adviseBid(hand: Card[], phase: 'calling' | 'grabbing'): BidAdvice {
  const strong = isStrongHand(hand, 2);
  if (!strong) return { suggestion: 'pass', strong };
  return { suggestion: phase === 'calling' ? 'call' : 'grab', strong };
}
