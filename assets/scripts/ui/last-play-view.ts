import type { Card } from '../rules';
import type { GameEvent, SeatIndex } from '../game';
import { deriveLastActions } from './last-action-view';

export interface SeatLastPlay {
  seat: SeatIndex;
  kind: 'play' | 'pass' | null;
  cards: Card[];
  emphasis: 'bomb' | 'rocket' | null;
  text: string;
}

const SEATS: SeatIndex[] = [0, 1, 2];

type SeatState = {
  kind: 'play' | 'pass';
  cards: Card[];
  emphasis: 'bomb' | 'rocket' | null;
};

export function deriveLastPlays(recentEvents: GameEvent[]): SeatLastPlay[] {
  const bySeat = new Map<SeatIndex, SeatState>();

  for (const event of recentEvents) {
    if (event.type === 'win') continue;
    if (event.type === 'reset') {
      bySeat.clear();
      continue;
    }
    if (event.type === 'play') {
      bySeat.set(event.seat, {
        kind: 'play',
        cards: event.pattern.cards,
        emphasis: null,
      });
      continue;
    }
    if (event.type === 'pass') {
      bySeat.set(event.seat, { kind: 'pass', cards: [], emphasis: null });
      continue;
    }
    if (event.type === 'bomb' || event.type === 'rocket') {
      const current = bySeat.get(event.seat);
      if (current?.kind === 'play') {
        current.emphasis = event.type === 'bomb' ? 'bomb' : 'rocket';
      }
    }
  }

  const actionTexts = deriveLastActions(recentEvents);

  return SEATS.map((seat) => {
    const state = bySeat.get(seat);
    if (!state) {
      return { seat, kind: null, cards: [], emphasis: null, text: '—' };
    }
    const textRow = actionTexts.find((row) => row.seat === seat);
    return {
      seat,
      kind: state.kind,
      cards: state.kind === 'play' ? state.cards : [],
      emphasis: state.kind === 'play' ? state.emphasis : null,
      text: textRow?.text ?? '—',
    };
  });
}
