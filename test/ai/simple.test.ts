/**
 * W-AI 修订版：Simple 档契约（规划者修订种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/ai/simple.test.ts，独立 seed commit（B2 棒）。
 *
 * ── 修订依据（用户裁决：全体上移一档）──
 *   新 Simple ≈ 旧 Normal：组合领出（chooseNormalLeadMove 风格）+ 队友让牌 + 保守跟牌，
 *   外加三道「不犯蠢」守卫：清手检测前置、不拆炸弹/火箭跟牌、仅剩炸弹可跟时不硬跟（除非清手）。
 *   旧「永远最小单」新手锚点随裁决废止（大厅难度文案同步改，data 定点解冻）。
 *
 * ── 预期红（对 main 现 Simple=pickSmallest）──
 *   ①组合领出红（旧出单3）；②清手红（旧出单3）；③不拆炸红（旧拆单4）；
 *   ④让牌红（旧压队友）。⑤⑥（pass/确定性）对旧实现即绿（回归性质）。
 *
 * ── 负向变异自证（执行者实现后自查，报告注明红几条）──
 *   ① Simple 回退 pickSmallest 领出 → ①② 红。
 *   ② 去掉炸弹保护 → ③ 红。
 */
import { describe, it, expect } from 'vitest';
import { strategyFor, AiLevel } from '../../assets/scripts/ai';
import { createRng, recognize, validatePlay, Category, Rank } from '../../assets/scripts/rules';
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

describe('W-AI Simple 档（全体上移：≈旧 Normal + 不犯蠢守卫）', () => {
  it('组合领出：3 3 4 4 5 5 K → 连对 334455（不再永远最小单）', () => {
    const a = simple(snap({ top: null, viewerHand: cards('3 3 4 4 5 5 K'), handCounts: [7, 7, 7] }), createRng(1));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      const pattern = recognize(a.cards);
      expect(a.cards).toHaveLength(6);
      expect(pattern?.category).toBe(Category.ConsecutivePairs);
    }
  });

  it('清手检测：3 4 5 6 7 整手顺子 → 一手清完', () => {
    const a = simple(snap({ top: null, viewerHand: cards('3 4 5 6 7'), handCounts: [5, 5, 5] }), createRng(2));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(5);
      expect(recognize(a.cards)?.category).toBe(Category.Straight);
    }
  });

  it('不拆炸弹：top=单3、手 5 4444 → 出 5（旧 Simple 拆单 4 的送分蠢已修）', () => {
    const top = single('3');
    const a = simple(snap({ top, viewerHand: cards('5 4 4 4 4'), handCounts: [5, 5, 5] }), createRng(3));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(1);
      expect(a.cards[0].rank).toBe(Rank.R5);
      expect(validatePlay(a.cards, top.pattern).ok).toBe(true);
    }
  });

  it('队友让牌：顶牌来自队友、地主手牌 >2 → pass（即便能压）', () => {
    const s = snap({
      turn: 1,
      landlord: 0,
      top: { seat: 2, pattern: recognize(cards('4 4'))! },
      viewerHand: cards('3 6 9 9'),
      handCounts: [10, 4, 4],
    });
    expect(simple(s, createRng(4)).type).toBe('pass');
  });

  it('要不起照旧 pass：top=单2、手 3 4 5', () => {
    const top = single('2');
    expect(simple(snap({ top, viewerHand: cards('3 4 5'), handCounts: [3, 5, 5] }), createRng(5)).type).toBe('pass');
  });

  it('确定性：与 rng 无关，多个种子结果一致', () => {
    const s = snap({ top: null, viewerHand: cards('3 3 4 4 5 5 K'), handCounts: [7, 7, 7] });
    expect(simple(s, createRng(999))).toEqual(simple(s, createRng(1)));
  });
});
