/**
 * M3-00 失败测试：牌面视图模型（架构种入·不可改）。当前 card-view.ts 为桩 → 应先红。
 */
import { describe, it, expect } from 'vitest';
import { cardView, cardsView } from '../../assets/scripts/ui/card-view';
import { Rank, Suit, RANK_LABEL } from '../../assets/scripts/rules';

describe('M3-00 牌面视图模型', () => {
  it('cardView 各字段：sortKey===rank、rankLabel 与 RANK_LABEL 一致', () => {
    const c = { rank: Rank.R7, suit: Suit.Heart };
    const v = cardView(c);
    expect(v.sortKey).toBe(Rank.R7);
    expect(v.rankLabel).toBe(RANK_LABEL[Rank.R7]);
    expect(v.suitKey).toBe(Suit.Heart);
    expect(typeof v.assetKey).toBe('string');
    expect(v.assetKey.length).toBeGreaterThan(0);
  });

  it('assetKey 唯一到牌（同 rank 不同 suit 不同）、确定性（同牌相同）', () => {
    const a = cardView({ rank: Rank.R7, suit: Suit.Spade });
    const b = cardView({ rank: Rank.R7, suit: Suit.Heart });
    expect(a.assetKey).not.toBe(b.assetKey);
    expect(cardView({ rank: Rank.R7, suit: Suit.Spade }).assetKey).toBe(a.assetKey);
  });

  it('双王：suitKey===joker、rankLabel 为王文案', () => {
    expect(cardView({ rank: Rank.SmallJoker, suit: Suit.Joker }).suitKey).toBe('joker');
    expect(cardView({ rank: Rank.BigJoker, suit: Suit.Joker }).suitKey).toBe('joker');
  });

  it('cardsView 长度等同入参、保持顺序、入参不变', () => {
    const input = [{ rank: Rank.R3, suit: Suit.Spade }, { rank: Rank.R5, suit: Suit.Heart }];
    const frozen = [...input];
    const views = cardsView(input);
    expect(views).toHaveLength(2);
    expect(views[0].sortKey).toBe(Rank.R3);
    expect(views[1].sortKey).toBe(Rank.R5);
    expect(input).toEqual(frozen);
  });
});
