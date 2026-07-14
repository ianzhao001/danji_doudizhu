/**
 * 提示选择纯岛(W-AUDIT-AI R2·Codex 阻断①):
 * 源码文本契约防不住「保留表面调用」式合法改写,故把提示选择行为收进本纯函数——
 * 行为契约直接在 node 单测(test/ui/hint-delegation.test.ts),skeleton 只留一行薄壳委托,
 * 且薄壳全文件禁止直接调用提示原语(adviseBestMove/nextHint/hintSuggestions 等)。
 * 语义(V8 签收意见④):首点(无选中)= AI 最优推荐(adviseBestMove,与 AI 座位同信息面);
 * 已有选中 = 沿既有排序循环换下一手(nextHint)。纯函数、确定性,禁止 import 'cc'。
 */
import { adviseBestMove, nextHint } from '../ai/hint';
import type { GameEvent, GameSnapshot } from '../game';
import type { Card, Move } from '../rules';

export function pickHint(args: {
  snapshot: GameSnapshot;
  history: GameEvent[];
  selected: readonly Card[];
}): Move | null {
  const { snapshot, history, selected } = args;
  if (!snapshot.viewerHand) return null;
  if (selected.length === 0) return adviseBestMove({ snapshot, history });
  return nextHint(snapshot.viewerHand, snapshot.top?.pattern ?? null, selected.slice());
}
