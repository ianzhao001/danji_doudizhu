/**
 * W-AI-R2b 种子：PIMC 叶端明牌精确解（规划者预写红种子 · 2026-07-17 · sota2 · 吸收②）。
 *
 * 落位：Codex 逐字节复制到 test/ai/world-solver.test.ts（新建），独立 seed commit（R2b 棒）。
 * 实现目标：assets/scripts/ai/worldSolver.ts ——
 *   solveWorld({ counts:[c0,c1,c2], turn, landlord, top, topSeat, budget:{nodes} })
 *     : 'landlord' | 'farmer' | null（null=预算耗尽，pimc 逐世界回退 rollout）
 *   三家全明两阵营零和极大极小（**农民两席共享效用**）；两 pass 清 top 回合机同 rollout 语义；
 *   置换表跨同次仲裁全部采样共享（budget 为共享可变对象）；零随机零时基，确定性。
 *   与 endgameSolver 的辨析（写模块头）：那是真实态「合并对手悲观」sound-win 证明器；
 *   这是采样态「全明」精确评估器——层级/信息面不同，共存不冗余。
 *
 * ── 独立 oracle ── 种子内置三人明牌朴素全搜（单/对/三域 + 领出整手清完例外），
 *   对 ≤8 张世界给真值；夹具全部限单/对/三域 → 双实现同域互证。
 *   （原计划转录 DreamAndDead/joker 残局：核实其 README 无可转录样例且无 license——
 *    降级为思想印证，夹具改自研 oracle 互证，BOARD 已披露。）
 *
 * ── 预期红（实现前）── 模块不存在 → 全文件红（6 用例）。
 * ── 负向变异自证（执行者实现后自查）──
 *   ① 农民效用改私利（各自为战，不共享）→ 同盟夹具 W2 红。
 *   ② 两 pass 清 top 语义破坏 → 回权夹具红。
 *   ③ budget 不生效 → 预算用例红。
 */
import { describe, expect, it } from 'vitest';
import { Rank, recognize } from '../../assets/scripts/rules';
import { solveWorld } from '../../assets/scripts/ai/worldSolver';
import { toRankCounts } from '../../assets/scripts/ai/rollout';
import { cards } from '../rules/_util';

type Seat = 0 | 1 | 2;
type OracleTop = { size: number; rank: number } | null;

/** 三人明牌朴素全搜（单/对/三域 + 领出整手清完例外）——真值来源独立于实现。 */
function oracleWorld(
  boards: [number[], number[], number[]],
  turn: Seat,
  landlord: Seat,
  top: OracleTop,
  topSeat: Seat | null,
  passes: number,
  memo: Map<string, 'landlord' | 'farmer'>,
): 'landlord' | 'farmer' {
  const key = `${boards.map((b) => b.join('')).join('|')}|${turn}|${top ? `${top.size}-${top.rank}` : 'L'}|${topSeat ?? 'n'}|${passes}`;
  const hit = memo.get(key);
  if (hit) return hit;

  const mySide: 'landlord' | 'farmer' = turn === landlord ? 'landlord' : 'farmer';
  const counts = boards[turn];
  const total = counts.reduce((s, n) => s + n, 0);

  const options: Array<{ takes: Array<[number, number]>; size: number; rank: number } | 'pass'> = [];
  if (top) options.push('pass');
  for (let rank = Rank.R3; rank <= Rank.BigJoker; rank += 1) {
    const c = counts[rank] ?? 0;
    for (let size = 1; size <= Math.min(3, c); size += 1) {
      if (top && (size !== top.size || rank <= top.rank)) continue;
      options.push({ takes: [[rank, size]], size, rank });
    }
  }
  // 领出整手清完例外：整手若恰为「同点 ≤3 张」以外形态不在本域夹具中出现（夹具纪律）。
  let best: 'landlord' | 'farmer' | null = null;
  for (const option of options) {
    let verdict: 'landlord' | 'farmer';
    if (option === 'pass') {
      const nextPasses = passes + 1;
      const nextTurn = ((turn + 1) % 3) as Seat;
      verdict = nextPasses >= 2
        ? oracleWorld(boards, topSeat!, landlord, null, null, 0, memo)
        : oracleWorld(boards, nextTurn, landlord, top, topSeat, nextPasses, memo);
    } else {
      const nextBoards = boards.map((b) => b.slice()) as [number[], number[], number[]];
      for (const [rank, n] of option.takes) nextBoards[turn][rank] -= n;
      const remaining = nextBoards[turn].reduce((s, n) => s + n, 0);
      if (remaining === 0) {
        verdict = mySide;
      } else {
        verdict = oracleWorld(
          nextBoards, ((turn + 1) % 3) as Seat, landlord,
          { size: option.size, rank: option.rank }, turn, 0, memo,
        );
      }
    }
    if (verdict === mySide) { best = verdict; break; } // 当前方存在必胜选项
    best = verdict;
  }
  const result = best ?? (mySide === 'landlord' ? 'farmer' : 'landlord');
  memo.set(key, result);
  return result;
}

