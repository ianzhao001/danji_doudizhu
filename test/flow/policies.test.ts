/**
 * M-FLOW-03 失败测试：难度策略工厂（架构种入·不可改）。
 * 当前 policies.ts 为桩（throw not implemented）→ 应先红。
 */
import { describe, it, expect } from 'vitest';
import { levelPolicies } from '../../assets/scripts/flow/policies';
import { AiLevel, strategyFor, chooseBidByLevel } from '../../assets/scripts/ai';
import { GamePhase, type GameSnapshot, type TopPlay } from '../../assets/scripts/game';
import { createRng, recognize, Rank } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';
import { runHeadlessRound } from '../../assets/scripts/flow';
import { createBidding } from '../../assets/scripts/game';

const LEVELS: [AiLevel, AiLevel, AiLevel] = [AiLevel.Hard, AiLevel.Normal, AiLevel.Simple];

function discriminativeSnapshot(turn: 0 | 1 | 2): GameSnapshot {
  // viewer 持 5 9 K：能压单张 3 → play；三档压法不同（hard 抢最大 K，normal 出最小可压 5）
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

describe('M-FLOW-03 难度策略工厂', () => {
  it('playPolicy 按 seat 路由到 strategyFor(levels[seat])（seat 0/1/2 深相等）', () => {
    const { playPolicy } = levelPolicies(LEVELS);
    const rng = createRng(1);
    for (const seat of [0, 1, 2] as const) {
      const snap = discriminativeSnapshot(seat);
      expect(playPolicy({ seat, snapshot: snap, rng })).toEqual(strategyFor(LEVELS[seat])(snap, rng));
    }
  });

  it('bidPolicy calling 按座位难度路由，深相等 chooseBidByLevel(..., LEVELS[seat])', () => {
    const { bidPolicy } = levelPolicies(LEVELS);
    const strong = cards('x X 3 4 5');
    const weak = cards('3 4 5 6 7');
    const calling = createBidding(0);
    expect(bidPolicy({ seat: 0, state: calling, hand: strong })).toEqual(chooseBidByLevel(strong, calling, LEVELS[0]));
    expect(bidPolicy({ seat: 0, state: calling, hand: weak })).toEqual(chooseBidByLevel(weak, calling, LEVELS[0]));
    expect(bidPolicy({ seat: 0, state: calling, hand: strong }).type).toBe('call');
    expect(bidPolicy({ seat: 0, state: calling, hand: weak }).type).toBe('pass');
  });

  it('可注入 runHeadlessRound：解析为 settled、零和、0<turns<300', async () => {
    const { bidPolicy, playPolicy } = levelPolicies(LEVELS);
    const result = await runHeadlessRound({ seed: 42, bidPolicy, playPolicy });
    expect(['landlord', 'farmer']).toContain(result.winner);
    const sum = result.settlement.scores.reduce((a, b) => a + b, 0);
    expect(sum).toBe(0);
    expect(result.turns).toBeGreaterThan(0);
    expect(result.turns).toBeLessThan(300);
  });
});
