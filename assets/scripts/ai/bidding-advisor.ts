import { isStrongHand } from './bidding';
import { thresholdFor } from './bidding-levels';
import { AiLevel } from './strategy';
import type { Card } from '../rules';

export interface BidAdvice {
  suggestion: 'call' | 'grab' | 'pass';
  strong: boolean;
}

export function adviseBid(hand: Card[], phase: 'calling' | 'grabbing', level: AiLevel): BidAdvice {
  const strong = isStrongHand(hand, thresholdFor(level));
  if (!strong) return { suggestion: 'pass', strong };
  return { suggestion: phase === 'calling' ? 'call' : 'grab', strong };
}
