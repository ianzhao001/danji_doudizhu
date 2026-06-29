import { describe, expect, it } from 'vitest';
import {
  Category,
  Rank,
  Suit,
  type Card,
  type HandPattern,
} from '../../assets/scripts/rules';
import { Side, type GameEvent } from '../../assets/scripts/game';
import { deriveLastActions } from '../../assets/scripts/ui/last-action-view';

function c(rank: Rank, suit: Suit = Suit.Spade): Card {
  return { rank, suit: rank >= Rank.SmallJoker ? Suit.Joker : suit };
}

function pattern(category: Category, cards: Card[], mainRank = cards[0].rank): HandPattern {
  return { category, mainRank, length: cards.length, cards };
}

describe('deriveLastActions', () => {
  it('returns three empty seat rows when no action exists', () => {
    expect(deriveLastActions([])).toEqual([
      { seat: 0, text: '—' },
      { seat: 1, text: '—' },
      { seat: 2, text: '—' },
    ]);
  });

  it('tracks each seat latest display action', () => {
    const events: GameEvent[] = [
      { type: 'play', seat: 0, pattern: pattern(Category.Single, [c(Rank.K)]) },
      { type: 'pass', seat: 1 },
      { type: 'play', seat: 0, pattern: pattern(Category.Pair, [c(Rank.A), c(Rank.A, Suit.Heart)], Rank.A) },
    ];

    expect(deriveLastActions(events)).toEqual([
      { seat: 0, text: '出 一对A' },
      { seat: 1, text: '不要' },
      { seat: 2, text: '—' },
    ]);
  });

  it('formats bomb and rocket events', () => {
    const events: GameEvent[] = [
      { type: 'bomb', seat: 1 },
      { type: 'rocket', seat: 2 },
    ];

    expect(deriveLastActions(events).map((row) => row.text)).toEqual(['—', '炸弹', '火箭']);
  });

  it('ignores reset and win events', () => {
    const events: GameEvent[] = [
      { type: 'play', seat: 0, pattern: pattern(Category.Straight, [c(Rank.R3), c(Rank.R4), c(Rank.R5), c(Rank.R6), c(Rank.R7)], Rank.R7) },
      { type: 'reset', leader: 0 },
      { type: 'win', seat: 0, side: Side.Landlord },
    ];

    expect(deriveLastActions(events)[0].text).toBe('出 顺子到7');
  });
});
