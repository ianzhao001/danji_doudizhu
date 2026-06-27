/**
 * M5-08 战绩统计编解码（容错迁移）。架构落桩——实现方实现函数体，使 test/data/stats-codec.test.ts 转绿。
 * 规则见 coordination/tasks/M5-08-stats-codec.md。纯函数、确定性，禁止 import `cc`。
 */

import { type MatchStats, emptyStats } from './stats';

export const STATS_VERSION = 1;

const STAT_FIELDS = [
  'rounds',
  'asLandlord',
  'landlordWins',
  'asFarmer',
  'farmerWins',
  'netScore',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function serializeStats(stats: MatchStats): string {
  return JSON.stringify({ version: STATS_VERSION, stats });
}

export function deserializeStats(json: string): MatchStats {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return emptyStats();
  }

  // Unknown versions intentionally fall back to defaults; stats are derivable, so a stale wire should not block boot.
  if (!isRecord(parsed) || parsed.version !== STATS_VERSION || !isRecord(parsed.stats)) {
    return emptyStats();
  }

  const defaults = emptyStats();
  const result: MatchStats = { ...defaults };
  for (const field of STAT_FIELDS) {
    result[field] = numberOrDefault(parsed.stats[field], defaults[field]);
  }
  return result;
}
