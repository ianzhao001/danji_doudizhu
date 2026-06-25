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

function isFarmer(seat: SeatIndex, landlord: SeatIndex): boolean {
  return seat !== landlord;
}

function detectSpring(input: SettlementInput): Spring {
  const landlordPlays = input.events.filter((event) => event.type === 'play' && event.seat === input.landlord).length;
  const farmerPlays = input.events.filter((event) => event.type === 'play' && isFarmer(event.seat, input.landlord)).length;

  if (input.winner === Side.Landlord && farmerPlays === 0) return 'spring';
  if (input.winner === Side.Farmer && landlordPlays === 1) return 'anti-spring';
  return 'none';
}

/** 由事件流 + 叫抢倍数算出最终倍数与各座位得分。 */
export function settle(input: SettlementInput): Settlement {
  const baseScore = input.baseScore ?? 1;
  const bombs = input.events.filter((event) => event.type === 'bomb' || event.type === 'rocket').length;
  const spring = detectSpring(input);
  const multiplier = input.bidMultiplier * 2 ** bombs * (spring === 'none' ? 1 : 2);
  const unit = baseScore * multiplier;
  const landlordScore = input.winner === Side.Landlord ? 2 * unit : -2 * unit;
  const farmerScore = input.winner === Side.Landlord ? -unit : unit;
  const scores = [0, 0, 0].map((_, seat) => (seat === input.landlord ? landlordScore : farmerScore)) as [
    number,
    number,
    number,
  ];

  return {
    multiplier,
    spring,
    bombs,
    scores,
  };
}
