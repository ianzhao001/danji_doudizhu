/**
 * M5-08 战绩统计编解码（容错迁移）。架构落桩——实现方实现函数体，使 test/data/stats-codec.test.ts 转绿。
 * 规则见 coordination/tasks/M5-08-stats-codec.md。纯函数、确定性，禁止 import `cc`。
 */

import { type MatchStats, emptyStats } from './stats';
import { isRecord } from '../rules/guards';

export const STATS_VERSION = 1;

const STAT_FIELDS = [
  'rounds',
  'asLandlord',
  'landlordWins',
  'asFarmer',
  'farmerWins',
  'netScore',
] as const;

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

  // Unknown versions fall back to empty stats as graceful degradation (not a reversible migration):
  // stats are not derivable from records, which lack winner-side attribution. version is currently
  // always STATS_VERSION; if it is ever bumped, add an explicit migration here instead.
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
