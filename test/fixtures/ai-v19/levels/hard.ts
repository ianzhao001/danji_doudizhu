/**
 * M4-03 困难 AI（积极控权 + 择时炸弹·确定性）。实现方：实现 hardStrategy 函数体，
 * 使 test/ai/hard.test.ts 转绿。规则见 coordination/tasks/M4-03-ai-hard.md。
 * 仅依赖 rules + 只读快照，禁止 import `cc`，禁止改签名。
 *
 * W-AUDIT-AI B2 内核升级：
 * - 精确拆解驱动（ai/decompose）——领出按「最优分解组件」白出，跟牌按结构代价定压/过；
 * - 公开底牌归因（snapshot.bottom,v2）——农民侧推「确定仍在地主手」的点数下界；
 * - 必胜看破上限 12→17；无安全跟法时不再无脑烧炸（对手告急才烧，否则过牌保结构）。
 * 决策仍为纯公开信息 + 确定性（_rng 不消费,G14 不作弊）。
 */

import {
  Category,
  Rank,
  enumerateMoves,
  isBombLike,
  legalFollows,
  type Card,
  type Move,
} from '../../../../assets/scripts/rules';
import type { GameEvent } from '../../../../assets/scripts/game';
import { cardKey } from '../../../../assets/scripts/rules/guards';
import { certainLandlordByRank, trackPlayed } from '../cardMemory';
import { Decomposer } from '../decompose';
import { canFinishInOneMove, finishingFollow } from '../endgame';
import { solveForcedWin } from '../endgameSolver';
import { moveOutcomeScore, type PressureContext } from '../handWeight';
import { ALL_RANKS } from '../handStrength';
import { HARD_PIMC, pimcArbitrate, type PimcProfile } from '../pimc';
import type { AiStrategy } from '../strategy';
import {
  bombLikeMoves,
  compareMoves,
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

/** 单局决策帧上下文：共享拆解器与记牌，候选间大量复用子状态。 */
type HardContext = Readonly<{
  decomposer: Decomposer;
  remainingByRank: Readonly<Record<number, number>> | null;
  certainLandlordByRank: Readonly<Record<number, number>> | null;
}>;

function buildHardContext(snapshot: Parameters<AiStrategy>[0], hand: Card[], history: GameEvent[]): HardContext {
  return {
    decomposer: new Decomposer({ nodeBudget: 200_000 }),
    remainingByRank: history.length > 0 ? trackPlayed(history, hand).remainingByRank : null,
    certainLandlordByRank: certainLandlordByRank(snapshot, history),
  };
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

function highCardSpendPenalty(move: Move, pressure: MemoryPressure): number {
  const pressureMultiplier = pressure.highPressure ? 7 : 3;
  return move.cards.reduce((sum, card) => {
    if (card.rank >= Rank.R2) return sum + pressureMultiplier * 2;
    if (card.rank >= Rank.A) return sum + pressureMultiplier;
    return sum;
  }, 0);
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

/**
 * W-AUDIT-AI B2 领出：精确拆解驱动。
 * 结构代价(拆整为零的手数惩罚)为主项——最优分解里的整组件代价为 0(白出);
 * 同代价里偏好多脱牌、先小后大、保留成型组合;控牌(A/2/王)按记牌压力计罚;
 * 农民侧对「地主确定压死的 ≥K 单/对」加罚(白送控牌)。
 */
const HARD_LEAD_SHED_WEIGHT = 20;
const PIMC_LEAD_BAND = 200;
const PIMC_FOLLOW_BAND = 250;

function canSampleWorld(
  snapshot: Parameters<AiStrategy>[0],
  hand: Card[],
  history: GameEvent[],
): boolean {
  let played = 0;
  for (const event of history) if (event.type === 'play') played += event.pattern.cards.length;
  const hidden = snapshot.handCounts.reduce(
    (sum, count, seat) => seat === snapshot.turn ? sum : sum + count,
    0,
  );
  return 54 - hand.length - played === hidden;
}

function chooseLeadMove(
  ctx: HardContext,
  snapshot: Parameters<AiStrategy>[0],
  hand: Card[],
  moves: Move[],
  history: GameEvent[],
  profile: PimcProfile,
): Move {
  const protectedSet = protectedCards(hand);
  const shapingCandidates = moves.filter(
    (move) => !isBombLike(move.pattern.category) && !usesProtectedCards(move, protectedSet),
  );

  if (shapingCandidates.length === 0) return pickSmallest(moves);
  const memoryPressure = estimateMemoryPressure(hand, history);
  const pressureCtx = toPressureContext(ctx, snapshot);
  const scored = shapingCandidates.map((move) => ({
    move,
    score: moveOutcomeScore(ctx.decomposer, hand, move, pressureCtx)
      + Math.round(highCardSpendPenalty(move, memoryPressure) / 3)
      - move.cards.length * HARD_LEAD_SHED_WEIGHT,
  })).sort((left, right) => {
    const delta = left.score - right.score;
    return delta !== 0 ? delta : compareMoves(left.move, right.move);
  });
  const best = scored[0]!;
  const band = scored
    .filter((entry) => entry.score <= best.score + PIMC_LEAD_BAND)
    .slice(0, profile.maxCandidates)
    .map((entry) => entry.move);
  if (profile.samples > 0 && band.length >= 2 && canSampleWorld(snapshot, hand, history)) {
    return pimcArbitrate({ snapshot, history, candidates: band, includePass: false, profile }) ?? best.move;
  }
  return best.move;
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

function choosePressingLeadMove(ctx: HardContext, hand: Card[], moves: Move[]): Move {
  const safeMoves = moves.filter((move) => isSafeNonBombMove(move, hand));
  const candidates = safeMoves.length > 0 ? safeMoves : moves;
  const blockers = candidates.filter((move) => move.cards.length >= 2);
  if (blockers.length > 0) {
    return chooseByLowestScore(blockers, (move) => (
      moveOutcomeScore(ctx.decomposer, hand, move) - move.cards.length * 18
    ));
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
  return controlCandidates.length > 0 ? pickLargest(controlCandidates) : null;
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
  return candidates.length > 0 ? pickSmallest(candidates) : null;
}

/**
 * T-AI-DEPTH2：终局必胜看破——用记牌外部剩量递归证明「保证可赢序列」：
 * 每一手要么直接清手，要么外部（含队友，保守）不可能压过且剩余仍可保证。
 * 触发限 hand ≤ GUARANTEE_MAX_HAND，带 memo；纯公开信息（G14 不作弊）。
 */
// W-AUDIT-AI B2:12→17——全程可看破。分支只走「不可压中继」,状态数天然收敛,memo 兜底。
const GUARANTEE_MAX_HAND = 17;

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
 * W-AUDIT-AI B2:结构化跟牌(替代旧 chooseCleanFollow + conservativeAction 尾部)。
 * 结构代价定压/过:
 *   代价 ≤0(整组件白跟,含最优分解里的顺子/对/三带整手)→ 必跟最小;
 *   代价 =1(拆一手)→ 小牌位(<A)随手跟;高牌位只在冲刺期(自己 ≤3 手)才烧;
 *   代价 ≥2(碎结构)→ 只有对手阵营临近跑完(≤4 张)才硬拆压制,否则过牌保结构;
 *   无安全跟法 → 对手告急(≤2 张)才烧最小炸,否则过牌(不再无脑烧炸)。
 */
function chooseStructuredFollow(
  ctx: HardContext,
  snapshot: Parameters<AiStrategy>[0],
  hand: Card[],
  moves: Move[],
  history: GameEvent[],
  profile: PimcProfile,
): Move | 'pass' {
  const protectedSet = protectedCards(hand);
  const safe = moves.filter(
    (move) => !isBombLike(move.pattern.category) && !usesProtectedCards(move, protectedSet),
  );
  const opponentMin = Math.min(
    ...opponentSeats(snapshot).map((seat) => snapshot.handCounts[seat]),
  );

  const scored = safe.map((move) => ({
    move,
    cost: ctx.decomposer.structureCost(hand, move.cards),
    score: moveOutcomeScore(ctx.decomposer, hand, move, toPressureContext(ctx, snapshot)),
  }));
  const teammate = teammateSeat(snapshot);
  const teammateRace = teammate !== null
    && snapshot.top?.seat === snapshot.landlord
    && snapshot.handCounts[teammate] <= 1;
  const free = teammateRace ? [] : scored.filter((entry) => entry.cost <= 0);
  if (free.length > 0) return pickSmallest(free.map((entry) => entry.move));

  const bombs = bombLikeMoves(moves);
  const cheap = scored.filter((entry) => entry.cost === 1);
  const fallback = (): Move | 'pass' => {
    if (safe.length === 0) {
      if (bombs.length > 0 && opponentMin <= 2) return pickSmallestBombLike(bombs);
      return 'pass';
    }
    if (cheap.length > 0) {
      const pick = pickSmallest(cheap.map((entry) => entry.move));
      if (pick.pattern.mainRank < Rank.A) return pick;
      if (ctx.decomposer.decompose(hand).moveCount <= 3) return pick;
    }
    const urgentThreshold = 8;
    if (opponentMin <= urgentThreshold) return pickSmallest(safe);
    return 'pass';
  };

  const structuredFallback = fallback();
  const grayPool = safe.length > 0 ? safe : bombs;
  const grayScored = grayPool.map((move) => ({
    move,
    score: moveOutcomeScore(ctx.decomposer, hand, move, toPressureContext(ctx, snapshot)),
  })).sort((left, right) => {
    const delta = left.score - right.score;
    return delta !== 0 ? delta : compareMoves(left.move, right.move);
  });
  const grayBest = grayScored[0];
  const gray = grayBest
    ? grayScored.filter((entry) => entry.score <= grayBest.score + PIMC_FOLLOW_BAND).map((entry) => entry.move)
    : [];
  if (profile.samples > 0 && gray.length > 0 && canSampleWorld(snapshot, hand, history)) {
    const verdict = pimcArbitrate({
      snapshot,
      history,
      candidates: gray,
      includePass: true,
      profile,
      mustInclude: structuredFallback === 'pass' ? undefined : structuredFallback,
    });
    return verdict ?? 'pass';
  }
  return structuredFallback;
}

function countsFromRecord(record: Readonly<Record<number, number>>): number[] {
  const counts = new Array<number>(Rank.BigJoker + 1).fill(0);
  for (let rank = Rank.R3; rank <= Rank.BigJoker; rank += 1) counts[rank] = record[rank] ?? 0;
  return counts;
}

function toPressureContext(
  ctx: HardContext,
  snapshot: Parameters<AiStrategy>[0],
): PressureContext | undefined {
  if (!ctx.remainingByRank) return undefined;
  const hidden = opponentSeats(snapshot);
  const first = hidden[0] ?? ((snapshot.turn + 1) % 3);
  const second = hidden[1] ?? [0, 1, 2].find((seat) => seat !== snapshot.turn && seat !== first)!;
  return {
    remainingByRank: countsFromRecord(ctx.remainingByRank),
    hiddenCounts: [snapshot.handCounts[first], snapshot.handCounts[second]],
    certainlyBeatenByRank: ctx.certainLandlordByRank
      ? countsFromRecord(ctx.certainLandlordByRank)
      : undefined,
  };
}

/** 积极控权策略工厂：profile 只改变确定性预算，不改变信息面与合法性。 */
export function hardStrategyWithProfile(profile: PimcProfile): AiStrategy {
  return (snapshot, _rng, history = []) => {
    const hand = requireHand(snapshot);
    const moves = snapshot.top ? legalFollows(hand, snapshot.top.pattern) : enumerateMoves(hand);

    if (snapshot.top && moves.length === 0) return { type: 'pass', seat: snapshot.turn };

    const finishingMove = chooseFinishingMove(hand, moves, snapshot);
    if (finishingMove !== null) return toPlay(snapshot, finishingMove);

    const ctx = buildHardContext(snapshot, hand, history);
    const raceTeammate = teammateSeat(snapshot);
    const deferFarmerTakeover = snapshot.top !== null
      && raceTeammate !== null
      && snapshot.top.seat === snapshot.landlord
      && snapshot.handCounts[raceTeammate] <= 1;

    let guaranteed: Move | null = null;
    if (ctx.remainingByRank) {
      if (snapshot.top === null) guaranteed = chooseGuaranteedLead(hand, moves, ctx.remainingByRank);
      else if (!deferFarmerTakeover) guaranteed = chooseGuaranteedTakeover(hand, moves, ctx.remainingByRank);
    }
    if (guaranteed !== null) return toPlay(snapshot, guaranteed);

    if (ctx.remainingByRank && hand.length <= 10 && history.length > 0 && !deferFarmerTakeover) {
      const unseenByRank = countsFromRecord(ctx.remainingByRank);
      const unseenCount = unseenByRank.reduce((sum, count) => sum + count, 0);
      if (unseenCount <= 14) {
        const exact = solveForcedWin({
          hand,
          unseenByRank,
          minOpponentHandCount: Math.min(...opponentSeats(snapshot).map((seat) => snapshot.handCounts[seat])),
          top: snapshot.top?.pattern ?? null,
          nodeBudget: 60_000,
        });
        if (exact.result === 'win' && exact.move !== null) return toPlay(snapshot, exact.move);
      }
    }

    if (isTeammateTop(snapshot)) return { type: 'pass', seat: snapshot.turn };

    if (isPressing(snapshot)) {
      const bombs = bombLikeMoves(moves);
      if (bombs.length > 0) return toPlay(snapshot, pickSmallestBombLike(bombs));
      if (snapshot.top && !deferFarmerTakeover) return toPlay(snapshot, pickLargest(moves));
      if (!snapshot.top) return toPlay(snapshot, choosePressingLeadMove(ctx, hand, moves));
    }

    if (!snapshot.top) {
      const feed = chooseFeedTeammateLead(snapshot, hand, moves);
      if (feed !== null) return toPlay(snapshot, feed);
      return toPlay(snapshot, chooseLeadMove(ctx, snapshot, hand, moves, history, profile));
    }

    if (!deferFarmerTakeover) {
      const controlFollow = chooseControlFollow(hand, moves);
      if (controlFollow !== null) return toPlay(snapshot, controlFollow);

      const absoluteTopSingle = chooseAbsoluteTopSingleFollow(snapshot, hand, moves, history);
      if (absoluteTopSingle !== null) return toPlay(snapshot, absoluteTopSingle);
    }

    const upstreamPress = chooseUpstreamPressFollow(snapshot, hand, moves);
    if (upstreamPress !== null) return toPlay(snapshot, upstreamPress);

    const structured = chooseStructuredFollow(ctx, snapshot, hand, moves, history, profile);
    if (structured === 'pass') return { type: 'pass', seat: snapshot.turn };
    return toPlay(snapshot, structured);
  };
}

export const hardStrategy: AiStrategy = hardStrategyWithProfile(HARD_PIMC);
