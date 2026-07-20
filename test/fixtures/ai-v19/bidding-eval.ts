import { Rank, type Card } from '../../../assets/scripts/rules';
import { decompose } from './decompose';
import { evaluateHand } from './handStrength';
import { AiLevel } from './strategy';

const THRESHOLDS: Record<AiLevel, number> = {
  [AiLevel.Simple]: 35.3,
  [AiLevel.Normal]: 35,
  [AiLevel.Hard]: 34.5,
};

export function bidScore(hand: Card[]): number {
  const strength = evaluateHand(hand);
  const highControl = hand.reduce((sum, card) => {
    if (card.rank === Rank.BigJoker) return sum + 16;
    if (card.rank === Rank.SmallJoker) return sum + 14;
    if (card.rank === Rank.R2) return sum + 10;
    return sum;
  }, 0);
  const shortHandPremium = Math.max(0, 10 - decompose(hand).moveCount) * 2;
  return strength.rockets * 80
    + strength.bombs * 72
    + highControl
    + shortHandPremium
    + strength.score * 0.2;
}

export function bidThresholdFor(level: AiLevel): number {
  return THRESHOLDS[level];
}

export function isStrongByScore(hand: Card[], level: AiLevel): boolean {
  return bidScore(hand) >= bidThresholdFor(level);
}
