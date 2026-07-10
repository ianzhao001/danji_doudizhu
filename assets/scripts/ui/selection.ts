/**
 * M3-00 手牌选中模型（纯函数）。架构落桩——实现方实现函数体，使 test/ui/selection.test.ts 转绿。
 * 规则见 coordination/tasks/M3-00-selection.md。纯函数、不可变、禁止 import `cc`。
 * 选中身份按 rank+suit 区分（同点不同花是不同牌）。
 */

import type { Card } from '../rules';

function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

export function isSelected(selected: Card[], card: Card): boolean {
  return selected.some((candidate) => sameCard(candidate, card));
}

export function toggle(selected: Card[], card: Card): Card[] {
  return isSelected(selected, card)
    ? selected.filter((candidate) => !sameCard(candidate, card))
    : [...selected, card];
}

export function sortByRank(cards: Card[]): Card[] {
  return cards
    .map((card, index) => ({ card, index }))
    .sort((a, b) => (a.card.rank - b.card.rank) || (a.index - b.index))
    .map(({ card }) => card);
}

export function sortForDisplay(cards: Card[]): Card[] {
  return [...sortByRank(cards)].reverse();
}

export function clearSelection(): Card[] {
  return [];
}
