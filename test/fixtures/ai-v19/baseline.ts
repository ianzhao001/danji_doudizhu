/**
 * M2-05 基线随机合法 AI（出牌阶段）。实现方：实现 chooseAction 函数体，
 * 使 test/ai/baseline.test.ts 转绿。规则见 coordination/tasks/M2-05-ai-baseline.md。
 * 仅依赖 rules + 只读快照，禁止 import `cc`，禁止改签名。
 */

import { enumerateMoves, legalFollows, type Move, type Rng } from '../../../assets/scripts/rules';
import { GameSnapshot, RoundAction } from '../../../assets/scripts/game';

function pickMove(moves: Move[], rng: Rng): Move {
  if (moves.length === 0) throw new Error('NO_LEGAL_MOVES');
  const index = Math.min(moves.length - 1, Math.floor(rng.next() * moves.length));
  return moves[index];
}

/**
 * 基于只读快照选择一个合法动作：
 * - 领出(top=null)：enumerateMoves(viewerHand) 随机选一个 play。
 * - 跟牌：legalFollows(viewerHand, top.pattern) 非空则随机 play，否则 pass。
 */
export function chooseAction(snapshot: GameSnapshot, rng: Rng): RoundAction {
  const hand = snapshot.viewerHand;
  if (!hand || hand.length === 0) throw new Error('VIEWER_HAND_REQUIRED');

  if (!snapshot.top) {
    const move = pickMove(enumerateMoves(hand), rng);
    return { type: 'play', seat: snapshot.turn, cards: move.cards.slice() };
  }

  const move = legalFollows(hand, snapshot.top.pattern);
  if (move.length === 0) return { type: 'pass', seat: snapshot.turn };

  return { type: 'play', seat: snapshot.turn, cards: pickMove(move, rng).cards.slice() };
}
