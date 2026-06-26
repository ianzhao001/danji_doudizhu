/**
 * M2-11 回放/调试 trace（事件流 → 可复盘摘要）。架构落桩——实现方实现函数体，使 test/game/replay.test.ts 转绿。
 * 规则见 coordination/tasks/M2-11-replay-trace.md。纯函数、确定性，禁止 import `cc`。
 */

import { type GameEvent, type SeatIndex, type Side } from './types';

export interface TraceLine {
  turn: number;
  seat: SeatIndex;
  kind: 'play' | 'pass' | 'bomb' | 'rocket' | 'reset';
  summary: string;
}

export function buildTrace(events: GameEvent[]): TraceLine[] {
  throw new Error('M2-11 buildTrace not implemented');
}

export function traceSummary(events: GameEvent[]): { turns: number; bombs: number; winner: Side | null } {
  throw new Error('M2-11 traceSummary not implemented');
}
