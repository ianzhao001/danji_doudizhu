import { Category, Rank } from '../rules';

export interface PressureMoveShape {
  category: Category;
  mainRank: Rank;
  length: number;
}

const SCALE = 1024;

function clampFixed(value: number): number {
  return Math.max(0, Math.min(SCALE, Math.round(value)));
}

function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  const take = Math.min(k, n - k);
  let value = 1;
  for (let i = 1; i <= take; i += 1) value = (value * (n - take + i)) / i;
  return value;
}

/** 两席随机分牌后，至少一席持有 need 张该点数的精确概率。 */
function groupedBeat1024(copies: number, need: number, total: number, firstSeat: number): number {
  if (copies < need || need < 1 || total < 1) return 0;
  const denominator = choose(total, firstSeat);
  if (denominator === 0) return 0;
  let neither = 0;
  const low = Math.max(0, firstSeat - (total - copies));
  const high = Math.min(copies, firstSeat);
  for (let inFirst = low; inFirst <= high; inFirst += 1) {
    const inSecond = copies - inFirst;
    if (inFirst >= need || inSecond >= need) continue;
    neither += choose(copies, inFirst) * choose(total - copies, firstSeat - inFirst);
  }
  return clampFixed(SCALE * (1 - neither / denominator));
}

function union1024(probabilities: readonly number[]): number {
  let none = SCALE;
  for (const probability of probabilities) {
    none = Math.round((none * (SCALE - probability)) / SCALE);
  }
  return SCALE - none;
}

function sequenceBeat1024(
  move: PressureMoveShape,
  counts: readonly number[],
  hiddenCounts: readonly [number, number],
  groupSize: number,
): number {
  const chainLength = move.category === Category.ConsecutivePairs
    ? Math.max(1, Math.round(move.length / 2))
    : move.category === Category.Airplane
      ? Math.max(1, Math.round(move.length / 3))
      : move.category === Category.AirplaneSingles
        ? Math.max(1, Math.round(move.length / 4))
        : move.category === Category.AirplanePairs
          ? Math.max(1, Math.round(move.length / 5))
          : Math.max(1, move.length);
  const total = counts.reduce((sum, count) => sum + (count ?? 0), 0);
  if (total === 0) return 0;
  const gamma = [1024, 1024, 920, 840, 770, 710, 660, 620, 580, 550, 520, 500, 480];
  const candidates: number[] = [];
  const highestStart = Rank.A - chainLength + 1;
  const firstStart = move.mainRank - chainLength + 2;
  for (let start = firstStart; start <= highestStart; start += 1) {
    let first = SCALE;
    let second = SCALE;
    for (let offset = 0; offset < chainLength; offset += 1) {
      const copies = counts[start + offset] ?? 0;
      if (copies < groupSize) {
        first = 0;
        second = 0;
        break;
      }
      const a = groupedBeat1024(copies, groupSize, total, hiddenCounts[0]);
      const b = groupedBeat1024(copies, groupSize, total, hiddenCounts[1]);
      first = Math.round((first * a) / SCALE);
      second = Math.round((second * b) / SCALE);
    }
    const concentrated = union1024([first, second]);
    candidates.push(Math.round((concentrated * (gamma[Math.min(chainLength, gamma.length - 1)] ?? 480)) / SCALE));
  }
  return union1024(candidates);
}

function bombThreat(move: PressureMoveShape, counts: readonly number[]): boolean {
  if (move.category === Category.Rocket) return false;
  const rocket = (counts[Rank.SmallJoker] ?? 0) > 0 && (counts[Rank.BigJoker] ?? 0) > 0;
  if (rocket) return true;
  for (let rank = Rank.R3; rank <= Rank.R2; rank += 1) {
    if ((counts[rank] ?? 0) !== 4) continue;
    if (move.category !== Category.Bomb || rank > move.mainRank) return true;
  }
  return false;
}

/**
 * 公开剩牌下，被任一隐藏席同型压过的 1/1024 定点估计。
 * 单/对/三/炸使用两席超几何闭式；链型用候选链 union 与固定集中度衰减。
 */
export function beatProbability1024(
  move: PressureMoveShape,
  remainingByRank: readonly number[],
  hiddenCounts: readonly [number, number],
): number {
  if (move.category === Category.Rocket) return 0;
  const total = remainingByRank.reduce((sum, count) => sum + (count ?? 0), 0);
  let probability = 0;
  const groupedSize = move.category === Category.Single ? 1
    : move.category === Category.Pair ? 2
      : move.category === Category.Trips || move.category === Category.TripsSingle || move.category === Category.TripsPair ? 3
        : move.category === Category.Bomb ? 4
          : 0;
  if (groupedSize > 0) {
    const ranks: number[] = [];
    const limit = move.category === Category.Bomb ? Rank.R2 : Rank.BigJoker;
    for (let rank = move.mainRank + 1; rank <= limit; rank += 1) {
      ranks.push(groupedBeat1024(remainingByRank[rank] ?? 0, groupedSize, total, hiddenCounts[0]));
    }
    probability = union1024(ranks);
  } else if (move.category === Category.Straight) {
    probability = sequenceBeat1024(move, remainingByRank, hiddenCounts, 1);
  } else if (move.category === Category.ConsecutivePairs) {
    probability = sequenceBeat1024(move, remainingByRank, hiddenCounts, 2);
  } else if (
    move.category === Category.Airplane
    || move.category === Category.AirplaneSingles
    || move.category === Category.AirplanePairs
  ) {
    probability = sequenceBeat1024(move, remainingByRank, hiddenCounts, 3);
  }
  if (bombThreat(move, remainingByRank)) probability = Math.max(512, probability);
  return clampFixed(probability);
}
