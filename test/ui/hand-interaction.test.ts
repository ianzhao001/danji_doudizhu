/**
 * M3-00 失败测试：手牌交互桥（架构种入·不可改）。当前 hand-interaction.ts 为桩 → 应先红。
 */
import { describe, it, expect } from 'vitest';
import { layoutHandInteractive } from '../../assets/scripts/ui/hand-interaction';
import { layoutHand } from '../../assets/scripts/ui/hand-layout';
import { Rank, Suit, type Card } from '../../assets/scripts/rules';

const W = 390;
const cardWidth = 60;

describe('M3-00 手牌交互桥', () => {
  it('输出长度===hand.length；x 与 layoutHand(排序后) 一一对应', () => {
    const hand: Card[] = [
      { rank: Rank.K, suit: Suit.Spade },
      { rank: Rank.R3, suit: Suit.Heart },
      { rank: Rank.R5, suit: Suit.Club },
    ];
    const slots = layoutHandInteractive({ hand, selected: [], containerWidth: W, cardWidth, liftOffset: 20 });
    expect(slots).toHaveLength(3);
    // 排序后应为 R3,R5,K；其 x 应等于 layoutHand(3,...) 的顺序
    const base = layoutHand(3, { containerWidth: W, cardWidth });
    expect(slots.map((s) => s.x)).toEqual(base.map((s) => s.x));
    expect(slots.map((s) => s.card.rank)).toEqual([Rank.R3, Rank.R5, Rank.K]);
  });

  it('选中的牌 y===-liftOffset、selected===true；未选 y===0', () => {
    const hand: Card[] = [
      { rank: Rank.R3, suit: Suit.Spade },
      { rank: Rank.R5, suit: Suit.Heart },
    ];
    const selected: Card[] = [{ rank: Rank.R3, suit: Suit.Spade }];
    const slots = layoutHandInteractive({ hand, selected, containerWidth: W, cardWidth, liftOffset: 15 });
    const r3 = slots.find((s) => s.card.rank === Rank.R3 && s.card.suit === Suit.Spade)!;
    const r5 = slots.find((s) => s.card.rank === Rank.R5 && s.card.suit === Suit.Heart)!;
    expect(r3.selected).toBe(true);
    expect(r3.y).toBe(-15);
    expect(r5.selected).toBe(false);
    expect(r5.y).toBe(0);
  });

  it('同点不同花：选中一张不影响另一张的 selected', () => {
    const hand: Card[] = [
      { rank: Rank.R3, suit: Suit.Spade },
      { rank: Rank.R3, suit: Suit.Heart },
    ];
    const selected: Card[] = [{ rank: Rank.R3, suit: Suit.Spade }];
    const slots = layoutHandInteractive({ hand, selected, containerWidth: W, cardWidth, liftOffset: 10 });
    const spade = slots.find((s) => s.card.suit === Suit.Spade)!;
    const heart = slots.find((s) => s.card.suit === Suit.Heart)!;
    expect(spade.selected).toBe(true);
    expect(heart.selected).toBe(false);
  });

  it('入参 hand/selected 不被改动', () => {
    const hand: Card[] = [{ rank: Rank.R3, suit: Suit.Spade }];
    const selected: Card[] = [];
    const handFrozen = [...hand];
    const selFrozen = [...selected];
    layoutHandInteractive({ hand, selected, containerWidth: W, cardWidth, liftOffset: 10 });
    expect(hand).toEqual(handFrozen);
    expect(selected).toEqual(selFrozen);
  });
});