function world(l: string, f1: string, f2: string): [number[], number[], number[]] {
  return [toRankCounts(cards(l)), toRankCounts(cards(f1)), toRankCounts(cards(f2))];
}

function oracleOf(boards: [number[], number[], number[]], turn: Seat, top: OracleTop, topSeat: Seat | null) {
  return oracleWorld(boards, turn, 0, top, topSeat, 0, new Map());
}

describe('W-AI-R2b worldSolver 叶端明牌精确解', () => {
  it('oracle 自证：W1 地主先手单 2 清手必胜；W2 农民同盟接力必胜（真值独立于实现）', () => {
    expect(oracleOf(world('2', '3', '4'), 0, null, null)).toBe('landlord');
    // W2：F1 领 3，F2 用 A 抢下（同盟效用）清手 → farmer；若农民各自为战 F2 让牌则 landlord K 收官。
    expect(oracleOf(world('K', '3', 'A'), 1, null, null)).toBe('farmer');
  });

  it('W1/W2：solveWorld 与 oracle 一致（含农民同盟判别）', () => {
    const budget = { nodes: 100_000 };
    expect(solveWorld({ counts: world('2', '3', '4'), turn: 0, landlord: 0, top: null, topSeat: null, budget })).toBe('landlord');
    expect(solveWorld({ counts: world('K', '3', 'A'), turn: 1, landlord: 0, top: null, topSeat: null, budget })).toBe('farmer');
  });

  it('回权语义：双过清 top 后领出权回到 topSeat（与 rollout 同款回合机）', () => {
    const budget = { nodes: 100_000 };
    // 地主 top=K 无人能压 → 双过回权 → 地主领最后一张 A 清手。
    const verdict = solveWorld({
      counts: world('A', '3', '4'), turn: 1, landlord: 0,
      top: recognize(cards('K'))!,
      topSeat: 0, budget,
    });
    expect(verdict).toBe('landlord');
    expect(oracleOf(world('A', '3', '4'), 1, { size: 1, rank: Rank.K }, 0)).toBe('landlord');
  });

  it('≤8 张随机域扫掠：solveWorld 与 oracle 全一致（单/对/三域 12 个构造世界）', () => {
    const fixtures: Array<{ boards: [number[], number[], number[]]; turn: Seat }> = [
      { boards: world('2 2', '3', 'A'), turn: 0 },
      { boards: world('K K', 'A A', '3'), turn: 1 },
      { boards: world('9 9 9', 'K', 'A A'), turn: 0 },
      { boards: world('5', 'K', 'A'), turn: 2 },
      { boards: world('Q Q', '3 3', 'A'), turn: 1 },
      { boards: world('2', 'A A', 'K'), turn: 1 },
      { boards: world('7 7 7', '8 8 8', '3'), turn: 0 },
      { boards: world('A K', 'Q', '2'), turn: 0 },
      { boards: world('4 4', '5 5', '6 6'), turn: 2 },
      { boards: world('2 A', 'K K', '3 3'), turn: 0 },
      { boards: world('J', 'Q', 'K'), turn: 1 },
      { boards: world('6 6 6', '2', 'A'), turn: 0 },
    ];
    for (const [index, fixture] of fixtures.entries()) {
      const budget = { nodes: 200_000 };
      const got = solveWorld({ counts: fixture.boards, turn: fixture.turn, landlord: 0, top: null, topSeat: null, budget });
      const want = oracleOf(fixture.boards, fixture.turn, null, null);
      expect(got, `世界 #${index} solver 与 oracle 分歧`).toBe(want);
    }
  });

  it('预算与回退：nodes=1 → null（pimc 侧逐世界回退 rollout 的接缝依据）', () => {
    const verdict = solveWorld({
      counts: world('9 9 9', 'K', 'A A'), turn: 0, landlord: 0, top: null, topSeat: null,
      budget: { nodes: 1 },
    });
    expect(verdict).toBeNull();
  });

  it('确定性：同入参两跑同值；共享 budget 递减单调', () => {
    const boardsA = world('K K', 'A A', '3');
    const first = solveWorld({ counts: boardsA, turn: 1, landlord: 0, top: null, topSeat: null, budget: { nodes: 100_000 } });
    const second = solveWorld({ counts: boardsA, turn: 1, landlord: 0, top: null, topSeat: null, budget: { nodes: 100_000 } });
    expect(second).toBe(first);
    const shared = { nodes: 100_000 };
    solveWorld({ counts: boardsA, turn: 1, landlord: 0, top: null, topSeat: null, budget: shared });
    expect(shared.nodes, '共享预算必须被消耗（跨采样节流的依据）').toBeLessThan(100_000);
  });
});
