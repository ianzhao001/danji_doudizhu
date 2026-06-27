/**
 * M5-11 一局结束结果聚合：FlowResult -> stats + records。
 */

import type { FlowResult } from '../flow';
import type { SeatIndex } from '../game';
import { appendRecord, type RecordEntry, type RecordsState } from './records';
import { recordRound, type MatchStats, type RoundOutcome } from './stats';

export function toRoundOutcome(result: FlowResult, heroSeat: SeatIndex): RoundOutcome {
  return {
    heroSeat,
    landlord: result.landlord,
    winner: result.winner,
    settlement: result.settlement,
  };
}

export function toRecordEntry(result: FlowResult, heroSeat: SeatIndex, playedAt: number): RecordEntry {
  return {
    heroSeat,
    landlord: result.landlord,
    winner: result.winner,
    multiplier: result.settlement.multiplier,
    bombs: result.settlement.bombs,
    spring: result.settlement.spring,
    heroScore: result.settlement.scores[heroSeat],
    playedAt,
  };
}

export function applyFinishedRound(
  stats: MatchStats,
  records: RecordsState,
  result: FlowResult,
  heroSeat: SeatIndex,
  playedAt: number,
): { stats: MatchStats; records: RecordsState } {
  return {
    stats: recordRound(stats, toRoundOutcome(result, heroSeat)),
    records: appendRecord(records, toRecordEntry(result, heroSeat, playedAt)),
  };
}
