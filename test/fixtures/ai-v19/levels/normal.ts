/**
 * M4-02 普通 AI（保炸弹 + 基础拆牌·确定性）。实现方：实现 normalStrategy 函数体，
 * 使 test/ai/normal.test.ts 转绿。规则见 coordination/tasks/M4-02-ai-normal.md。
 * 仅依赖 rules + 只读快照，禁止 import `cc`，禁止改签名。
 */

import { Rank, enumerateMoves, isBombLike, legalFollows, type Card, type Move } from '../../../../assets/scripts/rules';
import { Decomposer } from '../decompose';
import { moveOutcomeScore } from '../handWeight';
import type { AiStrategy } from '../strategy';
import {
  chooseFeedTeammateLead,
  chooseFinishingMove,
  compareMoves,
  conservativeAction,
  isTeammateTop,
  pickSmallest,
  protectedCards,
  requireHand,
  toPlay,
  usesProtectedCards,
} from './_shared';

/** 结构白出同分域内奖励一次多脱牌；须足以避免告急态把单 3 当成喂牌形态。 */
const NORMAL_LEAD_SHED_WEIGHT = 100;

function chooseStructureLead(hand: Card[], moves: Move[]): Move {
  const protectedSet = protectedCards(hand);
  const safe = moves.filter(
    (move) => !isBombLike(move.pattern.category) && !usesProtectedCards(move, protectedSet),
  );
  if (safe.length === 0) return pickSmallest(moves);

  const decomposer = new Decomposer({ nodeBudget: 30_000 });
  const white = safe.filter((move) => decomposer.structureCost(hand, move.cards) <= 0);
  const candidates = white.length > 0 ? white : safe;
  return candidates.slice().sort((left, right) => {
    const leftScore = moveOutcomeScore(decomposer, hand, left) - left.cards.length * NORMAL_LEAD_SHED_WEIGHT;
    const rightScore = moveOutcomeScore(decomposer, hand, right) - right.cards.length * NORMAL_LEAD_SHED_WEIGHT;
    const delta = leftScore - rightScore;
    return delta !== 0 ? delta : compareMoves(left, right);
  })[0]!;
}

/** 保炸弹策略桩：实现见 M4-02。 */
export const normalStrategy: AiStrategy = (snapshot) => {
  const hand = requireHand(snapshot);
  const moves = snapshot.top ? legalFollows(hand, snapshot.top.pattern) : enumerateMoves(hand);

  if (snapshot.top && moves.length === 0) return { type: 'pass', seat: snapshot.turn };
  const finishing = chooseFinishingMove(snapshot, hand, moves);
  if (finishing) return toPlay(snapshot, finishing);
  if (
    snapshot.top &&
    isTeammateTop(snapshot) &&
    snapshot.handCounts[snapshot.landlord] > 2 &&
    snapshot.handCounts[snapshot.turn] > 2
  ) {
    return { type: 'pass', seat: snapshot.turn };
  }
  if (!snapshot.top) {
    const feed = chooseFeedTeammateLead(snapshot, hand, moves);
    return toPlay(snapshot, feed ?? chooseStructureLead(hand, moves));
  }

  const protectedSet = protectedCards(hand);
  const safe = moves.filter(
    (move) => !isBombLike(move.pattern.category) && !usesProtectedCards(move, protectedSet),
  );
  if (safe.length === 0) return conservativeAction(snapshot, hand, moves);
  const decomposer = new Decomposer({ nodeBudget: 30_000 });
  const scored = safe.map((move) => ({ move, cost: decomposer.structureCost(hand, move.cards) }));
  const free = scored.filter((entry) => entry.cost <= 0).map((entry) => entry.move);
  if (free.length > 0) return toPlay(snapshot, pickSmallest(free));
  const cheap = scored.filter(
    (entry) => entry.cost === 1 && entry.move.pattern.mainRank < Rank.A,
  ).map((entry) => entry.move);
  if (cheap.length > 0) return toPlay(snapshot, pickSmallest(cheap));
  return { type: 'pass', seat: snapshot.turn };
};
