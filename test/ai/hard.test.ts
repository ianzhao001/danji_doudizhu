import { describe, it, expect } from 'vitest';
import { strategyFor, AiLevel } from '../../assets/scripts/ai';
import { createRng, recognize, Rank } from '../../assets/scripts/rules';
import { GamePhase, type GameSnapshot, type TopPlay } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const hard = strategyFor(AiLevel.Hard);

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [5, 5, 5],
    winner: null,
    viewerHand: cards('6 4 4 4 4'),
    ...over,
  };
}

const oppSingle = (token: string): TopPlay => ({ seat: 1 as const, pattern: recognize(cards(token))! });

describe('M4-03 hard AI（积极控权 + 择时炸弹·确定性）', () => {
  it('对手剩 1 张、top 为其小牌、自持炸弹 → 出炸弹压制', () => {
    const top = oppSingle('3');
    const a = hard(snap({ top, viewerHand: cards('6 4 4 4 4'), handCounts: [5, 1, 3] }), createRng(1));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(4);
      expect(a.cards.every((c) => c.rank === Rank.R4)).toBe(true);
    }
  });

  it('对手手牌都多（>2）→ 走保炸弹策略，出单 6 不动炸弹', () => {
    const top = oppSingle('3');
    const a = hard(snap({ top, viewerHand: cards('6 4 4 4 4'), handCounts: [5, 5, 5] }), createRng(2));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(1);
      expect(a.cards[0].rank).toBe(Rank.R6);
    }
  });

  it('确定性：与 rng 无关，多个种子结果一致', () => {
    const s = snap({ top: oppSingle('3'), viewerHand: cards('6 4 4 4 4'), handCounts: [5, 1, 3] });
    expect(hard(s, createRng(7))).toEqual(hard(s, createRng(1)));
  });
});
