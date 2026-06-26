/**
 * M3-00 牌面视图模型（Card → 渲染键）。架构落桩——实现方实现函数体，使 test/ui/card-view.test.ts 转绿。
 * 规则见 coordination/tasks/M3-00-card-view-model.md。纯函数、确定性，禁止 import `cc`。
 * 复用 rules 的 Card/Rank/Suit/RANK_LABEL。
 */

import { type Card, Rank, Suit, RANK_LABEL } from '../rules';

export interface CardView {
  assetKey: string;
  rankLabel: string;
  suitKey: Suit | 'joker';
  sortKey: number;
}

export function cardView(card: Card): CardView {
  const isJoker = card.rank === Rank.SmallJoker || card.rank === Rank.BigJoker;
  return {
    assetKey: `${card.rank}-${card.suit}`,
    rankLabel: isJoker ? (card.rank === Rank.SmallJoker ? '小王' : '大王') : RANK_LABEL[card.rank],
    suitKey: isJoker ? 'joker' : card.suit,
    sortKey: card.rank,
  };
}

export function cardsView(cards: Card[]): CardView[] {
  return cards.map(cardView);
}
