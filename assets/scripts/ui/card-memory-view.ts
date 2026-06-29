import type { CardMemory } from '../ai/cardMemory';
import { RANK_LABEL, Rank } from '../rules';

export interface CardMemoryRow {
  rankLabel: string;
  remaining: number;
  exhausted: boolean;
}

export interface CardMemoryView {
  rows: CardMemoryRow[];
}

const RANKS_DESC: Rank[] = [
  Rank.BigJoker,
  Rank.SmallJoker,
  Rank.R2,
  Rank.A,
  Rank.K,
  Rank.Q,
  Rank.J,
  Rank.R10,
  Rank.R9,
  Rank.R8,
  Rank.R7,
  Rank.R6,
  Rank.R5,
  Rank.R4,
  Rank.R3,
];

function label(rank: Rank): string {
  if (rank === Rank.SmallJoker) return '小王';
  if (rank === Rank.BigJoker) return '大王';
  return RANK_LABEL[rank];
}

export function deriveCardMemoryView(memory: CardMemory): CardMemoryView {
  return {
    rows: RANKS_DESC.map((rank) => {
      const remaining = Math.max(0, memory.remainingByRank[rank] ?? 0);
      return { rankLabel: label(rank), remaining, exhausted: remaining === 0 };
    }),
  };
}
