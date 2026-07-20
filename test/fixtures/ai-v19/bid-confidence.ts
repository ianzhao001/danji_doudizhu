import type { Card } from '../../../assets/scripts/rules';
import { evaluateHand } from './handStrength';

export interface BidConfidence {
  score: number;
  tier: 'low' | 'mid' | 'high';
  recommendCall: boolean;
}

function tierFor(score: number): BidConfidence['tier'] {
  if (score < 34) return 'low';
  if (score < 67) return 'mid';
  return 'high';
}

export function bidConfidence(hand: Card[]): BidConfidence {
  const score = evaluateHand(hand).score;
  const tier = tierFor(score);
  return {
    score,
    tier,
    recommendCall: tier !== 'low',
  };
}
