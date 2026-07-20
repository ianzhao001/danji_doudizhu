import { Category, Rank, isSequenceable, type Card, type HandPattern, type Rng } from '../rules';

const COUNTS_LENGTH = Rank.BigJoker + 1;

interface CountPlay {
  category: Category;
  mainRank: number;
  length: number;
  takes: Array<readonly [number, number]>;
}

export interface RolloutArgs {
  counts: [number[], number[], number[]];
  turn: 0 | 1 | 2;
  landlord: 0 | 1 | 2;
  top: HandPattern | null;
  topSeat: 0 | 1 | 2 | null;
  /** B2 校准接缝：B1' 只保留 legacy 领出，不启用非整手复合牌型领出。 */
  leadPolicy?: 'legacy';
  rng: Rng;
}

export interface RolloutOutcome {
  winnerSide: 'landlord' | 'farmer';
  plays: number;
}

export function toRankCounts(cards: Card[]): number[] {
  const counts = new Array<number>(COUNTS_LENGTH).fill(0);
  for (const card of cards) counts[card.rank] += 1;
  return counts;
}

function cardCount(counts: readonly number[]): number {
  let sum = 0;
  for (let rank = Rank.R3; rank <= Rank.BigJoker; rank += 1) sum += counts[rank] ?? 0;
  return sum;
}

function take(category: Category, mainRank: number, takes: Array<readonly [number, number]>): CountPlay {
  return {
    category,
    mainRank,
    takes,
    length: takes.reduce((sum, entry) => sum + entry[1], 0),
  };
}

function usable(counts: readonly number[], rank: number): number {
  if ((counts[rank] ?? 0) === 4 && rank <= Rank.R2) return 0;
  if ((rank === Rank.SmallJoker || rank === Rank.BigJoker)
    && (counts[Rank.SmallJoker] ?? 0) > 0 && (counts[Rank.BigJoker] ?? 0) > 0) return 0;
  return counts[rank] ?? 0;
}

function exactSequence(counts: readonly number[], each: number, ranks: number): CountPlay | null {
  let first = -1;
  let last = -1;
  for (let rank = Rank.R3; rank <= Rank.BigJoker; rank += 1) {
    const count = counts[rank] ?? 0;
    if (count === 0) continue;
    if (!isSequenceable(rank) || count !== each) return null;
    if (first < 0) first = rank;
    if (last >= 0 && rank !== last + 1) return null;
    last = rank;
  }
  if (first < 0 || last - first + 1 !== ranks) return null;
  const takes: Array<readonly [number, number]> = [];
  for (let rank = first; rank <= last; rank += 1) takes.push([rank, each]);
  return take(each === 1 ? Category.Straight : Category.ConsecutivePairs, last, takes);
}

