/**
 * M4-03 困难 AI（积极控权 + 择时炸弹·确定性）。实现方：实现 hardStrategy 函数体，
 * 使 test/ai/hard.test.ts 转绿。规则见 coordination/tasks/M4-03-ai-hard.md。
 * 仅依赖 rules + 只读快照，禁止 import `cc`，禁止改签名。
 */

import { enumerateMoves, legalFollows } from '../../rules';
import type { AiStrategy } from '../strategy';
import {
  bombLikeMoves,
  conservativeAction,
  pickLargest,
  pickSmallestBombLike,
  requireHand,
  toPlay,
} from './_shared';

function isPressing(snapshot: Parameters<AiStrategy>[0]): boolean {
  return snapshot.handCounts.some((count, seat) => seat !== snapshot.turn && count <= 2);
}

/** 积极控权策略桩：实现见 M4-03。 */
export const hardStrategy: AiStrategy = (snapshot) => {
  const hand = requireHand(snapshot);
  const moves = snapshot.top ? legalFollows(hand, snapshot.top.pattern) : enumerateMoves(hand);

  if (snapshot.top && moves.length === 0) return { type: 'pass', seat: snapshot.turn };

  if (isPressing(snapshot)) {
    const bombs = bombLikeMoves(moves);
    if (bombs.length > 0) return toPlay(snapshot, pickSmallestBombLike(bombs));
    if (snapshot.top) return toPlay(snapshot, pickLargest(moves));
  }

  return conservativeAction(snapshot, hand, moves);
};
