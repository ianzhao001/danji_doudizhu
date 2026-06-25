/**
 * M4-03 困难 AI（积极控权 + 择时炸弹·确定性）。实现方：实现 hardStrategy 函数体，
 * 使 test/ai/hard.test.ts 转绿。规则见 coordination/tasks/M4-03-ai-hard.md。
 * 仅依赖 rules + 只读快照，禁止 import `cc`，禁止改签名。
 */

import type { AiStrategy } from '../strategy';

/** 积极控权策略桩：实现见 M4-03。 */
export const hardStrategy: AiStrategy = () => {
  throw new Error('not implemented: hard');
};
