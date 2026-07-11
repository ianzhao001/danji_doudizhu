/**
 * M4-03 困难 AI（积极控权 + 择时炸弹·确定性）。实现方：实现 hardStrategy 函数体，
 * 使 test/ai/hard.test.ts 转绿。规则见 coordination/tasks/M4-03-ai-hard.md。
 * 仅依赖 rules + 只读快照，禁止 import `cc`，禁止改签名。
 */

import {
  Category,
  Rank,
  enumerateMoves,
  isBombLike,
  legalFollows,
  type Card,
  type Move,
} from '../../rules';
import type { GameEvent } from '../../game';
import { cardKey } from '../../rules/guards';
import { trackPlayed } from '../cardMemory';
import { canFinishInOneMove, finishingFollow } from '../endgame';
import { ALL_RANKS, evaluateHand } from '../handStrength';
import type { AiStrategy } from '../strategy';
import {
  bombLikeMoves,
  compareMoves,
  conservativeAction,
  isTeammateTop,
  pickLargest,
  pickSmallest,
  pickSmallestBombLike,
  protectedCards,
  requireHand,
  toPlay,
  usesProtectedCards,
} from './_shared';

/** T-AI-DEPTH2：对手阵营席位——地主视两农民为对手，农民只视地主为对手（队友剩牌少绝不触发施压烧牌）。 */
function opponentSeats(snapshot: Parameters<AiStrategy>[0]): number[] {
  const me = snapshot.turn;
  if (me === snapshot.landlord) return [0, 1, 2].filter((seat) => seat !== me);
  return [snapshot.landlord];
}

function teammateSeat(snapshot: Parameters<AiStrategy>[0]): number | null {
  const me = snapshot.turn;
  if (me === snapshot.landlord) return null;
  return [0, 1, 2].find((seat) => seat !== me && seat !== snapshot.landlord) ?? null;
}

function isPressing(snapshot: Parameters<AiStrategy>[0]): boolean {
  return opponentSeats(snapshot).some((seat) => snapshot.handCounts[seat] <= 2);
}

function rankCounts(cards: Card[]): ReadonlyMap<Rank, number> {
  const counts = new Map<Rank, number>();
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
  }
  return counts;
}

function removeMoveCards(hand: Card[], move: Move): Card[] {
  const remainingMoveCards = new Map<string, number>();
  for (const card of move.cards) {
    const key = cardKey(card);
    remainingMoveCards.set(key, (remainingMoveCards.get(key) ?? 0) + 1);
  }

  const remaining: Card[] = [];
  for (const card of hand) {
    const key = cardKey(card);
    const used = remainingMoveCards.get(key) ?? 0;
    if (used > 0) {
      remainingMoveCards.set(key, used - 1);
    } else {
      remaining.push(card);
    }
  }

  return remaining;
}

function roughTurnCount(cards: Card[]): number {
  if (cards.length === 0) return 0;
  if (canFinishInOneMove(cards)) return 1;

  const counts = rankCounts(cards);
  const groups = Array.from(counts.values()).filter((count) => count > 0).length;
  const { bombs, longestStraight, rockets } = evaluateHand(cards);
  const straightReduction = Math.max(0, longestStraight - 4);
  const controlGroups = bombs + rockets;

  return Math.max(1, groups - straightReduction - controlGroups);
}

type MemoryPressure = Readonly<{
  highPressure: boolean;
  unseenHighCards: number;
  possibleBombRanks: number;
}>;

function estimateMemoryPressure(hand: Card[], history: GameEvent[] = []): MemoryPressure {
  const memory = trackPlayed(history, hand);
  const highRanks = [Rank.R2, Rank.SmallJoker, Rank.BigJoker] as const;
  const unseenHighCards = highRanks.reduce((sum, rank) => sum + (memory.remainingByRank[rank] ?? 0), 0);
  const possibleBombRanks = Object.entries(memory.remainingByRank).filter(
    ([rank, count]) => Number(rank) <= Rank.R2 && count === 4,
  ).length;

  return {
    highPressure: unseenHighCards >= 3 || possibleBombRanks >= 3,
    unseenHighCards,
    possibleBombRanks,
  };
}

function categoryShapingBonus(move: Move): number {
  switch (move.pattern.category) {
    case Category.Straight:
      return 90;
    case Category.Airplane:
    case Category.AirplaneSingles:
    case Category.AirplanePairs:
      return 100;
    case Category.ConsecutivePairs:
      return 94;
    case Category.TripsPair:
      return 70;
    case Category.TripsSingle:
      return 65;
    case Category.Trips:
      return 50;
    case Category.Pair:
      return 32;
    default:
      return 0;
  }
}

