import { describe, it, expect } from 'vitest';
import { strategyFor, AiLevel } from '../../assets/scripts/ai';
import { createRng, recognize, Rank } from '../../assets/scripts/rules';
import { GamePhase, type GameSnapshot, type TopPlay } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const hard = strategyFor(AiLevel.Hard);
const normal = strategyFor(AiLevel.Normal);

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

const oppSingle = (token: string): TopPlay => ({ seat: 1 as const, pattern: recognize(cards(token))! });

describe('M4-05 hard 大牌压制（跟牌积极抢权 + 领出保守）', () => {
  it('pressing 跟牌无炸弹 → 出最大可压单 K（对照 normal 出最小单 5）', () => {
    const s = snap({ top: oppSingle('3'), viewerHand: cards('5 9 K'), handCounts: [3, 1, 3] });
    const a = hard(s, createRng(1));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(1);
      expect(a.cards[0].rank).toBe(Rank.K);
    }
    // 对照：同局 normal 维持保守，出最小单 5（凸显 hard 跟牌抢权差异）
    const n = normal(s, createRng(1));
    expect(n.type).toBe('play');
    if (n.type === 'play') expect(n.cards[0].rank).toBe(Rank.R5);
  });

  // T-AI-2 契约改写（规划者·2026-07-04）：对手仅剩 1 张时不再「保守送低单」——低单等于送对手走人。
  // 无对子可封时领最大单压制（K）。原「仍出最小单 3」契约随 T-AI-2 废止。
  it('pressing 领出无炸弹无对子 → 领最大单 K 压制（不送低单）', () => {
    const a = hard(snap({ top: null, viewerHand: cards('3 4 5 9 K'), handCounts: [5, 1, 3] }), createRng(2));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(1);
      expect(a.cards[0].rank).toBe(Rank.K);
    }
  });

  it('确定性：pressing 跟牌结果与 rng 无关', () => {
    const s = snap({ top: oppSingle('3'), viewerHand: cards('5 9 K'), handCounts: [3, 1, 3] });
    expect(hard(s, createRng(9))).toEqual(hard(s, createRng(1)));
  });
});

describe('M4-05 normal 火箭保护（回归锁定）', () => {
  it('领出 x X 3 4 5 → 出单 3（不拆火箭）', () => {
    const a = normal(snap({ top: null, viewerHand: cards('x X 3 4 5'), handCounts: [5, 5, 5] }), createRng(3));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(1);
      expect(a.cards[0].rank).toBe(Rank.R3);
    }
  });
});
