/**
 * W-AI-R3 B1' 种子：PIMC 每候选等额独立预算。
 *
 * 负向变异自证：
 *   ① 改回一个 solverBudget 供全部候选共享 → budget 对象数与起始额断言转红。
 *   ② 改回 world×option 的 sample 主序 → 求解调用点数序列从 AAA/BBB 变为 AB/AB/AB，断言转红。
 *   ③ 候选输入顺序泄漏到聚合分 → 反序同榜断言转红。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Category, enumerateMoves } from '../../assets/scripts/rules';
import { GamePhase, type GameSnapshot } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const captured = vi.hoisted(() => ({
  solverCalls: [] as Array<{
    budget: object;
    nodesBefore: number;
    topRank: number | null;
  }>,
}));

vi.mock('../../assets/scripts/ai/worldSolver', () => ({
  solveWorld: (args: {
    budget: { nodes: number };
    top: { mainRank: number } | null;
  }) => {
    captured.solverCalls.push({
      budget: args.budget,
      nodesBefore: args.budget.nodes,
      topRank: args.top?.mainRank ?? null,
    });
    args.budget.nodes -= 1;
    return 'landlord' as const;
  },
}));

import { pimcRank } from '../../assets/scripts/ai/pimc';

function optionKey(option: ReturnType<typeof pimcRank>[number]): string {
  return option.move === null
    ? 'pass'
    : option.move.cards.map((card) => `${card.rank}:${card.suit}`).sort().join('|');
}

const leadHand = cards('3 3 3 3 4 4 4 4 5 5 5 5 6 6 6 6 7 7 7 7');
const leadSnapshot: GameSnapshot = {
  phase: GamePhase.Playing,
  turn: 0,
  landlord: 0,
  top: null,
  handCounts: [20, 17, 17],
  winner: null,
  viewerHand: leadHand,
};

describe('W-AI-R3 B1\' PIMC 公平预算', () => {
  beforeEach(() => captured.solverCalls.splice(0));

  it('两候选各拿 solverNodes/2 的独立预算，且同序跑完全部世界', () => {
    const candidates = enumerateMoves(leadHand)
      .filter((move) => move.pattern.category === Category.Single)
      .slice(0, 2);
    expect(candidates).toHaveLength(2);

    const run = (input: typeof candidates) => {
      captured.solverCalls.splice(0);
      const ranked = pimcRank({
        snapshot: leadSnapshot,
        history: [],
        candidates: input,
        includePass: false,
        profile: { samples: 3, maxCandidates: 2, solverCardMax: 60, solverNodes: 10 },
      });
      return {
        ranked: ranked.map((option) => [optionKey(option), option.score] as const),
        calls: captured.solverCalls.slice(),
      };
    };

    const forward = run(candidates);
    expect(new Set(forward.calls.map((call) => call.budget)).size).toBe(2);
    expect(forward.calls.filter((_, index) => index % 3 === 0).map((call) => call.nodesBefore)).toEqual([5, 5]);
    expect(forward.calls.map((call) => call.topRank)).toEqual([
      forward.calls[0].topRank,
      forward.calls[0].topRank,
      forward.calls[0].topRank,
      forward.calls[3].topRank,
      forward.calls[3].topRank,
      forward.calls[3].topRank,
    ]);
    expect(forward.calls[0].topRank).not.toBe(forward.calls[3].topRank);

    const reversed = run(candidates.slice().reverse());
    expect(reversed.ranked).toEqual(forward.ranked);
  });
});
