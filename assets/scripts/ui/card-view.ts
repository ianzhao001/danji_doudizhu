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
  throw new Error('M3-00 card-view not implemented');
}

export function cardsView(cards: Card[]): CardView[] {
  throw new Error('M3-00 cardsView not implemented');
}

void Rank; void Suit; void RANK_LABEL;
