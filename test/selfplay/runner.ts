/**
 * M2-07 自对弈 harness（纯测试代码，不属生产代码）。
 * 实现方：实现 runSeeds 函数体，使 test/selfplay/selfplay.test.ts 转绿。
 *
 * 复用 flow 的 runHeadlessRound，把每局 FlowResult 收敛成 SeedSummary（顺序与入参一致）；
 * 某局不满足不变量（未 settled / scores 不守恒 / 超 turns）时抛错，
 * 消息需含 seed / landlord / winner / turns 与最后 10 个 FlowEvent，便于回归定位。
 *
 * 规则见 coordination/tasks/M2-07-selfplay.md。确定性、禁止 import `cc`、禁止改签名。
 * 实现时从 flow 取 API：
 *   import { runHeadlessRound, type FlowEvent } from '../../assets/scripts/flow';
 */

import { runHeadlessRound, type FlowEvent, type FlowResult } from '../../assets/scripts/flow';

export interface SeedSummary {
  seed: number;
  landlord: number;
  winner: string;
  turns: number;
  scores: [number, number, number];
}

const TURN_LIMIT = 300;

function formatFailure(seed: number, result: Partial<FlowResult>, reason: string): Error {
  const events = result.events ?? [];
  return new Error(
    [
      `selfplay invariant failed: ${reason}`,
      `seed=${seed}`,
      `landlord=${String(result.landlord)}`,
      `winner=${String(result.winner)}`,
      `turns=${String(result.turns)}`,
      `lastEvents=${JSON.stringify(events.slice(-10))}`,
    ].join(' '),
  );
}

function assertSummary(seed: number, result: FlowResult): SeedSummary {
  const settled = result.events.some((event: FlowEvent) => event.type === 'settled');
  if (!settled) throw formatFailure(seed, result, 'missing settled event');

  const scores = result.settlement.scores;
  const total = scores[0] + scores[1] + scores[2];
  if (total !== 0) throw formatFailure(seed, result, `scores are not zero-sum total=${total}`);

  if (result.turns <= 0 || result.turns >= TURN_LIMIT) {
    throw formatFailure(seed, result, `turns outside limit limit=${TURN_LIMIT}`);
  }

  return {
    seed,
    landlord: result.landlord,
    winner: result.winner,
    turns: result.turns,
    scores,
  };
}

/**
 * 对每个 seed 调 runHeadlessRound({ seed })，把 FlowResult 收敛成 SeedSummary[]。
 * 返回数组顺序必须与 seeds 一致。
 */
export async function runSeeds(seeds: number[]): Promise<SeedSummary[]> {
  const summaries: SeedSummary[] = [];

  for (const seed of seeds) {
    try {
      const result = await runHeadlessRound({ seed });
      summaries.push(assertSummary(seed, result));
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('selfplay invariant failed:')) throw error;
      throw formatFailure(seed, {}, error instanceof Error ? error.message : String(error));
    }
  }

  return summaries;
}
