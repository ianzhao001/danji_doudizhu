/**
 * M4-04B 失败测试：难度 routing 按座位分发证明（架构种入·不可改）。
 * 当前 difficulty.ts 未导出 buildRoutingPolicy → 本文件应先红。
 * 与 difficulty.test.ts 互不踩踏（不同文件、不同断言维度）。
 */
import { describe, it, expect } from 'vitest';
import { buildRoutingPolicy } from './difficulty';
import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import { GamePhase, type GameSnapshot, type TopPlay } from '../../assets/scripts/game';
import { createRng, recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const LEVELS: [AiLevel, AiLevel, AiLevel] = [AiLevel.Hard, AiLevel.Simple, AiLevel.Normal];

function discriminativeSnapshot(turn: 0 | 1 | 2): GameSnapshot {
  // viewer 持 5 9 K：能压单张 3 → play；三档压法不同（hard 抢最大 K，simple/normal 出最小可压 5）
  const top: TopPlay = { seat: 1, pattern: recognize(cards('3'))! };
  return {
    phase: GamePhase.Playing,
    turn,
    landlord: 0,
    top,
    handCounts: [3, 1, 3],
    winner: null,
    viewerHand: cards('5 9 K'),
  };
}

describe('M4-04B 难度 routing 按座位分发', () => {
  it('逐座位：buildRoutingPolicy(levels) 深相等 strategyFor(levels[seat])', () => {
    const policy = buildRoutingPolicy(LEVELS);
    const rng = createRng(1);
    for (const seat of [0, 1, 2] as const) {
      const snap = discriminativeSnapshot(seat);
      expect(policy({ seat, snapshot: snap, rng })).toEqual(strategyFor(LEVELS[seat])(snap, rng));
    }
  });

  it('三档在该快照输出并非全等（证明快照具判别力、分发非平凡）', () => {
    const rng = createRng(1);
    const outputs = ([0, 1, 2] as const).map((seat) => {
      const snap = discriminativeSnapshot(seat);
      return strategyFor(LEVELS[seat])(snap, rng);
    });
    // 三档 play 的牌不应全等（至少有一档与其余不同）
    const cards = outputs.map((o) => (o.type === 'play' ? o.cards : null));
    const distinct = new Set(cards.map((c) => JSON.stringify(c)));
    expect(distinct.size).toBeGreaterThan(1);
  });
});
