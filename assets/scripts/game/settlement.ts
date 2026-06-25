/**
 * M2-03 结算（倍数连乘 + 春天 + 胜负）。实现方：实现 settle 函数体，
 * 使 test/game/settlement.test.ts 转绿。规则见 coordination/tasks/M2-03-settlement.md。
 * 纯函数，禁止 import `cc`，禁止改本文件已有的类型与签名。
 */

import { SeatIndex, Side, GameEvent } from './types';

export type Spring = 'none' | 'spring' | 'anti-spring';

export interface SettlementInput {
  landlord: SeatIndex;
  winner: Side;
  bidMultiplier: number;
  events: GameEvent[];
  baseScore?: number; // 默认 1
}

export interface Settlement {
  multiplier: number;
  spring: Spring;
  bombs: number;
  scores: [number, number, number]; // 各座位得分，和为 0
}

const notImplemented = (): never => {
  throw new Error('not implemented');
};

/** 由事件流 + 叫抢倍数算出最终倍数与各座位得分。 */
export function settle(input: SettlementInput): Settlement {
  void input;
  return notImplemented();
}
