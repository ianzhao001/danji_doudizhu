import { describe, it, expect } from 'vitest';
import { strategyFor, AiLevel } from '../../assets/scripts/ai';
import { createRng, recognize, Rank } from '../../assets/scripts/rules';
import { GamePhase, type GameSnapshot, type TopPlay } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const normal = strategyFor(AiLevel.Normal);

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

describe('M4-02 normal AI（保炸弹 + 基础拆牌·确定性）', () => {
  it('领出 3 4 4 4 4 → 出单 3（不拆炸弹 4444）', () => {
    const a = normal(snap({ top: null, viewerHand: cards('3 4 4 4 4'), handCounts: [5, 5, 5] }), createRng(1));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(1);
      expect(a.cards[0].rank).toBe(Rank.R3);
    }
  });

  it('跟牌 top=单3、手牌 5 4 4 4 4 → 出单 5（不拆炸弹，避开拆牌单 4）', () => {
    const top = single('3');
    const a = normal(snap({ top, viewerHand: cards('5 4 4 4 4'), handCounts: [5, 5, 5] }), createRng(2));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(1);
      expect(a.cards[0].rank).toBe(Rank.R5);
    }
  });

  it('跟牌 top=单3、手牌仅 4 4 4 4（出完即胜）→ 出炸弹 4444', () => {
    const top = single('3');
    const a = normal(snap({ top, viewerHand: cards('4 4 4 4'), handCounts: [4, 5, 5] }), createRng(3));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(4);
      expect(a.cards.every((c) => c.rank === Rank.R4)).toBe(true);
    }
  });

  it('确定性：与 rng 无关，多个种子结果一致', () => {
    const s = snap({ top: null, viewerHand: cards('3 4 4 4 4'), handCounts: [5, 5, 5] });
    expect(normal(s, createRng(7))).toEqual(normal(s, createRng(1)));
  });
});
