/**
 * M3-00 事件提示映射（GameEvent/FlowEvent → 动画/音效 cue）。架构落桩——实现方实现函数体，
 * 使 test/ui/event-cues.test.ts 转绿。规则见 coordination/tasks/M3-00-event-cues.md。
 * 纯函数、确定性，禁止 import `cc`。
 */

import { type GameEvent } from '../game';
import { type FlowEvent } from '../flow';

export const CUE_IDS = [
  'play',
  'pass',
  'bomb',
  'rocket',
  'reset',
  'win',
  'deal',
  'bid',
  'redeal',
  'landlordDecided',
  'bottomRevealed',
  'settled',
] as const;

export type CueId = (typeof CUE_IDS)[number];

type AssertExtends<A extends B, B> = A;
export type EventCueExhaustiveness = [
  AssertExtends<GameEvent['type'], CueId>,
  AssertExtends<Exclude<FlowEvent['type'], 'round'>, CueId>,
];

export function cueForGameEvent(event: GameEvent): CueId {
  return event.type;
}

export function cueForFlowEvent(event: FlowEvent): CueId {
  if (event.type === 'round') return cueForGameEvent(event.event);
  return event.type;
}
