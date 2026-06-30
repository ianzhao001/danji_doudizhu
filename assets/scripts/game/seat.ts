import { isHandPattern, isRecord } from '../rules/guards';
import { Side, type GameEvent, type SeatIndex } from './types';

export function isSeat(value: unknown): value is SeatIndex {
  return value === 0 || value === 1 || value === 2;
}

export function nextSeat(seat: SeatIndex): SeatIndex {
  return ((seat + 1) % 3) as SeatIndex;
}

export function isGameEvent(value: unknown): value is GameEvent {
  if (!isRecord(value) || typeof value.type !== 'string') return false;
  switch (value.type) {
    case 'play':
      return isSeat(value.seat) && isHandPattern(value.pattern);
    case 'pass':
    case 'bomb':
    case 'rocket':
      return isSeat(value.seat);
    case 'reset':
      return isSeat(value.leader);
    case 'win':
      return isSeat(value.seat) && (value.side === Side.Landlord || value.side === Side.Farmer);
    default:
      return false;
  }
}
