import { Category, RANK_LABEL, Rank } from '../rules';
import type { GameEvent, SeatIndex } from '../game';

export interface SeatLastAction {
  seat: SeatIndex;
  text: string;
}

type DisplayEvent = Extract<GameEvent, { type: 'play' | 'pass' | 'bomb' | 'rocket' }>;

const SEATS: SeatIndex[] = [0, 1, 2];

function rankLabel(rank: Rank): string {
  if (rank === Rank.SmallJoker) return '小王';
  if (rank === Rank.BigJoker) return '大王';
  return RANK_LABEL[rank];
}

function playText(event: Extract<GameEvent, { type: 'play' }>): string {
  const label = rankLabel(event.pattern.mainRank);
  switch (event.pattern.category) {
    case Category.Single:
      return `出 ${label}`;
    case Category.Pair:
      return `出 一对${label}`;
    case Category.Trips:
      return `出 三张${label}`;
    case Category.TripsSingle:
      return `出 三带一${label}`;
    case Category.TripsPair:
      return `出 三带二${label}`;
    case Category.Straight:
      return `出 顺子到${label}`;
    case Category.ConsecutivePairs:
      return `出 连对到${label}`;
    case Category.Airplane:
    case Category.AirplaneSingles:
    case Category.AirplanePairs:
      return `出 飞机到${label}`;
    case Category.FourPlusTwoSingles:
    case Category.FourPlusTwoPairs:
      return `出 四带二${label}`;
    case Category.Bomb:
      return '炸弹';
    case Category.Rocket:
      return '火箭';
  }
}

function textFor(event: DisplayEvent): string {
  if (event.type === 'pass') return '不要';
  if (event.type === 'bomb') return '炸弹';
  if (event.type === 'rocket') return '火箭';
  return playText(event);
}

export function deriveLastActions(recentEvents: GameEvent[]): SeatLastAction[] {
  const latest = new Map<SeatIndex, string>();
  for (const event of recentEvents) {
    if (event.type === 'reset' || event.type === 'win') continue;
    latest.set(event.seat, textFor(event));
  }

  return SEATS.map((seat) => ({ seat, text: latest.get(seat) ?? '—' }));
}
