import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { nextHint, hintSuggestions } from '../../assets/scripts/ai/hint';
import { Category, Rank, recognize, validatePlay } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

describe('M4-20 提示建议', () => {
  it('领出时枚举建议并把小的非炸弹放在前面', () => {
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

  it('无合法出牌时返回空建议，nextHint 返回 null', () => {
    const current = recognize(cards('A A'))!;
    const hand = cards('5 9 2');

    expect(hintSuggestions(hand, current)).toEqual([]);
    expect(nextHint(hand, current)).toBeNull();
  });

  it('nextHint 缺省取首项，随后遍历并回绕', () => {
    const hand = cards('3 4');
    const first = nextHint(hand, null)!;
    const second = nextHint(hand, null, first.cards)!;
    const wrapped = nextHint(hand, null, second.cards)!;

    expect(first.pattern.mainRank).toBe(Rank.R3);
    expect(second.pattern.mainRank).toBe(Rank.R4);
    expect(wrapped).toEqual(first);
  });

  it('prev 未命中时回到首项', () => {
    const hand = cards('3 4');
    const first = nextHint(hand, null)!;

    expect(nextHint(hand, null, cards('9'))).toEqual(first);
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

  it('hint 模块不 import bidding 域', () => {
    const source = readFileSync(new URL('../../assets/scripts/ai/hint.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/from ['"].*bidding/);
  });
});
