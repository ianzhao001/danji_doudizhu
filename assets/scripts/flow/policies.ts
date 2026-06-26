/**
 * M-FLOW-03 难度策略工厂。架构落桩——实现方实现函数体，使 test/flow/policies.test.ts 转绿。
 * 规则见 coordination/tasks/M-FLOW-03-level-policies.md。纯逻辑，禁止 import `cc`、禁止改签名。
 * playPolicy 按 snapshot.turn 路由 strategyFor(levels[seat])；bidPolicy 委派基线 chooseBid。
 * 可从 ai / flow 取 API：
 *   import { AiLevel, strategyFor, chooseBid } from '../ai';
 *   import { type BidPolicy, type PlayPolicy } from '.';
 */

import { AiLevel, strategyFor, chooseBid } from '../ai';
import { type BidPolicy, type PlayPolicy } from './types';

export function levelPolicies(levels: [AiLevel, AiLevel, AiLevel]): {
  bidPolicy: BidPolicy;
  playPolicy: PlayPolicy;
} {
  return {
    bidPolicy: ({ state, hand }) => chooseBid(hand, state),
    playPolicy: ({ snapshot, rng }) => strategyFor(levels[snapshot.turn])(snapshot, rng),
  };
}