function highCardSpendPenalty(move: Move, pressure: MemoryPressure): number {
  const pressureMultiplier = pressure.highPressure ? 7 : 3;
  return move.cards.reduce((sum, card) => {
    if (card.rank >= Rank.R2) return sum + pressureMultiplier * 2;
    if (card.rank >= Rank.A) return sum + pressureMultiplier;
    return sum;
  }, 0);
}

function scoreLeadMove(hand: Card[], move: Move, pressure: MemoryPressure): number {
  const remaining = removeMoveCards(hand, move);
  const remainingStrength = evaluateHand(remaining);
  return (
    roughTurnCount(remaining) * 120 +
    remainingStrength.score * 0.35 -
    move.cards.length * 10 -
    categoryShapingBonus(move) +
    highCardSpendPenalty(move, pressure)
  );
}

function chooseByLowestScore(moves: readonly Move[], score: (move: Move) => number): Move {
  return moves.slice().sort((left, right) => {
    const byScore = score(left) - score(right);
    return byScore !== 0 ? byScore : compareMoves(left, right);
  })[0]!;
}

function chooseFinishingMove(
  hand: Card[],
  moves: readonly Move[],
  snapshot: Parameters<AiStrategy>[0],
): Move | null {
  if (snapshot.top === null) {
    if (!canFinishInOneMove(hand)) return null;
    return moves.find((move) => move.cards.length === hand.length) ?? null;
  }

  return finishingFollow(hand, snapshot.top.pattern);
}

function chooseLeadMove(hand: Card[], moves: Move[], history: GameEvent[]): Move {
  const protectedSet = protectedCards(hand);
  const pressure = estimateMemoryPressure(hand, history);
  const shapingCandidates = moves.filter(
    (move) => !isBombLike(move.pattern.category) && !usesProtectedCards(move, protectedSet),
  );

  if (shapingCandidates.length === 0) return pickSmallest(moves);
  return chooseByLowestScore(shapingCandidates, (move) => scoreLeadMove(hand, move, pressure));
}

/**
 * T-AI-DEPTH2：喂队友（农民协作·真人对战场景两 AI 同档时直接生效）——
 * 队友已报单/报双且地主未濒临跑完时，领出给最小单/最小对（不动保护牌、不烧 A 以上）。
 */
function chooseFeedTeammateLead(
  snapshot: Parameters<AiStrategy>[0],
  hand: Card[],
  moves: Move[],
): Move | null {
  const teammate = teammateSeat(snapshot);
  if (teammate === null) return null;
  const teammateCount = snapshot.handCounts[teammate];
  if (teammateCount > 2 || snapshot.handCounts[snapshot.landlord] <= 2) return null;
  const protectedSet = protectedCards(hand);
  const wanted = teammateCount === 1 ? Category.Single : Category.Pair;
  const feeds = moves.filter(
    (move) =>
      move.pattern.category === wanted &&
      move.pattern.mainRank < Rank.A &&
      !usesProtectedCards(move, protectedSet),
  );
  if (feeds.length === 0) return null;
  return pickSmallest(feeds);
}

/**
 * T-AI-DEPTH2：地主上家顶张——农民身处地主上家、跟地主的小牌时，
 * 用安全集里最大的牌顶上去，逼地主烧大牌或让出出牌权。
 */
function chooseUpstreamPressFollow(
  snapshot: Parameters<AiStrategy>[0],
  hand: Card[],
  moves: Move[],
): Move | null {
  const me = snapshot.turn;
  if (me === snapshot.landlord) return null;
  if (!snapshot.top || snapshot.top.seat !== snapshot.landlord) return null;
  if ((me + 1) % 3 !== snapshot.landlord) return null;
  if (snapshot.top.pattern.mainRank > Rank.R9) return null;
  const protectedSet = protectedCards(hand);
  const safe = moves.filter(
    (move) => !isBombLike(move.pattern.category) && !usesProtectedCards(move, protectedSet),
  );
  if (safe.length === 0) return null;
  return pickLargest(safe);
}

function isSafeNonBombMove(move: Move, hand: Card[]): boolean {
  const protectedSet = protectedCards(hand);
  return !isBombLike(move.pattern.category) && !usesProtectedCards(move, protectedSet);
}

