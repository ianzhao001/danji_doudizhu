/**
 * M4-04 难度差异 selfplay helper（纯测试代码，不属生产代码）。
 * 架构落桩——实现方实现 runDifficultyMatchup 函数体，使 test/selfplay/difficulty.test.ts 转绿。
 *
 * 要点（见 coordination/tasks/M4-04-difficulty-selfplay.md）：
 *   - 构造**单个** playPolicy，按 snapshot.turn 路由到 strategyFor(levels[seat])；
 *   - 对每个 seed 调 runHeadlessRound({ seed, playPolicy })，收敛为 MatchSummary（顺序同入参）；
 *   - 确定性、禁止 import `cc`、不依赖 runner.ts。
 * 可从 flow / ai 取 API：
 *   import { runHeadlessRound, type PlayPolicy } from '../../assets/scripts/flow';
 *   import { strategyFor, AiLevel } from '../../assets/scripts/ai';
 */

import { AiLevel } from '../../assets/scripts/ai';
import { levelPolicies, runHeadlessRound, type PlayPolicy } from '../../assets/scripts/flow';

/** M4-04B routing 构造。T-DEDUP：不再复制生产路由——直接复用 flow/policies 的 levelPolicies（测试验证生产实现本体，消除契约漂移盲区）。 */
export function buildRoutingPolicy(levels: [AiLevel, AiLevel, AiLevel]): PlayPolicy {
  return levelPolicies(levels).playPolicy;
}

export interface MatchSummary {
  seed: number;
  landlord: number;
  winner: string;
  turns: number;
  scores: [number, number, number];
}

export async function runDifficultyMatchup(
  levels: [AiLevel, AiLevel, AiLevel],
  seeds: number[],
): Promise<MatchSummary[]> {
  const playPolicy = buildRoutingPolicy(levels);
  const summaries: MatchSummary[] = [];

  for (const seed of seeds) {
    const result = await runHeadlessRound({ seed, playPolicy });
    summaries.push({
      seed,
      landlord: result.landlord,
      winner: result.winner,
      turns: result.turns,
      scores: result.settlement.scores,
    });
  }

  return summaries;
}
