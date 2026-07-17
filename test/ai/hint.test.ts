/**
 * W-AI-R2 修订版：提示枚举器契约（规划者修订种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/ai/hint.test.ts，独立 seed commit（R2a 棒）。
 *
 * ── 修订依据（玩家打回证据②整改）──
 *   「小到大轮一圈」轮换语义废除：`nextHint` **退役删除**（新轮换=AI 榜单内回绕，契约在
 *   hint-delegation/hint-session）；`hintSuggestions` **降级为内部候选枚举器**——保留其
 *   枚举完备性/合法性/确定性/稳定序契约（rankHintCandidates 的候选流依赖稳定序），
 *   不再承诺任何面向玩家的轮换语义。旧 nextHint 三用例删除，其余逐字保留。
 *
 * ── 预期红（对 R2 基线 main）── 「nextHint 已退役」负向钉红（导出仍在）；其余全绿。
 * ── 负向变异自证（执行者实现后自查）──
 *   ① 恢复 export nextHint → 退役钉红。
 *   ② hintSuggestions 排序改随机/不稳定 → 确定性用例红。
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hintSuggestions } from '../../assets/scripts/ai/hint';
import { Category, Rank, recognize, validatePlay } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

describe('M4-20 提示候选枚举器（W-AI-R2 降级契约）', () => {
  it('领出时枚举建议并把小的非炸弹放在前面（稳定序）', () => {
    const moves = hintSuggestions(cards('3 3 4 5 5'), null);

    expect(moves.length).toBeGreaterThan(0);
    expect(moves[0].pattern.category).toBe(Category.Single);
    expect(moves[0].pattern.mainRank).toBe(Rank.R3);
  });

  it('炸弹和火箭排在非炸弹后面', () => {
    const moves = hintSuggestions(cards('3 3 3 3 4 5 x X'), null);
    const firstBombLikeIndex = moves.findIndex(
      (move) => move.pattern.category === Category.Bomb || move.pattern.category === Category.Rocket,
    );

    expect(firstBombLikeIndex).toBeGreaterThan(0);
    expect(moves.slice(0, firstBombLikeIndex).every((move) => (
      move.pattern.category !== Category.Bomb && move.pattern.category !== Category.Rocket
    ))).toBe(true);
  });

  it('跟牌只返回能压过当前牌的建议', () => {
    const current = recognize(cards('A'))!;
    const moves = hintSuggestions(cards('5 9 2'), current);

    expect(moves.map((move) => move.pattern.mainRank)).toEqual([Rank.R2]);
    expect(moves.every((move) => validatePlay(move.cards, current).ok)).toBe(true);
  });

  it('无合法出牌时返回空建议', () => {
    const current = recognize(cards('A A'))!;
    const hand = cards('5 9 2');

    expect(hintSuggestions(hand, current)).toEqual([]);
  });

  it('同参调用确定且不修改手牌', () => {
    const hand = cards('3 3 4 5 5');
    const before = structuredClone(hand);

    expect(hintSuggestions(hand, null)).toEqual(hintSuggestions(hand, null));
    expect(hand).toEqual(before);
  });

  it('所有建议都能通过 validatePlay', () => {
    const freeMoves = hintSuggestions(cards('3 3 4 5 5'), null);
    expect(freeMoves.every((move) => validatePlay(move.cards, null).ok)).toBe(true);

    const current = recognize(cards('A'))!;
    const followMoves = hintSuggestions(cards('5 9 2'), current);
    expect(followMoves.every((move) => validatePlay(move.cards, current).ok)).toBe(true);
  });

  it('W-AI-R2 退役钉：nextHint 不复存在（轮换语义已迁往榜单会话）', () => {
    const source = readFileSync(new URL('../../assets/scripts/ai/hint.ts', import.meta.url), 'utf8');
    expect(source, '「小到大轮一圈」不得复辟').not.toContain('export function nextHint');
    expect(source, '模块内也不得保留同名死函数').not.toContain('function nextHint(');
  });

  it('hint 模块不 import bidding 域', () => {
    const source = readFileSync(new URL('../../assets/scripts/ai/hint.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/from ['"].*bidding/);
  });
});
