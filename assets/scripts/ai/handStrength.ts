import { type Card, Rank, isSequenceable } from '../rules';

export interface HandStrength {
  score: number;
  bombs: number;
  rockets: number;
  highCards: number;
  longestStraight: number;
}

export const ALL_RANKS: readonly Rank[] = [
  Rank.R3,
  Rank.R4,
  Rank.R5,
  Rank.R6,
  Rank.R7,
  Rank.R8,
  Rank.R9,
  Rank.R10,
  Rank.J,
  Rank.Q,
  Rank.K,
  Rank.A,
  Rank.R2,
  Rank.SmallJoker,
  Rank.BigJoker,
];

// Strength score terms: rare made hands, high-card control, straight potential, groups, and hand volume.
const STRENGTH_WEIGHTS = {
  rocket: 24,
  bomb: 18,
  highCard: 5,
  straightExtraRank: 4,
  pair: 2,
  trip: 3,
  handSizeCap: 20,
} as const;

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function countByRank(cards: Card[]): Map<Rank, number> {
  const counts = new Map<Rank, number>();
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
  }
  return counts;
}

function straightLength(counts: Map<Rank, number>): number {
  let best = 0;
  let current = 0;
  for (const rank of ALL_RANKS) {
    if (!isSequenceable(rank)) {
      current = 0;
    } else if ((counts.get(rank) ?? 0) > 0) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

export function evaluateHand(cards: Card[]): HandStrength {
  if (cards.length === 0) {
    return { score: 0, bombs: 0, rockets: 0, highCards: 0, longestStraight: 0 };
  }

  const counts = countByRank(cards);
  const rockets =
    (counts.get(Rank.SmallJoker) ?? 0) > 0 && (counts.get(Rank.BigJoker) ?? 0) > 0 ? 1 : 0;
  const bombs = ALL_RANKS.filter((rank) => (counts.get(rank) ?? 0) >= 4).length;
  const highCards = cards.filter((card) => card.rank >= Rank.R2).length;
  const longestStraight = straightLength(counts);
  const pairs = ALL_RANKS.filter((rank) => (counts.get(rank) ?? 0) >= 2).length;
  const trips = ALL_RANKS.filter((rank) => (counts.get(rank) ?? 0) >= 3).length;

  const score = clampScore(
    rockets * STRENGTH_WEIGHTS.rocket +
      bombs * STRENGTH_WEIGHTS.bomb +
      highCards * STRENGTH_WEIGHTS.highCard +
      Math.max(0, longestStraight - 4) * STRENGTH_WEIGHTS.straightExtraRank +
      pairs * STRENGTH_WEIGHTS.pair +
      trips * STRENGTH_WEIGHTS.trip +
      Math.min(cards.length, STRENGTH_WEIGHTS.handSizeCap),
  );

  return { score, bombs, rockets, highCards, longestStraight };
}
