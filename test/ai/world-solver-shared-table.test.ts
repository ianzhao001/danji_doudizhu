/**
 * sota2-R4 B6 种子（规划者预写红种子 · 2026-07-21 · sota2）：
 * solveWorld 支持外部共享置换表（PIMC 跨候选缓存复用），缺省路径向后兼容。
 *
 * 落位：Codex 逐字节复制到 test/ai/world-solver-shared-table.test.ts，独立 seed commit（先红取证）。
 * 预期红（对当前 main，规划者已预验）：用例①② 红（SolveWorldArgs 尚无 table 入参：
 *   ① 外部表不被填充；② 1 节点预算 + 预填表也返回 null）；③ 绿（向后兼容锚）。
 *
 * 负向变异自证（实现后逐条自查，报告注明红几条）：
 *   ① 传入 table 但内部仍走 WeakMap(budget) 私表 → 用例①② 红。
 *   ② 缓存命中挪到预算闸之后 → 用例② 红（nodes:1 被预算闸拦下）。
 *   ③ 不传 table 的默认路径行为被改 → 用例③ 红。
 *
 * 公平预算契约提醒：共享表只共享"已证事实"，各候选的节点预算对象仍独立等额
 * （test/ai/pimc-fair-budget.test.ts 必须保持全绿，禁止为本种子弱化它）。
 */
import { describe, expect, it } from 'vitest';
import { solveWorld, type WorldWinner } from '../../assets/scripts/ai/worldSolver';
import { Rank } from '../../assets/scripts/rules';

const LEN = Rank.BigJoker + 1;

function row(entries: Partial<Record<number, number>>): number[] {
  const filled = new Array<number>(LEN).fill(0);
  for (const [rank, count] of Object.entries(entries)) filled[Number(rank)] = count!;
  return filled;
}

// 微型全明终局：seat0(地主) 单 K 领出，seat1 单 3，seat2 单 4 → 地主一手清，必胜。
function tinyCounts(): [number[], number[], number[]] {
  return [row({ [Rank.K]: 1 }), row({ [Rank.R3]: 1 }), row({ [Rank.R4]: 1 })];
}

type ArgsWithTable = Parameters<typeof solveWorld>[0] & { table?: Map<string, WorldWinner> };

describe('sota2-R4 B6 共享置换表', () => {
  it('① 传入共享表：求解成功且外部表被填充', () => {
    const table = new Map<string, WorldWinner>();
    const args: ArgsWithTable = {
      counts: tinyCounts(),
      turn: 0,
      landlord: 0,
      top: null,
      topSeat: null,
      budget: { nodes: 10_000 },
      table,
    };
    expect(solveWorld(args)).toBe('landlord');
    expect(table.size).toBeGreaterThan(0);
  });

  it('② 预填共享表后：1 节点预算也能命中缓存得到同一结论（命中在预算闸之前）', () => {
    const table = new Map<string, WorldWinner>();
    const warm: ArgsWithTable = {
      counts: tinyCounts(),
      turn: 0,
      landlord: 0,
      top: null,
      topSeat: null,
      budget: { nodes: 10_000 },
      table,
    };
    expect(solveWorld(warm)).toBe('landlord');
    const cold: ArgsWithTable = {
      counts: tinyCounts(),
      turn: 0,
      landlord: 0,
      top: null,
      topSeat: null,
      budget: { nodes: 1 },
      table,
    };
    expect(solveWorld(cold)).toBe('landlord');
  });

  it('③ 不传 table：默认路径行为不变（向后兼容锚）', () => {
    expect(
      solveWorld({
        counts: tinyCounts(),
        turn: 0,
        landlord: 0,
        top: null,
        topSeat: null,
        budget: { nodes: 10_000 },
      }),
    ).toBe('landlord');
  });
});
