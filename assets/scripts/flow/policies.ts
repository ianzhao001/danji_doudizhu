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
  throw new Error('M-FLOW-03 not implemented');
}

// 复用引用，避免未使用告警（实现方删除本行即可）
void strategyFor;
void chooseBid;
