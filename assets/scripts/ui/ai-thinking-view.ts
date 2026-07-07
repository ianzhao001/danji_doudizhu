import type { SeatIndex } from '../game';

export interface AiThinkingView {
  active: boolean;
  seat: SeatIndex | null;
  label: string;
  dots: number;
}

function seatName(seat: SeatIndex, heroSeat: SeatIndex): string {
  if (seat === heroSeat) return '我';
  const offset = (seat - heroSeat + 3) % 3;
  return offset === 1 ? 'AI 右家' : 'AI 左家';
}

export function deriveAiThinking(
  turn: SeatIndex,
  heroSeat: SeatIndex,
  phase: 'bidding' | 'playing' | 'settled',
  tickMs: number,
): AiThinkingView {
  const active = phase !== 'settled' && turn !== heroSeat;
  const dots = Math.floor(Math.max(0, tickMs) / 300) % 4;
  return {
    active,
    seat: active ? turn : null,
    label: active ? `${seatName(turn, heroSeat)}思考中` : '',
    dots,
  };
}
