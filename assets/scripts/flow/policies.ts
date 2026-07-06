/**
 * M-FLOW-03 难度策略工厂。架构落桩——实现方实现函数体，使 test/flow/policies.test.ts 转绿。
 * 规则见 coordination/tasks/M-FLOW-03-level-policies.md。纯逻辑，禁止 import `cc`、禁止改签名。
 * playPolicy 按 snapshot.turn 路由 strategyFor(levels[turn])；bidPolicy 按 seat 路由 chooseBidByLevel。
 * 可从 ai / flow 取 API：
 *   import { AiLevel, strategyFor, chooseBidByLevel } from '../ai';
 *   import { type BidPolicy, type PlayPolicy } from '.';
 */

import { AiLevel, strategyFor, chooseBidByLevel } from '../ai';
import { type BidPolicy, type PlayPolicy } from './types';

export function levelPolicies(levels: [AiLevel, AiLevel, AiLevel]): {
  bidPolicy: BidPolicy;
  playPolicy: PlayPolicy;
} {
  return {
    bidPolicy: ({ seat, state, hand }) => chooseBidByLevel(hand, state, levels[seat]),
    playPolicy: ({ snapshot, rng, history }) => strategyFor(levels[snapshot.turn])(snapshot, rng, history ?? []),
  };
}
