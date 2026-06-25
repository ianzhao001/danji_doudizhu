/**
 * M2-04 RoundState 序列化/反序列化（为 M5 断局重开铺垫）。
 * 实现方：实现两个函数体，使 test/game/serialize.test.ts 转绿。
 * 规则见 coordination/tasks/M2-04-serialization.md。纯函数，禁止 import `cc`，禁止改签名。
 */

import { RoundState } from './types';

const notImplemented = (): never => {
  throw new Error('not implemented');
};

/** 序列化为字符串（往返一致、纯 JSON）。 */
export function serializeRound(state: RoundState): string {
  void state;
  return notImplemented();
}

/** 反序列化；对非法 JSON 抛错。 */
export function deserializeRound(json: string): RoundState {
  void json;
  return notImplemented();
}
