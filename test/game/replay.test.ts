/**
 * M2-11 失败测试：回放/调试 trace（架构种入·不可改）。当前 replay.ts 为桩 → 应先红。
 */
import { describe, it, expect } from 'vitest';
import { buildTrace, traceSummary } from '../../assets/scripts/game/replay';
import { type GameEvent, Side } from '../../assets/scripts/game';
import { Rank, Suit, Category } from '../../assets/scripts/rules';

const pat = (category: Category, mainRank: Rank, length: number) => ({
  category, mainRank, length, cards: Array.from({ length }, () => ({ rank: mainRank, suit: Suit.Spade })),
});

const events: GameEvent[] = [
  { type: 'play', seat: 0, pattern: pat(Category.Single, Rank.R3, 1) },
  { type: 'pass', seat: 1 },
  { type: 'play', seat: 2, pattern: pat(Category.Single, Rank.R5, 1) },
  { type: 'bomb', seat: 0 },
  { type: 'reset', leader: 0 },
  { type: 'win', seat: 0, side: Side.Landlord },
];

describe('M2-11 回放/调试 trace', () => {
  it('buildTrace 顺序一致、turn 递增、win 不计入', () => {
    const trace = buildTrace(events);
    expect(trace).toHaveLength(5); // win 不计入
    expect(trace.map((t) => t.kind)).toEqual(['play', 'pass', 'play', 'bomb', 'reset']);
    // turn 递增（从 0 或 1 起，关键是单调递增）
    const turns = trace.map((t) => t.turn);
    for (let i = 1; i < turns.length; i++) {
      expect(turns[i]).toBeGreaterThan(turns[i - 1]);
    }
  });

  it('buildTrace play 的 summary 含 category', () => {
    const trace = buildTrace(events);
    expect(trace[0].summary).toContain('Single');
  });

  it('traceSummary：turns/bombs 计数正确、winner 取自 win', () => {
    const s = traceSummary(events);
    expect(s.turns).toBe(5); // play+pass+play+bomb+reset
    expect(s.bombs).toBe(1); // bomb (rocket 也计)
    expect(s.winner).toBe(Side.Landlord);
  });

  it('无 win 事件时 winner===null', () => {
    const noWin = events.slice(0, 5);
    expect(traceSummary(noWin).winner).toBeNull();
  });

  it('入参不变', () => {
    const frozen = [...events];
    buildTrace(events);
    expect(events).toEqual(frozen);
  });
});
