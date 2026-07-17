import { Category, Rank, type Card, type HandPattern, type Move } from '../rules';
import { Decomposer } from './decompose';
import { beatProbability1024 } from './pressure';

/** 一手牌机会成本；权重核统一以「组件价值减手数成本」表达。 */
export const TEMPO_PENALTY = 24;
export const W_STRUCT = 1000;
export const REMAIN_CAP = 500;

export interface HandWeight {
  power: number;
  moveCount: number;
  score: number;
}

export function componentPower(pattern: HandPattern): number {
  const rank = pattern.mainRank;
  switch (pattern.category) {
    case Category.Rocket:
      return 320;
    case Category.Bomb:
      return 140 + rank * 4;
    case Category.Single:
      return (rank - Rank.R9) * 3;
    case Category.Pair:
      return (rank - Rank.R3) * 5 + 8;
    case Category.Trips:
      return (rank - Rank.R3) * 6 + 26;
    case Category.TripsSingle:
      return (rank - Rank.R3) * 6 + 34;
    case Category.TripsPair:
      return (rank - Rank.R3) * 6 + 42;
    case Category.Straight:
      return pattern.length * 12 + rank;
    case Category.ConsecutivePairs:
      return pattern.length * 13 + rank;
    case Category.Airplane:
    case Category.AirplaneSingles:
    case Category.AirplanePairs:
      return pattern.length * 14 + rank;
    case Category.FourPlusTwoSingles:
    case Category.FourPlusTwoPairs:
      return pattern.length * 8 + rank;
    default: {
      const exhaustive: never = pattern.category;
      return exhaustive;
    }
  }
}

export function weighHand(decomposer: Decomposer, hand: Card[]): HandWeight {
  const result = decomposer.decompose(hand);
  const power = result.components.reduce((sum, component) => sum + componentPower(component.pattern), 0);
  return {
    power,
    moveCount: result.moveCount,
    score: power - TEMPO_PENALTY * result.moveCount,
  };
}

function removeMove(hand: Card[], move: Move): Card[] {
  const rest = hand.slice();
  for (const played of move.cards) {
    const index = rest.findIndex((card) => card.rank === played.rank && card.suit === played.suit);
    if (index < 0) throw new Error('MOVE_CARD_NOT_IN_HAND');
    rest.splice(index, 1);
  }
  return rest;
}

export interface PressureContext {
  remainingByRank?: readonly number[];
  hiddenCounts?: readonly [number, number];
  certainlyBeatenByRank?: readonly number[];
}

function attachmentCards(move: Move): Card[] {
  switch (move.pattern.category) {
    case Category.TripsSingle:
    case Category.TripsPair:
    case Category.AirplaneSingles:
    case Category.AirplanePairs:
      return move.cards.filter((card) => move.cards.filter((other) => other.rank === card.rank).length < 3);
    case Category.FourPlusTwoSingles:
    case Category.FourPlusTwoPairs:
      return move.cards.filter((card) => move.cards.filter((other) => other.rank === card.rank).length < 4);
    default:
      return [];
  }
}

function clampRemaining(score: number): number {
  return Math.max(-REMAIN_CAP, Math.min(REMAIN_CAP, score));
}

function certainlyBeaten(move: Move, remainingByRank: readonly number[]): boolean {
  const size = move.pattern.category === Category.Single ? 1
    : move.pattern.category === Category.Pair ? 2
      : move.pattern.category === Category.Trips ? 3
        : 0;
  if (size === 0) return false;
  for (let rank = move.pattern.mainRank + 1; rank <= Rank.BigJoker; rank += 1) {
    if ((remainingByRank[rank] ?? 0) >= size) return true;
  }
  return false;
}

function controlSpend(move: Move, probability: number, finishing: boolean, sprint: boolean, absoluteTop: boolean): number {
  if (finishing) return 0;
  let spend = 0;
  for (const card of attachmentCards(move)) {
    if (card.rank === Rank.SmallJoker || card.rank === Rank.BigJoker) {
      spend += Math.round((950 * (1024 - probability)) / 1024);
    } else if (card.rank === Rank.R2) {
      spend += Math.round((720 * (1024 - probability)) / 1024) + (absoluteTop ? 350 : 0);
    } else if (card.rank === Rank.A) {
      spend += Math.round((260 * (1024 - probability)) / 1024);
    }
  }
  // 冲刺衰减后保留 2 毫手定点护栏，避免半权重与余牌 /2 同时取整抹平控牌判别。
  return sprint && spend > 0 ? Math.round(spend / 2) + 2 : spend;
}

/** 越低越好：结构毫手为主，弃控/被压风险与有界余牌权重为副项。 */
export function moveOutcomeScore(
  decomposer: Decomposer,
  hand: Card[],
  move: Move,
  pressureCtx?: PressureContext,
): number {
  const structure = decomposer.structureCost(hand, move.cards);
  const rest = removeMove(hand, move);
  const remaining = weighHand(decomposer, rest);
  const hasPressure = pressureCtx?.remainingByRank !== undefined && pressureCtx.hiddenCounts !== undefined;
  const probability = hasPressure
    ? beatProbability1024(move.pattern, pressureCtx.remainingByRank!, pressureCtx.hiddenCounts!)
    : 512;
  const absoluteTop = hasPressure && probability === 0;
  const spend = controlSpend(move, probability, rest.length === 0, remaining.moveCount <= 2, absoluteTop);
  const pressRisk = Math.round(probability / 16);
  const beatenGift = pressureCtx?.certainlyBeatenByRank
    && certainlyBeaten(move, pressureCtx.certainlyBeatenByRank) ? 140 : 0;
  return structure * W_STRUCT + spend + pressRisk + beatenGift - Math.round(clampRemaining(remaining.score) / 2);
}
