/**
 * M4-04 失败测试：难度差异 selfplay 不变量（架构种入部分不可改）。
 * 当前 runDifficultyMatchup 为桩（throw not implemented）→ 应先红。
 * 难度信号断言由实现方在本文件**新增**（可调以防 flaky），不得改下列不变量断言。
 */
import { describe, it, expect } from 'vitest';
import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import { GamePhase, type GameSnapshot, type TopPlay } from '../../assets/scripts/game';
import { createRng, Rank, recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';
import { runDifficultyMatchup } from './difficulty';

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1); // 1..20

describe('M4-04 难度差异 selfplay（不变量·架构种入）', () => {
  it('混合难度每局到达 settled、零和、无死循环（0<turns<300）', async () => {
    const levels: [AiLevel, AiLevel, AiLevel] = [AiLevel.Hard, AiLevel.Normal, AiLevel.Simple];
    const results = await runDifficultyMatchup(levels, SEEDS);
    expect(results).toHaveLength(SEEDS.length);
    for (const r of results) {
      expect(['landlord', 'farmer']).toContain(r.winner);
      expect(r.scores[0] + r.scores[1] + r.scores[2]).toBe(0);
      expect(r.turns).toBeGreaterThan(0);
      expect(r.turns).toBeLessThan(300);
    }
  });

  it('可复现：同 levels+seeds 跑两次深相等', async () => {
    const levels: [AiLevel, AiLevel, AiLevel] = [AiLevel.Simple, AiLevel.Hard, AiLevel.Normal];
    const a = await runDifficultyMatchup(levels, SEEDS);
    const b = await runDifficultyMatchup(levels, SEEDS);
    expect(a).toEqual(b);
  });
});

describe('M4-04 难度信号（实现方新增·受控场景）', () => {
  it('pressing 跟牌时 hard 抢最大牌权，normal 保守出最小可压', () => {
    const top: TopPlay = { seat: 1, pattern: recognize(cards('3'))! };
    const snapshot: GameSnapshot = {
      phase: GamePhase.Playing,
      turn: 0,
      landlord: 0,
      top,
      handCounts: [3, 1, 3],
      winner: null,
      viewerHand: cards('5 9 K'),
    };

    const hard = strategyFor(AiLevel.Hard)(snapshot, createRng(1));
    const normal = strategyFor(AiLevel.Normal)(snapshot, createRng(1));

    expect(hard.type).toBe('play');
    expect(normal.type).toBe('play');
    if (hard.type === 'play' && normal.type === 'play') {
      expect(hard.cards).toHaveLength(1);
      expect(normal.cards).toHaveLength(1);
      expect(hard.cards[0].rank).toBe(Rank.K);
      expect(normal.cards[0].rank).toBe(Rank.R5);
    }
  });
});
