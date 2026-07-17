import type { SeatIndex } from '../game';

export type SessionTotals = readonly [number, number, number];

export interface SessionScoreInput {
  readonly seat: number;
  readonly score: number;
  readonly isLandlord: boolean;
}

export interface SessionScoreRow {
  readonly seat: number;
  readonly delta: number;
  readonly total: number;
  readonly isLandlord: boolean;
}

/** In-memory totals for a fresh lobby-to-game session. */
export function emptySessionTotals(): SessionTotals {
  return [0, 0, 0];
}

/** Add one zero-sum round without mutating either the current totals or scores. */
export function addRoundScores(
  totals: SessionTotals,
  scores: readonly [number, number, number],
): SessionTotals {
  return [
    totals[0] + scores[0],
    totals[1] + scores[1],
    totals[2] + scores[2],
  ];
}

/** Preserve settlement row order while resolving totals by seat identity. */
export function composeSessionRows(
  scores: readonly SessionScoreInput[],
  totals: SessionTotals,
): SessionScoreRow[] {
  return scores.map((row) => ({
    seat: row.seat,
    delta: row.score,
    total: totals[row.seat as SeatIndex],
    isLandlord: row.isLandlord,
  }));
}
