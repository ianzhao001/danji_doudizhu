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

export interface SeedSummary {
  seed: number;
  landlord: number;
  winner: string;
  turns: number;
  scores: [number, number, number];
}

/**
 * 对每个 seed 调 runHeadlessRound({ seed })，把 FlowResult 收敛成 SeedSummary[]。
 * 返回数组顺序必须与 seeds 一致。
 */
export function runSeeds(_seeds: number[]): Promise<SeedSummary[]> {
  throw new Error('not implemented');
}
