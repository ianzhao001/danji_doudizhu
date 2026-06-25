/**
 * M2-05 基线随机合法 AI（出牌阶段）。实现方：实现 chooseAction 函数体，
 * 使 test/ai/baseline.test.ts 转绿。规则见 coordination/tasks/M2-05-ai-baseline.md。
 * 仅依赖 rules + 只读快照，禁止 import `cc`，禁止改签名。
 */

import { Rng } from '../rules';
import { GameSnapshot, RoundAction } from '../game';

const notImplemented = (): never => {
  throw new Error('not implemented');
};

/**
 * 基于只读快照选择一个合法动作：
 * - 领出(top=null)：enumerateMoves(viewerHand) 随机选一个 play。
 * - 跟牌：legalFollows(viewerHand, top.pattern) 非空则随机 play，否则 pass。
 */
export function chooseAction(snapshot: GameSnapshot, rng: Rng): RoundAction {
  void snapshot;
  void rng;
  return notImplemented();
}
