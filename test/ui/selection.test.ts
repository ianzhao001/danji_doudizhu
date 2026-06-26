/**
 * M3-00 失败测试：手牌选中模型（架构种入·不可改）。
 * 当前 selection.ts 为桩（throw not implemented）→ 应先红。
 */
import { describe, it, expect } from 'vitest';
import { isSelected, toggle, sortByRank, clearSelection } from '../../assets/scripts/ui/selection';
import { Rank, Suit } from '../../assets/scripts/rules';

const R3S = { rank: Rank.R3, suit: Suit.Spade };
const R3H = { rank: Rank.R3, suit: Suit.Heart };
const R5C = { rank: Rank.R5, suit: Suit.Club };
const Kd = { rank: Rank.K, suit: Suit.Diamond };
const bigJ = { rank: Rank.BigJoker, suit: Suit.Joker };

describe('M3-00 手牌选中模型', () => {
  it('toggle 不在则追加（长度+1、isSelected 真）；在则移除（长度−1、isSelected 假）', () => {
    let sel: typeof R3S[] = [];
    sel = toggle(sel, R3S);
    expect(sel).toHaveLength(1);
    expect(isSelected(sel, R3S)).toBe(true);
    sel = toggle(sel, R3S);
    expect(sel).toHaveLength(0);
    expect(isSelected(sel, R3S)).toBe(false);
  });

  it('toggle 不改动入参数组', () => {
    const original = [R3S];
    const frozen = [...original];
    toggle(original, R5C);
    expect(original).toEqual(frozen);
  });

  it('同点不同花视为不同牌（一张被选不影响另一张）', () => {
    let sel: typeof R3S[] = [];
    sel = toggle(sel, R3S);
    expect(isSelected(sel, R3H)).toBe(false);
    expect(isSelected(sel, R3S)).toBe(true);
  });

  it('sortByRank 升序、稳定、双王在末、返回新数组（入参不变）', () => {
    const input = [Kd, R3H, R3S, R5C, bigJ];
    const sorted = sortByRank(input);
    // 升序：R3 在 R5 之前、R5 在 K 之前、大王末
    expect(sorted.map((c) => c.rank)).toEqual([Rank.R3, Rank.R3, Rank.R5, Rank.K, Rank.BigJoker]);
    // 稳定：两张 R3 保持原相对序（H 先入 → H 在前）
    expect(sorted[0]).toEqual(R3H);
    expect(sorted[1]).toEqual(R3S);
    // 入参不变
    expect(input).toEqual([Kd, R3H, R3S, R5C, bigJ]);
  });

  it('clearSelection() === []', () => {
    expect(clearSelection()).toEqual([]);
  });
});
