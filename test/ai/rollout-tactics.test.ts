import { describe, expect, it } from 'vitest';
import { Category, Rank, createRng, recognize } from '../../assets/scripts/rules';
import { RolloutPolicyCache, rolloutRound, toRankCounts, type RolloutArgs } from '../../assets/scripts/ai/rollout';
import { solveWorld } from '../../assets/scripts/ai/worldSolver';
import { cards } from '../rules/_util';

function board(...hands: [string, string, string]): [number[], number[], number[]] {
  return hands.map((hand) => toRankCounts(cards(hand))) as [number[], number[], number[]];
}
function run(counts: RolloutArgs['counts'], overrides: Partial<RolloutArgs> = {}) {
  return rolloutRound({ counts, turn: 0, landlord: 0, top: null, topSeat: null, rng: createRng(1), ...overrides });
}
function top(spec: string) {
  const pattern = recognize(cards(spec))!;
  return { category: pattern.category, mainRank: pattern.mainRank, length: pattern.length, takes: [] };
}

describe('sampled-world rollout tactics', () => {
  it('finishes an entire bomb against an enemy with more than two cards', () => {
    expect(run(board('3 3 3 3', '4 4 5 6', '7 8 9'), {
      top: recognize(cards('A')), topSeat: 1,
    })).toEqual({ winnerSide: 'landlord', plays: 1 });
  });

  it('finishes an entire rocket over an enemy bomb', () => {
    expect(run(board('x X', '4 4 5 6', '7 8 9'), {
      landlord: 1, top: recognize(cards('10 10 10 10')), topSeat: 1,
    })).toEqual({ winnerSide: 'farmer', plays: 1 });
  });

  it('never treats a bomb or a same-type hand as beating a rocket', () => {
    expect(run(board('3 3 3 3', 'A', 'K K'), {
      turn: 2, landlord: 1, top: recognize(cards('x X')), topSeat: 1,
    })).toEqual({ winnerSide: 'landlord', plays: 1 });
  });

  it('controls with A before clearing 33, matching the independent exact solver', () => {
    const counts = board('A 3 3', 'Q Q 4', 'K K 5');
    expect(solveWorld({ counts, turn: 0, landlord: 0, top: null, topSeat: null, passes: 0,
      budget: { nodes: 20000 } })).toBe('landlord');
    expect(run(counts)).toEqual({ winnerSide: 'landlord', plays: 2 });
  });

  it('does not assume A controls an opponent holding a 2', () => {
    expect(run(board('A 3 3', '2 2 4', 'K K 5')).winnerSide).toBe('farmer');
  });

  it('feeds a teammate who acts next, even if the landlord could otherwise overcall', () => {
    expect(run(board('3 3 4 6', '5', 'K K'), { landlord: 2 }))
      .toEqual({ winnerSide: 'farmer', plays: 2 });
  });

  it('feeds through the landlord only when it cannot finish or overcall the teammate', () => {
    expect(run(board('3 3 4 6', '4 4', '5'), { landlord: 1 }))
      .toEqual({ winnerSide: 'farmer', plays: 3 });
    // A low feed would let the intervening landlord clear its last 4 immediately.
    expect(run(board('3 3 6 7', '4', '5'), { landlord: 1 }).plays).toBeGreaterThan(2);
  });

  it('preserves control and feeding when all seats are rotated with a shared cache', () => {
    const policyCache = new RolloutPolicyCache();
    const fixtures = [
      { counts: board('A 3 3', 'Q Q 4', 'K K 5'), landlord: 0 as const },
      { counts: board('3 3 4 6', '5', 'K K'), landlord: 2 as const },
      { counts: board('3 3 4 6', '4', '5'), landlord: 1 as const },
    ];
    for (const entry of fixtures) {
      const expected = run(entry.counts, { landlord: entry.landlord });
      for (const shift of [0, 1, 2] as const) {
        const rotated = [0, 1, 2].map((seat) => entry.counts[(seat - shift + 3) % 3]) as RolloutArgs['counts'];
        expect(run(rotated, { turn: shift, landlord: (entry.landlord + shift) % 3 as 0 | 1 | 2, policyCache }))
          .toEqual(expected);
      }
    }
  });

  it('rechecks opponent and teammate roles when the same cache is reused', () => {
    const policyCache = new RolloutPolicyCache();
    const cases: Array<{ counts: RolloutArgs['counts']; landlord: 0 | 1 | 2 }> = [
      { counts: board('3 3 4 6', '5', 'K K'), landlord: 2 },
      { counts: board('3 3 4 6', '5', 'K K'), landlord: 0 },
      { counts: board('3 3 4 6', '4', '5'), landlord: 1 },
      { counts: board('3 3 4 6', 'A 7', '5'), landlord: 1 },
      { counts: board('A 3 3', 'Q Q 4', 'K K 5'), landlord: 0 },
      { counts: board('A 3 3', '2 2 4', 'K K 5'), landlord: 0 },
    ];
    for (const entry of [...cases, ...cases.slice().reverse()]) {
      const before = entry.counts.map((row) => row.slice());
      expect(run(entry.counts, { landlord: entry.landlord, policyCache }))
        .toEqual(run(entry.counts, { landlord: entry.landlord }));
      expect(entry.counts).toEqual(before);
    }
  });
});

