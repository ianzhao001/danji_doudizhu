/**
 * M4-02 普通 AI（保炸弹 + 基础拆牌·确定性）。实现方：实现 normalStrategy 函数体，
 * 使 test/ai/normal.test.ts 转绿。规则见 coordination/tasks/M4-02-ai-normal.md。
 * 仅依赖 rules + 只读快照，禁止 import `cc`，禁止改签名。
 */

import { enumerateMoves, legalFollows } from '../../rules';
import type { AiStrategy } from '../strategy';
import { conservativeAction, isTeammateTop, requireHand, toPlay } from './_shared';
import { chooseNormalLeadMove } from './lead-score';

/** 保炸弹策略桩：实现见 M4-02。 */
export const normalStrategy: AiStrategy = (snapshot) => {
  const hand = requireHand(snapshot);
  const moves = snapshot.top ? legalFollows(hand, snapshot.top.pattern) : enumerateMoves(hand);

  if (snapshot.top && moves.length === 0) return { type: 'pass', seat: snapshot.turn };
  if (
    snapshot.top &&
    isTeammateTop(snapshot) &&
    snapshot.handCounts[snapshot.landlord] > 2 &&
    snapshot.handCounts[snapshot.turn] > 2
  ) {
    return { type: 'pass', seat: snapshot.turn };
  }
  if (!snapshot.top) return toPlay(snapshot, chooseNormalLeadMove(hand, moves));

  return conservativeAction(snapshot, hand, moves);
};