function wholePlay(counts: readonly number[]): CountPlay | null {
  const total = cardCount(counts);
  const occupied: number[] = [];
  for (let rank = Rank.R3; rank <= Rank.BigJoker; rank += 1) if ((counts[rank] ?? 0) > 0) occupied.push(rank);
  if (total === 1) return take(Category.Single, occupied[0], [[occupied[0], 1]]);
  if (total === 2 && counts[Rank.SmallJoker] === 1 && counts[Rank.BigJoker] === 1) {
    return take(Category.Rocket, Rank.BigJoker, [[Rank.SmallJoker, 1], [Rank.BigJoker, 1]]);
  }
  if (occupied.length === 1) {
    const rank = occupied[0];
    if (total === 2) return take(Category.Pair, rank, [[rank, 2]]);
    if (total === 3) return take(Category.Trips, rank, [[rank, 3]]);
    if (total === 4) return take(Category.Bomb, rank, [[rank, 4]]);
  }
  if (total >= 5) {
    const straight = exactSequence(counts, 1, total);
    if (straight) return straight;
  }
  if (total >= 6 && total % 2 === 0) {
    const pairs = exactSequence(counts, 2, total / 2);
    if (pairs) return pairs;
  }
  const tripRanks = occupied.filter((rank) => counts[rank] === 3);
  if (tripRanks.length >= 2) {
    const consecutive = tripRanks.every((rank, index) => (
      isSequenceable(rank) && (index === 0 || rank === tripRanks[index - 1] + 1)
    ));
    if (consecutive) {
      const wingRanks = occupied.filter((rank) => !tripRanks.includes(rank));
      if (total === tripRanks.length * 4 && wingRanks.length === tripRanks.length
        && wingRanks.every((rank) => counts[rank] === 1)) {
        return take(Category.AirplaneSingles, tripRanks[tripRanks.length - 1], [
          ...tripRanks.map((rank) => [rank, 3] as const),
          ...wingRanks.map((rank) => [rank, 1] as const),
        ]);
      }
      if (total === tripRanks.length * 5 && wingRanks.length === tripRanks.length
        && wingRanks.every((rank) => counts[rank] === 2)) {
        return take(Category.AirplanePairs, tripRanks[tripRanks.length - 1], [
          ...tripRanks.map((rank) => [rank, 3] as const),
          ...wingRanks.map((rank) => [rank, 2] as const),
        ]);
      }
    }
  }
  const four = occupied.find((rank) => counts[rank] === 4);
  if (four !== undefined) {
    const wings = occupied.filter((rank) => rank !== four);
    if (total === 6 && wings.length === 2 && wings.every((rank) => counts[rank] === 1)) {
      return take(Category.FourPlusTwoSingles, four, [[four, 4], ...wings.map((rank) => [rank, 1] as const)]);
    }
    if (total === 8 && wings.length === 2 && wings.every((rank) => counts[rank] === 2)) {
      return take(Category.FourPlusTwoPairs, four, [[four, 4], ...wings.map((rank) => [rank, 2] as const)]);
    }
  }
  const trip = occupied.find((rank) => counts[rank] === 3);
  if (trip !== undefined) {
    const other = occupied.find((rank) => rank !== trip);
    if (total === 4 && other !== undefined && counts[other] === 1) {
      return take(Category.TripsSingle, trip, [[trip, 3], [other, 1]]);
    }
    if (total === 5 && other !== undefined && counts[other] === 2) {
      return take(Category.TripsPair, trip, [[trip, 3], [other, 2]]);
    }
  }
  return null;
}

function longestRun(counts: readonly number[], each: number, minimum: number): CountPlay | null {
  let bestStart = -1;
  let bestLength = 0;
  let start = -1;
  let length = 0;
  for (let rank = Rank.R3; rank <= Rank.A + 1; rank += 1) {
    if (rank <= Rank.A && usable(counts, rank) >= each) {
      if (start < 0) start = rank;
      length += 1;
    } else {
      if (length >= minimum && length > bestLength) {
        bestStart = start;
        bestLength = length;
      }
      start = -1;
      length = 0;
    }
  }
  if (bestStart < 0) return null;
  const takes: Array<readonly [number, number]> = [];
  for (let rank = bestStart; rank < bestStart + bestLength; rank += 1) takes.push([rank, each]);
  const category = each === 1 ? Category.Straight : each === 2 ? Category.ConsecutivePairs : Category.Airplane;
  return take(category, bestStart + bestLength - 1, takes);
}

function lowestGroup(counts: readonly number[], size: number, category: Category): CountPlay | null {
  for (let rank = Rank.R3; rank <= Rank.BigJoker; rank += 1) {
    if (usable(counts, rank) >= size) return take(category, rank, [[rank, size]]);
  }
  return null;
}

function lowestBomb(counts: readonly number[]): CountPlay | null {
  for (let rank = Rank.R3; rank <= Rank.R2; rank += 1) {
    if ((counts[rank] ?? 0) === 4) return take(Category.Bomb, rank, [[rank, 4]]);
  }
  if ((counts[Rank.SmallJoker] ?? 0) > 0 && (counts[Rank.BigJoker] ?? 0) > 0) {
    return take(Category.Rocket, Rank.BigJoker, [[Rank.SmallJoker, 1], [Rank.BigJoker, 1]]);
  }
  return null;
}

