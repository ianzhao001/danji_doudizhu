/**
 * M2-10 战绩统计（真人玩家视角）。实现方：实现 emptyStats / recordRound 函数体，
 * 使 test/data/stats.test.ts 转绿。规则见 coordination/tasks/M2-10-data-stats.md。
 * 纯函数、不可变，禁止 import `cc`、禁止改签名。
 */

import { SeatIndex, Side, Settlement } from '../game';

export interface MatchStats {
  rounds: number; // 总局数
  asLandlord: number; // 当地主局数
  landlordWins: number; // 当地主且赢的局数
  asFarmer: number; // 当农民局数
  farmerWins: number; // 当农民且赢的局数
  netScore: number; // 累计净分（hero 座位得分之和）
}

export interface RoundOutcome {
  heroSeat: SeatIndex; // 真人玩家座位
  landlord: SeatIndex;
  winner: Side;
  settlement: Settlement;
}

/** 全 0 初始战绩。 */
export function emptyStats(): MatchStats {
  throw new Error('not implemented');
}

/** 累计一局到战绩；返回新对象，不修改入参 stats。 */
export function recordRound(stats: MatchStats, r: RoundOutcome): MatchStats {
  throw new Error('not implemented');
}
