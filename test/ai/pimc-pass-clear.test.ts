/**
 * sota2-R4 B4 种子（规划者预写红种子 · 2026-07-21 · sota2）：
 * PIMC「过牌」候选的模拟起点必须服从真实回合规则（game/core.ts:98-112 reset 语义）。
 *
 * 落位：Codex 逐字节复制到 test/ai/pimc-pass-clear.test.ts，独立 seed commit（先红取证）。
 * 预期红（对当前 main，规划者已预验）：用例①②③ 全红——
 *   现实现（pimc.ts:440-442）把 pass 起点写死为 turn=下家/top=保留/passes=0，
 *   且 GameSnapshot（game/types.ts）不暴露 passesInARow。
 *
 * 负向变异自证（实现后逐条自查，报告注明红几条）：
 *   ① 删掉 pimc.ts pass 候选的 trick-close 分支（恢复写死起点）→ 用例① 红。
 *   ② solveWorld/rolloutRound 不透传 passes（内部恒 0）→ 用例② 红。
 *   ③ core.ts snapshot() 不填 passesInARow → 用例③ 红。
 */
import { describe, expect, it, vi } from 'vitest';
import {
  GamePhase,
  snapshot as coreSnapshot,
  type GameSnapshot,
  type RoundState,
  type SeatIndex,
} from '../../assets/scripts/game';
import { Rank, legalFollows, recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const captured = vi.hoisted(() => ({
  calls: [] as Array<{
    turn: number;
    topRank: number | null;
    topSeat: number | null;
    passes: number | undefined;
  }>,
}));

vi.mock('../../assets/scripts/ai/worldSolver', () => ({
  solveWorld: (args: {
    turn: number;
    top: { mainRank: number } | null;
    topSeat: number | null;
    passes?: number;
    budget: { nodes: number };
  }) => {
    captured.calls.push({
      turn: args.turn,
      topRank: args.top?.mainRank ?? null,
      topSeat: args.topSeat,
      passes: args.passes,
    });
    args.budget.nodes -= 1;
    return 'farmer' as const;
  },
}));

import { pimcRank } from '../../assets/scripts/ai/pimc';

type SnapWithPasses = GameSnapshot & { passesInARow?: number };

function followSnapshot(passesInARow: number): SnapWithPasses {
  return {
    phase: GamePhase.Playing,
    turn: 1,
    landlord: 2,
    top: { seat: 2, pattern: recognize(cards('4'))! },
    handCounts: [26, 2, 26],
    winner: null,
    viewerHand: cards('7 8'),
    passesInARow,
  };
}

function runPimc(snap: SnapWithPasses): { play: (typeof captured.calls)[number]; pass: (typeof captured.calls)[number] } {
  captured.calls.splice(0);
  const hand = snap.viewerHand!;
  const candidates = legalFollows(hand, snap.top!.pattern).filter((move) => move.pattern.mainRank === Rank.R7);
  expect(candidates).toHaveLength(1);
  pimcRank({
    snapshot: snap,
    history: [],
    candidates,
    includePass: true,
    profile: { samples: 1, maxCandidates: 1, solverCardMax: 60, solverNodes: 10 },
  });
  // 候选主序：options=[出7, 过牌]，各 1 个采样世界 → 恰两次求解调用
  expect(captured.calls).toHaveLength(2);
  return { play: captured.calls[0]!, pass: captured.calls[1]! };
}

describe('sota2-R4 B4 PIMC 过牌候选起点', () => {
  it('① 已一过再过（passes 将满 2）：回合关闭——top 清空、牌权回顶牌方自由领出', () => {
    const { play, pass } = runPimc(followSnapshot(1));
    expect(play.topRank).toBe(Rank.R7); // 出牌候选起点：顶=自己刚出的 7（行为锚）
    expect(pass.topRank).toBeNull();
    expect(pass.topSeat).toBeNull();
    expect(pass.turn).toBe(2); // 顶牌方 seat2 重新领出
    expect(pass.passes).toBe(0);
  });

  it('② 首个过牌（passes 0→1）：top/topSeat 保留、过牌计数透传给求解器', () => {
    const { pass } = runPimc(followSnapshot(0));
    expect(pass.topRank).toBe(Rank.R4);
    expect(pass.topSeat).toBe(2);
    expect(pass.turn).toBe(2);
    expect(pass.passes).toBe(1);
  });

  it('③ GameSnapshot 暴露 passesInARow（单一事实源；消费方一律 ?? 0，不再从 history 尾推导）', () => {
    const state: RoundState = {
      phase: GamePhase.Playing,
      landlord: 2,
      seats: [0, 1, 2].map((index) => ({ index: index as SeatIndex, hand: cards('3') })),
      turn: 1,
      top: { seat: 2, pattern: recognize(cards('4'))! },
      passesInARow: 1,
      winner: null,
      bombsPlayed: 0,
      bottom: null,
    };
    expect((coreSnapshot(state, 1) as SnapWithPasses).passesInARow).toBe(1);
  });
});
