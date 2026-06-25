/**
 * M4-01 简单 AI（最小化·确定性）。实现方：实现 simpleStrategy 函数体，
 * 使 test/ai/simple.test.ts 转绿。规则见 coordination/tasks/M4-01-ai-simple.md。
 * 仅依赖 rules + 只读快照，禁止 import `cc`，禁止改签名。
 */

import { enumerateMoves, legalFollows, type Move } from '../../rules';
import type { AiStrategy } from '../strategy';

function requireHand(snapshot: Parameters<AiStrategy>[0]) {
  if (!snapshot.viewerHand || snapshot.viewerHand.length === 0) throw new Error('VIEWER_HAND_REQUIRED');
  return snapshot.viewerHand;
}

function compareMoves(a: Move, b: Move): number {
  if (a.cards.length !== b.cards.length) return a.cards.length - b.cards.length;
  return a.pattern.mainRank - b.pattern.mainRank;
}

function pickSmallest(moves: Move[]): Move {
  if (moves.length === 0) throw new Error('NO_LEGAL_MOVES');
  return moves.slice().sort(compareMoves)[0];
}

/** 最小化策略桩：实现见 M4-01。 */
export const simpleStrategy: AiStrategy = (snapshot) => {
  const hand = requireHand(snapshot);

  if (!snapshot.top) {
    const move = pickSmallest(enumerateMoves(hand));
    return { type: 'play', seat: snapshot.turn, cards: move.cards.slice() };
  }

  const follows = legalFollows(hand, snapshot.top.pattern);
  if (follows.length === 0) return { type: 'pass', seat: snapshot.turn };

  const move = pickSmallest(follows);
  return { type: 'play', seat: snapshot.turn, cards: move.cards.slice() };
};
