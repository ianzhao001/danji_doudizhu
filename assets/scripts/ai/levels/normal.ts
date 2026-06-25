/**
 * M4-02 普通 AI（保炸弹 + 基础拆牌·确定性）。实现方：实现 normalStrategy 函数体，
 * 使 test/ai/normal.test.ts 转绿。规则见 coordination/tasks/M4-02-ai-normal.md。
 * 仅依赖 rules + 只读快照，禁止 import `cc`，禁止改签名。
 */

import type { AiStrategy } from '../strategy';

/** 保炸弹策略桩：实现见 M4-02。 */
export const normalStrategy: AiStrategy = () => {
  throw new Error('not implemented: normal');
};
