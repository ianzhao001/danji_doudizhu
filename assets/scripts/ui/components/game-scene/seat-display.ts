import type { SeatIndex } from '../../../game';
import type { Rect } from '../../table-layout';
import type { TableZones } from '../../table-zones';

export type SeatVisualSide = 'hero' | 'left' | 'right';

export function seatDisplayName(seat: number): string {
  if (seat === 0) return '你';
  if (seat === 1) return '右家';
  if (seat === 2) return '左家';
  return `座位${seat + 1}`;
}

export function visualSideForSeat(seat: SeatIndex): SeatVisualSide {
  if (seat === 0) return 'hero';
  return seat === 1 ? 'right' : 'left';
}

export function dropZoneForSeat(layout: TableZones, seat: SeatIndex): Rect {
  const side = visualSideForSeat(seat);
  if (side === 'left') return layout.dropZoneLeft;
  if (side === 'right') return layout.dropZoneRight;
  return layout.dropZoneHero;
}
