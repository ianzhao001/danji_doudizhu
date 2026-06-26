/**
 * M2-11 回放/调试 trace（事件流 → 可复盘摘要）。架构落桩——实现方实现函数体，使 test/game/replay.test.ts 转绿。
 * 规则见 coordination/tasks/M2-11-replay-trace.md。纯函数、确定性，禁止 import `cc`。
 */

import { type GameEvent, type SeatIndex, type Side } from './types';
import { Category, Rank } from '../rules';

export interface TraceLine {
  turn: number;
  seat: SeatIndex;
  kind: 'play' | 'pass' | 'bomb' | 'rocket' | 'reset';
  summary: string;
}

export function buildTrace(events: GameEvent[]): TraceLine[] {
  const trace: TraceLine[] = [];
  for (const event of events) {
    if (event.type === 'win') continue;
    const turn = trace.length + 1;
    if (event.type === 'play') {
      trace.push({
        turn,
        seat: event.seat,
        kind: 'play',
        summary: `play ${Category[event.pattern.category]} ${Rank[event.pattern.mainRank]}`,
      });
    } else if (event.type === 'pass') {
      trace.push({ turn, seat: event.seat, kind: 'pass', summary: 'pass' });
    } else if (event.type === 'bomb') {
      trace.push({ turn, seat: event.seat, kind: 'bomb', summary: 'bomb' });
    } else if (event.type === 'rocket') {
      trace.push({ turn, seat: event.seat, kind: 'rocket', summary: 'rocket' });
    } else {
      trace.push({ turn, seat: event.leader, kind: 'reset', summary: 'reset' });
    }
  }
  return trace;
}

export function traceSummary(events: GameEvent[]): { turns: number; bombs: number; winner: Side | null } {
  let turns = 0;
  let bombs = 0;
  let winner: Side | null = null;

  for (const event of events) {
    if (event.type === 'win') {
      winner = event.side;
      continue;
    }
    turns += 1;
    if (event.type === 'bomb' || event.type === 'rocket') bombs += 1;
  }

  return { turns, bombs, winner };
}
