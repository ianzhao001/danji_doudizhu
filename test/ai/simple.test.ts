import { describe, it, expect } from 'vitest';
import { strategyFor, AiLevel } from '../../assets/scripts/ai';
import { createRng, recognize, validatePlay, Rank } from '../../assets/scripts/rules';
import { GamePhase, type GameSnapshot, type TopPlay } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const simple = strategyFor(AiLevel.Simple);

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [5, 5, 5],
    winner: null,
    viewerHand: cards('3 4 5 6 7'),
    ...over,
  };
}

const single = (token: string): TopPlay => ({ seat: 1 as const, pattern: recognize(cards(token))! });

describe('M4-01 simple AI（最小化·确定性）', () => {
  it('领出 3 4 5 6 7 → 出最小单张 3', () => {
    const a = simple(snap({ top: null, viewerHand: cards('3 4 5 6 7'), handCounts: [5, 5, 5] }), createRng(1));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.seat).toBe(0);
      expect(a.cards).toHaveLength(1);
      expect(a.cards[0].rank).toBe(Rank.R3);
    }
  });

  it('跟牌 top=单5、手牌 4 6 K → 出最小能压者 6', () => {
    const top = single('5');
    const a = simple(snap({ top, viewerHand: cards('4 6 K'), handCounts: [3, 5, 5] }), createRng(2));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(1);
      expect(a.cards[0].rank).toBe(Rank.R6);
      expect(validatePlay(a.cards, top.pattern).ok).toBe(true);
    }
  });

  it('跟牌 top=单2、手牌 3 4 5 无可压 → pass', () => {
    const top = single('2');
    const a = simple(snap({ top, viewerHand: cards('3 4 5'), handCounts: [3, 5, 5] }), createRng(3));
    expect(a.type).toBe('pass');
  });

  it('确定性：与 rng 无关，多个种子结果一致', () => {
    const s = snap({ top: null, viewerHand: cards('3 4 5 6 7'), handCounts: [5, 5, 5] });
    expect(simple(s, createRng(999))).toEqual(simple(s, createRng(1)));
  });
});
