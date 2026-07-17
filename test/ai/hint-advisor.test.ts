/**
 * W-AI-R2 修订版：提示最优推荐 + 三态判别契约（规划者修订种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/ai/hint-advisor.test.ts，独立 seed commit（R2a 棒）。
 *
 * ── 修订依据 ──
 *   在既有 adviseBestMove 契约之上追加 `rankHintCandidates` 三态判别：
 *   · ranked：hints[0] ≡ adviseBestMove（委托钉延续）；
 *   · passAdvice：策略选择不出（含要不起）——玩家按提示必须有明确反馈，静默哑火废除；
 *   · none：对局结束/非本席回合/无手牌。
 *   其余 HINT_PIMC 委托/质量钉/护栏逐字保留。
 *
 * ── 预期红（对 R2 基线 main）── rankHintCandidates 未落 → 三态判别三用例红；其余绿。
 * ── 负向变异自证（执行者实现后自查）──
 *   ① passAdvice 分支并入 none → 判别用例红。
 *   ② hints[0] 改榜单第二项 → 委托一致用例红。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { adviseBestMove, rankHintCandidates } from '../../assets/scripts/ai';
import { hardStrategyWithProfile } from '../../assets/scripts/ai/levels/hard';
import { HINT_PIMC } from '../../assets/scripts/ai/pimc';
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

describe('T-HINT-SMART adviseBestMove + rankHintCandidates（W-AI-R2 三态判别）', () => {
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

  it('与 HINT_PIMC 档 hard 引擎委托一致（推荐即同引擎高预算档决策）', () => {
    const s = snap({ top: topPlay(1, '5 5'), viewerHand: cards('6 6 8 8 J Q 2') });
    const advised = adviseBestMove({ snapshot: s });
    const action = hardStrategyWithProfile(HINT_PIMC)(s, { next: () => 0 }, []);
    expect(action.type).toBe('play');
    expect(advised!.cards).toEqual(action.type === 'play' ? action.cards : []);
  });

  it('W-AI-R2 三态①：ranked 时 hints[0] ≡ adviseBestMove（委托钉上榜）', () => {
    const s = snap({});
    const ranked = rankHintCandidates({ snapshot: s, history: [] });
    const advised = adviseBestMove({ snapshot: s, history: [] });
    expect(ranked.kind).toBe('ranked');
    if (ranked.kind === 'ranked') {
      expect(ranked.hints.length).toBeGreaterThan(0);
      expect(ranked.hints.length).toBeLessThanOrEqual(6);
      expect(ranked.hints[0].move.cards).toEqual(advised!.cards);
    }
  });

  it('W-AI-R2 三态②：策略选择不出（仅剩炸弹可跟且对手不告急/要不起）→ passAdvice，绝不静默', () => {
    const bombOnly = snap({ top: topPlay(1, 'K'), viewerHand: cards('3 3 3 3 5'), handCounts: [5, 5, 5] });
    expect(adviseBestMove({ snapshot: bombOnly }), '前提自证：hard 保炸选择过牌').toBeNull();
    expect(rankHintCandidates({ snapshot: bombOnly, history: [] }).kind).toBe('passAdvice');

    const cannotBeat = snap({ top: topPlay(1, 'K K'), viewerHand: cards('3 4') });
    expect(rankHintCandidates({ snapshot: cannotBeat, history: [] }).kind).toBe('passAdvice');
  });

  it('W-AI-R2 三态③：对局结束/非本席回合/无手牌 → none', () => {
    expect(rankHintCandidates({ snapshot: snap({ winner: 'landlord' as GameSnapshot['winner'] }), history: [] }).kind).toBe('none');
    expect(rankHintCandidates({ snapshot: snap({ turn: 1 }), history: [] }).kind).toBe('none');
    expect(rankHintCandidates({ snapshot: snap({ viewerHand: [] }), history: [] }).kind).toBe('none');
    expect(rankHintCandidates({ snapshot: snap({ viewerHand: undefined }), history: [] }).kind).toBe('none');
  });

  it('壳源码钉：adviseBestMove 走 hardStrategyWithProfile(HINT_PIMC)，不再直调 hardStrategy', () => {
    const src = readFileSync(resolve(__dirname, '../../assets/scripts/ai/hint.ts'), 'utf8');
    expect(src).toContain('hardStrategyWithProfile(HINT_PIMC)');
    expect(src, '提示不得停留在 HARD_PIMC 低档').not.toContain('hardStrategy(snapshot');
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

  it('要不起（无合法跟牌）adviseBestMove 返回 null', () => {
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
