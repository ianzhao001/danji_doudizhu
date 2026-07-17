/**
 * M4-01 简单 AI（最小化·确定性）。实现方：实现 simpleStrategy 函数体，
 * 使 test/ai/simple.test.ts 转绿。规则见 coordination/tasks/M4-01-ai-simple.md。
 * 仅依赖 rules + 只读快照，禁止 import `cc`，禁止改签名。
 */

import { enumerateMoves, isBombLike, legalFollows } from '../../rules';
import type { AiStrategy } from '../strategy';
import {
  chooseFinishingMove,
  isTeammateTop,
  pickSmallest,
  protectedCards,
  requireHand,
  toPlay,
  usesProtectedCards,
} from './_shared';
import { chooseNormalLeadMove } from './lead-score';

/** 最小化策略桩：实现见 M4-01。 */
export const simpleStrategy: AiStrategy = (snapshot) => {
  const hand = requireHand(snapshot);
  const moves = snapshot.top ? legalFollows(hand, snapshot.top.pattern) : enumerateMoves(hand);

  if (snapshot.top && moves.length === 0) return { type: 'pass', seat: snapshot.turn };
  const finishing = chooseFinishingMove(snapshot, hand, moves);
  if (finishing) return toPlay(snapshot, finishing);

  if (snapshot.top && isTeammateTop(snapshot) && snapshot.handCounts[snapshot.landlord] > 2) {
    return { type: 'pass', seat: snapshot.turn };
  }
  if (!snapshot.top) return toPlay(snapshot, chooseNormalLeadMove(hand, moves));

  const protectedSet = protectedCards(hand);
  const safe = moves.filter(
    (move) => !isBombLike(move.pattern.category) && !usesProtectedCards(move, protectedSet),
  );
  if (safe.length === 0) return { type: 'pass', seat: snapshot.turn };
  return toPlay(snapshot, pickSmallest(safe));
};
