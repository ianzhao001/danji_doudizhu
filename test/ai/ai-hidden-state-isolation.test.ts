import { describe, expect, it } from 'vitest';
import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import { GamePhase, type GameSnapshot, type TopPlay } from '../../assets/scripts/game';
import { createRng, recognize, validatePlay, type Card } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const LEVELS = [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard] as const;

function top(token: string): TopPlay {
  return { seat: 1, pattern: recognize(cards(token))! };
}

function snapshot(viewerHand: Card[], over: Partial<GameSnapshot> = {}): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [viewerHand.length, 12, 12],
    winner: null,
    viewerHand,
    ...over,
  };
}

const SNAPSHOTS: { name: string; snapshot: GameSnapshot }[] = [
  { name: 'free lead', snapshot: snapshot(cards('3 4 5 6 7 8 9')) },
  { name: 'follow single', snapshot: snapshot(cards('4 6 K A 2 x X'), { top: top('5') }) },
  { name: 'follow pair', snapshot: snapshot(cards('6 6 9 9 K K 2 2'), { top: top('5 5') }) },
  { name: 'bomb fallback', snapshot: snapshot(cards('7 7 7 7 9 K'), { top: top('A') }) },
];

function actionIsLegal(snapshot: GameSnapshot, action: ReturnType<ReturnType<typeof strategyFor>>): boolean {
  if (action.type === 'pass') return snapshot.top !== null && action.seat === snapshot.turn;
  if (action.seat !== snapshot.turn) return false;
  const result = validatePlay(action.cards, snapshot.top?.pattern ?? null);
  if (!result.ok) return false;
  return action.cards.every((card) =>
    (snapshot.viewerHand ?? []).some((handCard) => handCard.rank === card.rank && handCard.suit === card.suit),
  );
}

describe('M6-G14 AI hidden-state isolation', () => {
  for (const { name, snapshot: s } of SNAPSHOTS) {
    for (const level of LEVELS) {
      it(`${level} does not mutate snapshot and returns a legal action for ${name}`, () => {
        const before = structuredClone(s);
        const action = strategyFor(level)(s, createRng(42));

        expect(s).toEqual(before);
        expect(actionIsLegal(s, action)).toBe(true);
      });
    }
  }

  it('snapshots expose only hand counts for non-viewer seats', () => {
    for (const { snapshot: s } of SNAPSHOTS) {
      expect(s).not.toHaveProperty('seats');
      expect(s.handCounts).toHaveLength(3);
      expect(s.viewerHand).toBeDefined();
    }
  });
});
