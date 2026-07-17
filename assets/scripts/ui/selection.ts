/**
 * M3-00 手牌选中模型（纯函数）。架构落桩——实现方实现函数体，使 test/ui/selection.test.ts 转绿。
 * 规则见 coordination/tasks/M3-00-selection.md。纯函数、不可变、禁止 import `cc`。
 * 选中身份按 rank+suit 区分（同点不同花是不同牌）。
 */

import type { Card } from '../rules';
import { cardKey } from '../rules/guards';

export type DragSelectionMode = 'add' | 'remove';

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

/** The actual card node that received TOUCH_START owns the gesture mode. */
export function dragSelectionModeFromCard(
  selected: readonly Card[],
  origin: Card,
): DragSelectionMode {
  return selected.some((card) => cardKey(card) === cardKey(origin)) ? 'remove' : 'add';
}

function uniqueByCardKey(cards: readonly Card[]): Card[] {
  const seen = new Set<string>();
  return cards.filter((card) => {
    const key = cardKey(card);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Apply one completed range gesture with a mode fixed at gesture start.
 * Re-entering a card during the same gesture therefore cannot toggle it back.
 */
export function applyDragSelection(
  selected: readonly Card[],
  dragged: readonly Card[],
  mode: DragSelectionMode,
): Card[] {
  const normalized = uniqueByCardKey(selected);
  const draggedKeys = new Set(dragged.map(cardKey));

  if (mode === 'remove') {
    return normalized.filter((card) => !draggedKeys.has(cardKey(card)));
  }

  const result = normalized.slice();
  const selectedKeys = new Set(result.map(cardKey));
  for (const card of dragged) {
    const key = cardKey(card);
    if (selectedKeys.has(key)) continue;
    selectedKeys.add(key);
    result.push(card);
  }
  return result;
}

export function sortByRank(cards: Card[]): Card[] {
  return cards
    .map((card, index) => ({ card, index }))
    .sort((a, b) => (a.card.rank - b.card.rank) || (a.index - b.index))
    .map(({ card }) => card);
}

export function sortForDisplay(cards: Card[]): Card[] {
  return cards
    .map((card, index) => ({ card, index }))
    .sort((a, b) => (b.card.rank - a.card.rank) || (a.index - b.index))
    .map(({ card }) => card);
}

export function clearSelection(): Card[] {
  return [];
}