function lead(counts: readonly number[]): CountPlay {
  const whole = wholePlay(counts);
  if (whole) return whole;
  return longestRun(counts, 1, 5)
    ?? longestRun(counts, 3, 2)
    ?? longestRun(counts, 2, 3)
    ?? lowestGroup(counts, 3, Category.Trips)
    ?? lowestGroup(counts, 2, Category.Pair)
    ?? lowestGroup(counts, 1, Category.Single)
    ?? lowestBomb(counts)
    ?? (() => { throw new Error('ROLLOUT_EMPTY_LEAD'); })();
}

function sequenceBeat(counts: readonly number[], top: CountPlay, each: number, category: Category): CountPlay | null {
  const ranks = top.length / each;
  for (let start = Rank.R3; start + ranks - 1 <= Rank.A; start += 1) {
    const high = start + ranks - 1;
    if (high <= top.mainRank) continue;
    let valid = true;
    for (let rank = start; rank <= high; rank += 1) if (usable(counts, rank) < each) valid = false;
    if (!valid) continue;
    const takes: Array<readonly [number, number]> = [];
    for (let rank = start; rank <= high; rank += 1) takes.push([rank, each]);
    return take(category, high, takes);
  }
  return null;
}

function groupBeat(counts: readonly number[], top: CountPlay, size: number, category: Category): CountPlay | null {
  for (let rank = top.mainRank + 1; rank <= Rank.BigJoker; rank += 1) {
    if (usable(counts, rank) >= size) return take(category, rank, [[rank, size]]);
  }
  return null;
}

function tripWithWingBeat(counts: readonly number[], top: CountPlay, wingSize: 1 | 2): CountPlay | null {
  for (let rank = top.mainRank + 1; rank <= Rank.R2; rank += 1) {
    if (usable(counts, rank) < 3) continue;
    for (let wing = Rank.R3; wing <= Rank.BigJoker; wing += 1) {
      if (wing !== rank && usable(counts, wing) >= wingSize) {
        return take(wingSize === 1 ? Category.TripsSingle : Category.TripsPair, rank, [[rank, 3], [wing, wingSize]]);
      }
    }
  }
  return null;
}

function lowestDistinctWings(
  counts: readonly number[],
  wingSize: 1 | 2,
  wingCount: number,
  excluded: ReadonlySet<number>,
): Array<readonly [number, number]> | null {
  const wings: Array<readonly [number, number]> = [];
  for (let rank = Rank.R3; rank <= Rank.BigJoker && wings.length < wingCount; rank += 1) {
    if (!excluded.has(rank) && usable(counts, rank) >= wingSize) wings.push([rank, wingSize]);
  }
  return wings.length === wingCount ? wings : null;
}

function airplaneWithWingsBeat(counts: readonly number[], top: CountPlay, wingSize: 1 | 2): CountPlay | null {
  const tripCount = top.length / (3 + wingSize);
  for (let start = Rank.R3; start + tripCount - 1 <= Rank.A; start += 1) {
    const high = start + tripCount - 1;
    if (high <= top.mainRank) continue;
    const tripRanks: number[] = [];
    for (let rank = start; rank <= high; rank += 1) {
      if (usable(counts, rank) < 3) {
        tripRanks.length = 0;
        break;
      }
      tripRanks.push(rank);
    }
    if (tripRanks.length !== tripCount) continue;
    const wings = lowestDistinctWings(counts, wingSize, tripCount, new Set(tripRanks));
    if (!wings) continue;
    const trips: Array<readonly [number, number]> = tripRanks.map((rank) => [rank, 3]);
    return take(
      wingSize === 1 ? Category.AirplaneSingles : Category.AirplanePairs,
      high,
      [...trips, ...wings],
    );
  }
  return null;
}

function fourWithWingsBeat(counts: readonly number[], top: CountPlay, wingSize: 1 | 2): CountPlay | null {
  for (let rank = top.mainRank + 1; rank <= Rank.R2; rank += 1) {
    if ((counts[rank] ?? 0) !== 4) continue;
    const wings = lowestDistinctWings(counts, wingSize, 2, new Set([rank]));
    if (!wings) continue;
    return take(
      wingSize === 1 ? Category.FourPlusTwoSingles : Category.FourPlusTwoPairs,
      rank,
      [[rank, 4], ...wings],
    );
  }
  return null;
}

