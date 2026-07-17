/**
 * 提示选择纯岛(W-AUDIT-AI R2·Codex 阻断①):
 * 源码文本契约防不住「保留表面调用」式合法改写,故把提示选择行为收进本纯函数——
 * 行为契约直接在 node 单测(test/ui/hint-delegation.test.ts),skeleton 只留一行薄壳委托,
 * 且薄壳全文件禁止直接调用提示原语(adviseBestMove/nextHint/hintSuggestions 等)。
 * W-AI-R2:榜单会话内轮换；手动选牌或世界键变化均重建首项。
 */
import { rankHintCandidates } from '../ai/hint';
import { deriveWorldSeed } from '../ai/pimc';
import type { GameEvent, GameSnapshot } from '../game';
import type { Card, Move } from '../rules';

export interface HintSession {
  key: string;
  hints: Move[];
  cursor: number;
}

export type HintVerdict =
  | { kind: 'move'; move: Move; session: HintSession }
  | { kind: 'passAdvice' }
  | { kind: 'none' };

function cardsKey(cards: readonly Card[]): string {
  return cards.map((card) => `${card.rank}:${card.suit}`).sort().join('|');
}

export function pickHint(args: {
  snapshot: GameSnapshot;
  history: GameEvent[];
  selected: readonly Card[];
  session: HintSession | null;
}): HintVerdict {
  const { snapshot, history, selected, session } = args;
  const key = String(deriveWorldSeed(snapshot, history));
  const valid = session !== null
    && session.key === key
    && session.hints.length > 0
    && session.cursor >= 0
    && session.cursor < session.hints.length;
  if (valid && cardsKey(selected) === cardsKey(session.hints[session.cursor].cards)) {
    const cursor = (session.cursor + 1) % session.hints.length;
    return { kind: 'move', move: session.hints[cursor], session: { key, hints: session.hints, cursor } };
  }
  const ranked = rankHintCandidates({ snapshot, history });
  if (ranked.kind !== 'ranked') return ranked;
  const hints = ranked.hints.map((hint) => hint.move);
  return { kind: 'move', move: hints[0], session: { key, hints, cursor: 0 } };
}
