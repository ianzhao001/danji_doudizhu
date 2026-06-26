/**
 * M3-00 事件提示映射（GameEvent/FlowEvent → 动画/音效 cue）。架构落桩——实现方实现函数体，
 * 使 test/ui/event-cues.test.ts 转绿。规则见 coordination/tasks/M3-00-event-cues.md。
 * 纯函数、确定性，禁止 import `cc`。
 */

import { type GameEvent } from '../game';
import { type FlowEvent } from '../flow';

export type CueId = string;

export function cueForGameEvent(event: GameEvent): CueId {
  throw new Error('M3-00 event-cues cueForGameEvent not implemented');
}

export function cueForFlowEvent(event: FlowEvent): CueId | null {
  throw new Error('M3-00 event-cues cueForFlowEvent not implemented');
}