function follow(counts: readonly number[], top: CountPlay): CountPlay | null {
  let same: CountPlay | null = null;
  switch (top.category) {
    case Category.Single: same = groupBeat(counts, top, 1, Category.Single); break;
    case Category.Pair: same = groupBeat(counts, top, 2, Category.Pair); break;
    case Category.Trips: same = groupBeat(counts, top, 3, Category.Trips); break;
    case Category.TripsSingle: same = tripWithWingBeat(counts, top, 1); break;
    case Category.TripsPair: same = tripWithWingBeat(counts, top, 2); break;
    case Category.Straight: same = sequenceBeat(counts, top, 1, Category.Straight); break;
    case Category.ConsecutivePairs: same = sequenceBeat(counts, top, 2, Category.ConsecutivePairs); break;
    case Category.Airplane: same = sequenceBeat(counts, top, 3, Category.Airplane); break;
    case Category.AirplaneSingles: same = airplaneWithWingsBeat(counts, top, 1); break;
    case Category.AirplanePairs: same = airplaneWithWingsBeat(counts, top, 2); break;
    case Category.FourPlusTwoSingles: same = fourWithWingsBeat(counts, top, 1); break;
    case Category.FourPlusTwoPairs: same = fourWithWingsBeat(counts, top, 2); break;
    case Category.Bomb:
      for (let rank = top.mainRank + 1; rank <= Rank.R2; rank += 1) {
        if ((counts[rank] ?? 0) === 4) return take(Category.Bomb, rank, [[rank, 4]]);
      }
      if ((counts[Rank.SmallJoker] ?? 0) > 0 && (counts[Rank.BigJoker] ?? 0) > 0) {
        return take(Category.Rocket, Rank.BigJoker, [[Rank.SmallJoker, 1], [Rank.BigJoker, 1]]);
      }
      return null;
    case Category.Rocket:
      return null;
    default:
      same = null;
  }
  return same;
}

function apply(counts: number[], play: CountPlay): void {
  for (const [rank, amount] of play.takes) {
    counts[rank] -= amount;
    if (counts[rank] < 0) throw new Error('ROLLOUT_OVERDRAW');
  }
}

function lite(pattern: HandPattern): CountPlay {
  return { category: pattern.category, mainRank: pattern.mainRank, length: pattern.length, takes: [] };
}

export function rolloutRound(args: RolloutArgs): RolloutOutcome {
  const board = args.counts.map((row) => row.slice()) as [number[], number[], number[]];
  let turn = args.turn;
  let top = args.top ? lite(args.top) : null;
  let topSeat = args.topSeat;
  let passes = 0;
  let plays = 0;
  void args.rng;

  for (let guard = 0; guard < 256; guard += 1) {
    const teammateTop = top !== null && topSeat !== null
      && turn !== args.landlord && topSeat !== args.landlord && topSeat !== turn;
    let chosen = top === null ? lead(board[turn]) : teammateTop ? null : follow(board[turn], top);
    if (chosen === null && top !== null && !teammateTop && top.category !== Category.Bomb && top.category !== Category.Rocket) {
      const threatened = topSeat !== null && cardCount(board[topSeat]) <= 2;
      if (threatened) chosen = lowestBomb(board[turn]);
    }

    if (chosen) {
      apply(board[turn], chosen);
      plays += 1;
      if (cardCount(board[turn]) === 0) {
        return { winnerSide: turn === args.landlord ? 'landlord' : 'farmer', plays };
      }
      top = chosen;
      topSeat = turn;
      passes = 0;
    } else {
      passes += 1;
      if (passes >= 2) {
        top = null;
        topSeat = null;
        passes = 0;
      }
    }
    turn = ((turn + 1) % 3) as 0 | 1 | 2;
  }
  throw new Error('ROLLOUT_DID_NOT_TERMINATE');
}
