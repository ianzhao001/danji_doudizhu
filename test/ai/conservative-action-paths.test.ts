import { describe, expect, it } from 'vitest';

import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import { GamePhase, type GameSnapshot, type TopPlay } from '../../assets/scripts/game';
import { Category, createRng, Rank, recognize, validatePlay } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const normal = strategyFor(AiLevel.Normal);
const hard = strategyFor(AiLevel.Hard);

const single = (spec: string): TopPlay => ({ seat: 1, pattern: recognize(cards(spec))! });

function snap(overrides: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [5, 5, 5],
    winner: null,
    viewerHand: cards('3 4 5'),
    ...overrides,
  };
}

function expectLegalPlay(snapshot: GameSnapshot, action: ReturnType<typeof normal>): void {
  expect(action.type).toBe('play');
  if (action.type === 'play') {
    expect(validatePlay(action.cards, snapshot.top?.pattern ?? null).ok).toBe(true);
  }
}

describe('conservative AI action paths', () => {
  it('normal follow avoids splitting bombs when a safe single can follow', () => {
    const snapshot = snap({ top: single('3'), viewerHand: cards('3 3 3 3 5 9'), handCounts: [6, 5, 5] });
    const action = normal(snapshot, createRng(1));

    expectLegalPlay(snapshot, action);
    if (action.type === 'play') {
      expect(action.cards).toHaveLength(1);
      expect(action.cards[0].rank).toBe(Rank.R5);
      expect(action.cards.some((card) => card.rank === Rank.R3)).toBe(false);
    }
  });

  it('hard free lead plays a finishing bomb when only the bomb remains', () => {
    const snapshot = snap({ top: null, viewerHand: cards('3 3 3 3'), handCounts: [4, 5, 5] });
    const action = hard(snapshot, createRng(2));

    expectLegalPlay(snapshot, action);
    if (action.type === 'play') {
      const pattern = recognize(action.cards);
      expect(action.cards).toHaveLength(4);
      expect(pattern?.category).toBe(Category.Bomb);
    }
  });

  it('hard pressing boundary uses <= 2 opponent cards for largest follow', () => {
    const pressing = snap({ top: single('3'), viewerHand: cards('5 9 K'), handCounts: [3, 2, 3] });
    const relaxed = snap({ top: single('3'), viewerHand: cards('5 9 K'), handCounts: [3, 3, 3] });

    const pressingAction = hard(pressing, createRng(3));
    const relaxedAction = hard(relaxed, createRng(3));

    expectLegalPlay(pressing, pressingAction);
    expectLegalPlay(relaxed, relaxedAction);
    if (pressingAction.type === 'play' && relaxedAction.type === 'play') {
      expect(pressingAction.cards).toHaveLength(1);
      expect(relaxedAction.cards).toHaveLength(1);
      expect(pressingAction.cards[0].rank).toBe(Rank.K);
      expect(relaxedAction.cards[0].rank).toBe(Rank.R5);
      expect(pressingAction.cards).not.toEqual(relaxedAction.cards);
    }
  });
});
