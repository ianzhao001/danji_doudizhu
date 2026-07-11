import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AiLevel, adviseBestMove, strategyFor } from '../../assets/scripts/ai';
import { GamePhase, type GameSnapshot, type SeatIndex, type TopPlay } from '../../assets/scripts/game';
import { Category, enumerateMoves, legalFollows, recognize, validatePlay } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [7, 7, 7],
    winner: null,
    viewerHand: cards('3 4 5 6 7 9 K'),
    ...over,
  };
}

function topPlay(seat: SeatIndex, spec: string): TopPlay {
  return { seat, pattern: recognize(cards(spec))! };
}

describe('T-HINT-SMART adviseBestMove（AI 最优推荐·不作弊）', () => {
  it('lead 回合推荐恒合法（属 enumerateMoves 且 validatePlay 通过）', () => {
    const s = snap({});
    const advised = adviseBestMove({ snapshot: s });
    expect(advised).not.toBeNull();
    expect(validatePlay(advised!.cards, null).ok).toBe(true);
    const legalKeys = new Set(
      enumerateMoves(s.viewerHand!).map((m) => m.cards.map((c) => `${c.rank}:${c.suit}`).sort().join('|')),
    );
    expect(legalKeys.has(advised!.cards.map((c) => `${c.rank}:${c.suit}`).sort().join('|'))).toBe(true);
  });

  it('跟牌回合推荐恒合法（属 legalFollows）', () => {
    const s = snap({ top: topPlay(1, '8'), viewerHand: cards('9 J A 2 2') });
    const advised = adviseBestMove({ snapshot: s });
    expect(advised).not.toBeNull();
    expect(validatePlay(advised!.cards, s.top!.pattern).ok).toBe(true);
    const legalKeys = new Set(
      legalFollows(s.viewerHand!, s.top!.pattern).map((m) => m.cards.map((c) => `${c.rank}:${c.suit}`).sort().join('|')),
    );
    expect(legalKeys.has(advised!.cards.map((c) => `${c.rank}:${c.suit}`).sort().join('|'))).toBe(true);
  });

  it('确定性：同快照同历史两次调用逐字段相等', () => {
    const s = snap({ top: topPlay(2, '6 6'), viewerHand: cards('7 7 9 9 K A 2') });
    const a = adviseBestMove({ snapshot: s, history: [] });
    const b = adviseBestMove({ snapshot: s, history: [] });
    expect(a).toEqual(b);
  });

  it('与 hard 档策略委托一致（推荐即 AI 同款决策）', () => {
    const s = snap({ top: topPlay(1, '5 5'), viewerHand: cards('6 6 8 8 J Q 2') });
    const advised = adviseBestMove({ snapshot: s });
    const action = strategyFor(AiLevel.Hard)(s, { next: () => 0 }, []);
    expect(action.type).toBe('play');
    expect(advised!.cards).toEqual(action.type === 'play' ? action.cards : []);
  });

  it('质量钉：单张可压时不拆炸弹', () => {
    const s = snap({ top: topPlay(1, 'K'), viewerHand: cards('3 3 3 3 A') });
    const advised = adviseBestMove({ snapshot: s });
    expect(advised).not.toBeNull();
    expect(advised!.pattern.category).toBe(Category.Single);
    expect(advised!.cards).toHaveLength(1);
  });

  it('质量钉：终局可一手走完时推荐清手', () => {
    const s = snap({ viewerHand: cards('7 7'), handCounts: [2, 5, 5] });
    const advised = adviseBestMove({ snapshot: s });
    expect(advised).not.toBeNull();
    expect(advised!.cards).toHaveLength(2);
    expect(advised!.pattern.category).toBe(Category.Pair);
  });

  it('要不起（无合法跟牌）返回 null', () => {
    const s = snap({ top: topPlay(1, 'K K'), viewerHand: cards('3 4') });
    expect(adviseBestMove({ snapshot: s })).toBeNull();
  });

  it('对局结束 / 非 viewer 回合 / 无手牌均返回 null', () => {
    expect(adviseBestMove({ snapshot: snap({ winner: 'landlord' as GameSnapshot['winner'] }) })).toBeNull();
    expect(adviseBestMove({ snapshot: snap({ turn: 1 }) })).toBeNull();
    expect(adviseBestMove({ snapshot: snap({ viewerHand: [] }) })).toBeNull();
    expect(adviseBestMove({ snapshot: snap({ viewerHand: undefined }) })).toBeNull();
  });

  it('护栏：ai/hint.ts 零 cc import', () => {
    const src = readFileSync(resolve(__dirname, '../../assets/scripts/ai/hint.ts'), 'utf8');
    expect(src.includes("from 'cc'")).toBe(false);
  });
});
