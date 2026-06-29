import type { GameEvent, SeatIndex } from './types';

export interface ReplayPlay {
  seat: SeatIndex;
  kind: 'play' | 'pass' | 'bomb' | 'rocket';
}

export interface ReplayTrick {
  index: number;
  leader: SeatIndex;
  plays: ReplayPlay[];
  winnerSeat: SeatIndex | null;
}

interface MutableReplayTrick {
  leader: SeatIndex;
  plays: ReplayPlay[];
  winnerSeat: SeatIndex | null;
}

function toReplayTrick(trick: MutableReplayTrick, index: number): ReplayTrick {
  return {
    index,
    leader: trick.leader,
    plays: trick.plays.slice(),
    winnerSeat: trick.winnerSeat,
  };
}

export function buildTricks(events: GameEvent[]): ReplayTrick[] {
  const tricks: ReplayTrick[] = [];
  let current: MutableReplayTrick | null = null;
  let pendingLeader: SeatIndex | null = null;

  const ensureTrick = (leader: SeatIndex): MutableReplayTrick => {
    if (!current) current = { leader: pendingLeader ?? leader, plays: [], winnerSeat: null };
    pendingLeader = null;
    return current;
  };

  const closeCurrent = (winnerSeat: SeatIndex | null): void => {
    if (!current) return;
    current.winnerSeat = winnerSeat;
    tricks.push(toReplayTrick(current, tricks.length));
    current = null;
  };

  for (const event of events) {
    if (event.type === 'reset') {
      closeCurrent(event.leader);
      pendingLeader = event.leader;
      continue;
    }

    if (event.type === 'win') {
      ensureTrick(event.seat).winnerSeat = event.seat;
      closeCurrent(event.seat);
      continue;
    }

    const trick = ensureTrick(event.seat);
    trick.plays.push({ seat: event.seat, kind: event.type });
  }

  closeCurrent(null);
  return tricks;
}