function choosePressingLeadMove(hand: Card[], moves: Move[]): Move {
  const safeMoves = moves.filter((move) => isSafeNonBombMove(move, hand));
  const candidates = safeMoves.length > 0 ? safeMoves : moves;
  const blockers = candidates.filter((move) => move.cards.length >= 2);
  if (blockers.length > 0) {
    return chooseByLowestScore(blockers, (move) => {
      const remaining = removeMoveCards(hand, move);
      return roughTurnCount(remaining) * 100 - move.cards.length * 18 - categoryShapingBonus(move);
    });
  }

  return pickLargest(candidates);
}

function chooseControlFollow(hand: Card[], moves: Move[]): Move | null {
  if (hand.length > 4) return null;
  const controlCandidates = moves.filter((move) => {
    if (isBombLike(move.pattern.category)) return false;
    const remaining = removeMoveCards(hand, move);
    return remaining.length > 0 && canFinishInOneMove(remaining);
  });
  if (controlCandidates.length === 0) return null;
  return pickLargest(controlCandidates);
}

function isAbsoluteTopSingle(move: Move, remainingByRank: Readonly<Record<number, number>>): boolean {
  if (move.pattern.category !== Category.Single) return false;
  const rank = move.pattern.mainRank;
  return ALL_RANKS.every((candidate) => candidate <= rank || (remainingByRank[candidate] ?? 0) === 0);
}

function chooseAbsoluteTopSingleFollow(
  snapshot: Parameters<AiStrategy>[0],
  hand: Card[],
  moves: Move[],
  history: GameEvent[],
): Move | null {
  if (history.length === 0 || snapshot.top?.pattern.category !== Category.Single) return null;
  const memory = trackPlayed(history, hand);
  const candidates = moves.filter((move) => isAbsoluteTopSingle(move, memory.remainingByRank));
  if (candidates.length === 0) return null;
  return pickSmallest(candidates);
}

/**
 * T-AI-DEPTH2：终局必胜看破——用记牌外部剩量递归证明「保证可赢序列」：
 * 每一手要么直接清手，要么外部（含队友，保守）不可能压过且剩余仍可保证。
 * 触发限 hand ≤ GUARANTEE_MAX_HAND，带 memo；纯公开信息（G14 不作弊）。
 */
const GUARANTEE_MAX_HAND = 12;

function externalBombThreat(remainingByRank: Readonly<Record<number, number>>): boolean {
  if (ALL_RANKS.some((rank) => rank <= Rank.R2 && (remainingByRank[rank] ?? 0) === 4)) return true;
  return (remainingByRank[Rank.SmallJoker] ?? 0) > 0 && (remainingByRank[Rank.BigJoker] ?? 0) > 0;
}

function isUnbeatableMove(move: Move, remainingByRank: Readonly<Record<number, number>>): boolean {
  const category = move.pattern.category;
  const rank = move.pattern.mainRank;
  if (category === Category.Rocket) return true;
  if (category === Category.Bomb) {
    if ((remainingByRank[Rank.SmallJoker] ?? 0) > 0 && (remainingByRank[Rank.BigJoker] ?? 0) > 0) return false;
    return !ALL_RANKS.some((candidate) => candidate > rank && candidate <= Rank.R2 && (remainingByRank[candidate] ?? 0) === 4);
  }
  if (externalBombThreat(remainingByRank)) return false;
  const size = category === Category.Single ? 1 : category === Category.Pair ? 2 : category === Category.Trips ? 3 : 0;
  if (size === 0) return false; // 顺子/飞机等只作末手，不作保证中继
  return !ALL_RANKS.some((candidate) => candidate > rank && (remainingByRank[candidate] ?? 0) >= size);
}

function guaranteeKey(cards: Card[]): string {
  return cards.map(cardKey).sort().join('|');
}

function canGuaranteeFinishLead(
  hand: Card[],
  remainingByRank: Readonly<Record<number, number>>,
  memo: Map<string, boolean>,
): boolean {
  if (hand.length === 0) return true;
  if (canFinishInOneMove(hand)) return true;
  const key = guaranteeKey(hand);
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  memo.set(key, false); // 防环（同 key 递归中先记败）
  const result = enumerateMoves(hand).some((move) => {
    if (move.cards.length === hand.length) return true;
    if (!isUnbeatableMove(move, remainingByRank)) return false;
    return canGuaranteeFinishLead(removeMoveCards(hand, move), remainingByRank, memo);
  });
  memo.set(key, result);
  return result;
}

