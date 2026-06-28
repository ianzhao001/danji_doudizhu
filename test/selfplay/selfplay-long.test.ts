/**
 * M6-L5 失败测试：selfplay 长回归（架构种入·不可改）。扩 seeds 1..30 → 1..50，扩大回归面。
 * 规则见 coordination/tasks/M6-L5-selfplay-long.md。零 `cc` import（selfplay 层）。
 *
 * 目的：QA_CHECKLIST.md「N 局无非法/死循环/无限等待」的自动化护栏。seeds 1..30 已由
 *   selfplay.test.ts 覆盖；本测试扩到 50，命中更多边界（极端发牌/叫抢路径）。
 *   若扩面命中未覆盖的异常路径，本测试将先红——实现方须修复根因（非改测试）。
 * 注：纯回归护栏，预计零源码改动即绿；若 M6-L4 改了 round-runtime settle 行为，须 rebase 确认仍绿。
 */
import { describe, it, expect } from 'vitest';
import { runSeeds } from './runner';

const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1); // 1..50
const TURN_LIMIT = 300;

describe('M6-L5 selfplay 长回归（seeds 1..50）', () => {
  it('seeds 1..50：每局到达 settled、scores 零和、必终止', async () => {
    const summaries = await runSeeds(SEEDS);
    expect(summaries.map((s) => s.seed)).toEqual(SEEDS);
    for (const s of summaries) {
      const [a, b, c] = s.scores;
      expect(a + b + c).toBe(0); // 零和守恒
      expect(s.turns).toBeGreaterThan(0);
      expect(s.turns).toBeLessThan(TURN_LIMIT); // 必终止、无死循环
      expect(s.landlord).toBeGreaterThanOrEqual(0);
      expect(s.landlord).toBeLessThanOrEqual(2);
      expect(typeof s.winner).toBe('string');
      expect(s.winner.length).toBeGreaterThan(0);
    }
  }, 60000);

  it('可复现：seeds 1..50 跑两次深相等', async () => {
    const first = await runSeeds(SEEDS);
    const second = await runSeeds(SEEDS);
    expect(second).toEqual(first);
  }, 60000);
});
