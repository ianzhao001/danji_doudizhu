/**
 * 验证困难档的压制领出、残局收割与资源保留时机。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import { Rank, createRng, recognize } from '../../assets/scripts/rules';
import { GamePhase, type GameSnapshot, type SeatIndex, type TopPlay } from '../../assets/scripts/game';
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
    viewerHand: cards('3 4 5'),
    ...over,
  };
}

const topFrom = (seat: SeatIndex, spec: string): TopPlay => ({ seat, pattern: recognize(cards(spec))! });

describe('T-AI-2 pressing 领出压制', () => {
  it('对手仅剩 1 张、手有对子 → 领对子封锁（1 张手压不了对子）', () => {
    const a = hard(snap({ viewerHand: cards('3 3 9 9 K'), handCounts: [5, 1, 5] }), createRng(1));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(2);
      expect(a.cards[0].rank).toBe(a.cards[1].rank);
    }
  });
});

describe('T-AI-2 残局收割（≤2 墩清空选控制牌）', () => {
  it('手牌 A A 2 跟单 9 → 出 2 夺权（随后 AA 收官），不出最小 A', () => {
    const s = snap({
      turn: 0,
      landlord: 0,
      top: topFrom(1, '9'),
      viewerHand: cards('A A 2'),
      handCounts: [3, 8, 8],
    });
    const a = hard(s, createRng(2));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(1);
      expect(a.cards[0].rank).toBe(Rank.R2);
    }
  });
});

describe('T-AI-2 不挥霍守卫（回归锁定）', () => {
  it('非 pressing、手牌 >6、有普通可压 → 出最小单不拆炸弹', () => {
    const s = snap({
      turn: 0,
      landlord: 0,
      top: topFrom(1, '4'),
      viewerHand: cards('5 8 8 8 8 9 K'),
      handCounts: [7, 8, 8],
    });
    const a = hard(s, createRng(3));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(1);
      expect(a.cards[0].rank).toBe(Rank.R5);
    }
  });

  it('确定性：以上决策与 rng 无关', () => {
    const s = snap({ viewerHand: cards('3 3 9 9 K'), handCounts: [5, 1, 5] });
    expect(hard(s, createRng(9))).toEqual(hard(s, createRng(1)));
  });
});