/** lead 态：存在保证序列时返回其第一手（优先直接清手，再取最小的不可压中继）。 */
function chooseGuaranteedLead(
  hand: Card[],
  moves: Move[],
  remainingByRank: Readonly<Record<number, number>>,
): Move | null {
  if (hand.length > GUARANTEE_MAX_HAND) return null;
  const memo = new Map<string, boolean>();
  const oneShot = moves.find((move) => move.cards.length === hand.length);
  if (oneShot) return oneShot;
  const candidates = moves
    .filter(
      (move) =>
        isUnbeatableMove(move, remainingByRank) &&
        canGuaranteeFinishLead(removeMoveCards(hand, move), remainingByRank, memo),
    )
    .sort(compareMoves);
  return candidates[0] ?? null;
}

/** follow 态：候选先压住当前 top 且不可再被压，其后剩余可保证 → 立即夺权收官。 */
function chooseGuaranteedTakeover(
  hand: Card[],
  moves: Move[],
  remainingByRank: Readonly<Record<number, number>>,
): Move | null {
  if (hand.length > GUARANTEE_MAX_HAND) return null;
  const memo = new Map<string, boolean>();
  const candidates = moves
    .filter((move) => {
      if (move.cards.length === hand.length) return true;
      if (!isUnbeatableMove(move, remainingByRank)) return false;
      return canGuaranteeFinishLead(removeMoveCards(hand, move), remainingByRank, memo);
    })
    .sort(compareMoves);
  return candidates[0] ?? null;
}

/**
 * T-AI-DEPTH2：结构保护跟牌——跟单/对/三时优先出「恰好整组用尽」的候选
 * （孤张/纯对/纯三），避免无谓拆散对子、三张与炸弹坯；组内取最小。
 * 高位孤张（A 及以上）不因“成组”而优先烧掉——此时回落保守最小跟。
 */
function chooseCleanFollow(hand: Card[], moves: Move[]): Move | null {
  const counts = rankCounts(hand);
  const clean = moves.filter((move) => {
    const category = move.pattern.category;
    if (category !== Category.Single && category !== Category.Pair && category !== Category.Trips) return false;
    return (counts.get(move.pattern.mainRank) ?? 0) === move.cards.length;
  });
  if (clean.length === 0) return null;
  const best = pickSmallest(clean);
  if (best.pattern.mainRank >= Rank.A) return null;
  return best;
}

/** 积极控权策略桩：实现见 M4-03。 */
export const hardStrategy: AiStrategy = (snapshot, _rng, history = []) => {
  const hand = requireHand(snapshot);
  const moves = snapshot.top ? legalFollows(hand, snapshot.top.pattern) : enumerateMoves(hand);

  if (snapshot.top && moves.length === 0) return { type: 'pass', seat: snapshot.turn };

  const finishingMove = chooseFinishingMove(hand, moves, snapshot);
  if (finishingMove !== null) return toPlay(snapshot, finishingMove);

  // T-AI-DEPTH2：终局必胜看破（纯公开信息）——lead 走保证序列；follow 用不可压候选夺权收官。
  const memoryRemaining = history.length > 0 ? trackPlayed(history, hand).remainingByRank : null;
  if (memoryRemaining) {
    const guaranteed = snapshot.top === null
      ? chooseGuaranteedLead(hand, moves, memoryRemaining)
      : chooseGuaranteedTakeover(hand, moves, memoryRemaining);
    if (guaranteed !== null) return toPlay(snapshot, guaranteed);
  }

  if (isTeammateTop(snapshot)) return { type: 'pass', seat: snapshot.turn };

  if (isPressing(snapshot)) {
    const bombs = bombLikeMoves(moves);
    if (bombs.length > 0) return toPlay(snapshot, pickSmallestBombLike(bombs));
    if (snapshot.top) return toPlay(snapshot, pickLargest(moves));
    return toPlay(snapshot, choosePressingLeadMove(hand, moves));
  }

  if (!snapshot.top) {
    const feed = chooseFeedTeammateLead(snapshot, hand, moves);
    if (feed !== null) return toPlay(snapshot, feed);
    return toPlay(snapshot, chooseLeadMove(hand, moves, history));
  }

  const controlFollow = chooseControlFollow(hand, moves);
  if (controlFollow !== null) return toPlay(snapshot, controlFollow);

  const absoluteTopSingle = chooseAbsoluteTopSingleFollow(snapshot, hand, moves, history);
  if (absoluteTopSingle !== null) return toPlay(snapshot, absoluteTopSingle);

  const upstreamPress = chooseUpstreamPressFollow(snapshot, hand, moves);
  if (upstreamPress !== null) return toPlay(snapshot, upstreamPress);

  const cleanFollow = chooseCleanFollow(hand, moves);
  if (cleanFollow !== null) return toPlay(snapshot, cleanFollow);

  return conservativeAction(snapshot, hand, moves);
};
