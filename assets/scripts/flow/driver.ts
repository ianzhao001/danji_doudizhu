/**
 * M2-06 headless 回合驱动器。实现方：实现 runHeadlessRound 函数体，
 * 使 test/flow/driver.test.ts 转绿。编排步骤见 coordination/tasks/M2-06-flow.md。
 * 只做编排（发牌→叫抢→地主拿底牌→出牌循环→结算），不重判规则、不内联 AI 进 game；
 * 思考时延必须走 config.clock.sleep；禁止 import `cc`、禁止改签名。
 */

import { FlowConfig, FlowResult } from './types';

export async function runHeadlessRound(config: FlowConfig): Promise<FlowResult> {
  throw new Error('not implemented');
}
