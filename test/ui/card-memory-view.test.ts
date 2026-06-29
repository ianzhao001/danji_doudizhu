import { describe, expect, it } from 'vitest';
import { Rank } from '../../assets/scripts/rules';
import type { CardMemory } from '../../assets/scripts/ai/cardMemory';
import { deriveCardMemoryView } from '../../assets/scripts/ui/card-memory-view';

function memory(overrides: Partial<Record<number, number>> = {}): CardMemory {
  const remainingByRank: Record<number, number> = {};
  for (let rank = Rank.R3; rank <= Rank.BigJoker; rank += 1) {
    remainingByRank[rank] = rank >= Rank.SmallJoker ? 1 : 4;
  }
  for (const [rank, remaining] of Object.entries(overrides)) {
    if (remaining !== undefined) remainingByRank[Number(rank)] = remaining;
  }
  return { remainingByRank, playedCount: 0 };
}

describe('deriveCardMemoryView', () => {
  it('orders rows from big joker down to 3', () => {
    expect(deriveCardMemoryView(memory()).rows.map((row) => row.rankLabel)).toEqual([
      '大王',
      '小王',
      '2',
      'A',
      'K',
      'Q',
      'J',
      '10',
      '9',
      '8',
      '7',
      '6',
      '5',
      '4',
      '3',
    ]);
  });

  it('marks exhausted ranks', () => {
    const rows = deriveCardMemoryView(memory({ [Rank.K]: 0 })).rows;
    const king = rows.find((row) => row.rankLabel === 'K');

    expect(king).toEqual({ rankLabel: 'K', remaining: 0, exhausted: true });
  });

  it('passes through remaining counts', () => {
    const rows = deriveCardMemoryView(memory({ [Rank.R2]: 2 })).rows;

    expect(rows.find((row) => row.rankLabel === '2')).toMatchObject({ remaining: 2, exhausted: false });
  });

  it('clamps bad negative counts to exhausted zero', () => {
    const rows = deriveCardMemoryView(memory({ [Rank.R3]: -3 })).rows;

    expect(rows.find((row) => row.rankLabel === '3')).toEqual({ rankLabel: '3', remaining: 0, exhausted: true });
  });
});
