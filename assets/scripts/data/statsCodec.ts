/**
 * M5-08 战绩统计编解码（容错迁移）。架构落桩——实现方实现函数体，使 test/data/stats-codec.test.ts 转绿。
 * 规则见 coordination/tasks/M5-08-stats-codec.md。纯函数、确定性，禁止 import `cc`。
 */

import { type MatchStats, emptyStats } from './stats';

export const STATS_VERSION = 1;

export function serializeStats(stats: MatchStats): string {
  throw new Error('M5-08 serializeStats not implemented');
}

export function deserializeStats(json: string): MatchStats {
  throw new Error('M5-08 deserializeStats not implemented');
}

void emptyStats;