describe('bounded rollout policy cache behavior', () => {
  it('owns an independent snapshot even before lazy policy evaluation', () => {
    const cache = new RolloutPolicyCache();
    const counts = toRankCounts(cards('4 4'));
    const policy = cache.hand(counts);
    counts[Rank.R4] = 0;
    counts[Rank.A] = 1;
    expect(policy.whole()?.category).toBe(Category.Pair);
    expect(policy.whole()?.mainRank).toBe(Rank.R4);
    expect(cache.hand(counts).whole()?.mainRank).toBe(Rank.A);
  });

  it('keys follow results by category, length and main rank including null results', () => {
    const cache = new RolloutPolicyCache();
    const policy = cache.hand(toRankCounts(cards('4 4 5 5 6 6 7 7 8 8 9 9 A')));
    const cases: Array<[string, Category | null, number | null, number | null]> = [
      ['3', Category.Single, Rank.R4, 1],
      ['3 3', Category.Pair, Rank.R4, 2],
      ['5 5', Category.Pair, Rank.R6, 2],
      ['3 4 5 6 7', Category.Straight, Rank.R8, 5],
      ['3 4 5 6 7 8', Category.Straight, Rank.R9, 6],
      ['4 5 6 7 8', Category.Straight, Rank.R9, 5],
      ['A A', null, null, null],
    ];
    for (const [spec, category, rank, length] of [...cases, ...cases.slice().reverse()]) {
      const result = policy.follow(top(spec));
      expect(result?.category ?? null).toBe(category);
      expect(result?.mainRank ?? null).toBe(rank);
      expect(result?.length ?? null).toBe(length);
    }
  });

  it('retains correct results after cache capacity is exhausted', () => {
    const cache = new RolloutPolicyCache();
    for (let identity = 1; identity <= 2300; identity += 1) {
      const counts = new Array<number>(Rank.BigJoker + 1).fill(0);
      let value = identity;
      for (let rank = Rank.R3; value > 0; rank += 1) {
        counts[rank] = value % 5;
        value = Math.floor(value / 5);
      }
      cache.hand(counts).whole();
    }
    const fixtures = [board('A 3 3', 'Q Q 4', 'K K 5'), board('x X 3 4 5 6 7', '4 5 6 7 8', 'K K 5')];
    for (const counts of fixtures) {
      expect(run(counts, { policyCache: cache })).toEqual(run(counts));
      expect(run(counts, { policyCache: cache })).toEqual(run(counts));
    }
  });

  it('does not confuse malformed base-5 digits with a different valid hand', () => {
    const cache = new RolloutPolicyCache();
    const valid = toRankCounts(cards('3'));
    expect(cache.hand(valid).whole()?.mainRank).toBe(Rank.R3);
    const malformed = new Array<number>(Rank.BigJoker + 1).fill(0);
    malformed[Rank.R4] = 5; // Would collide with a single 3 if treated as a base-5 digit.
    expect(cache.hand(malformed).whole()).toBeNull();
    expect(cache.hand(valid).whole()?.mainRank).toBe(Rank.R3);
  });
});
