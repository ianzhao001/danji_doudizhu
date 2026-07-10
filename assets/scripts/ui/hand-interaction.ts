/**
 * M3-00 手牌交互桥（layout + selection 组合）。架构落桩——实现方实现函数体，使 test/ui/hand-interaction.test.ts 转绿。
 * 规则见 coordination/tasks/M3-00-selection-layout-bridge.md。纯函数、确定性、禁 cc、不改入参。
 */

import { type Card } from '../rules';
import { layoutHand } from './hand-layout';
import { sortByRank, isSelected } from './selection';

export interface InteractiveSlot {
  card: Card;
  x: number;
  y: number;
  selected: boolean;
}

export function layoutHandInteractive(args: {
  hand: Card[];
  selected: Card[];
  containerWidth: number;
  cardWidth: number;
  liftOffset: number;
}): InteractiveSlot[] {
  const sortedHand = sortByRank(args.hand);
  const baseSlots = layoutHand(sortedHand.length, {
    containerWidth: args.containerWidth,
    cardWidth: args.cardWidth,
  });

  return sortedHand.map((card, index) => {
    const selected = isSelected(args.selected, card);
    return {
      card,
      x: baseSlots[index].x,
      y: selected ? -args.liftOffset : 0,
      selected,
    };
  });
}

function slotHitWidth(slots: InteractiveSlot[], index: number): number {
  if (slots.length === 0) return 0;
  if (index < slots.length - 1) {
    return slots[index + 1].x - slots[index].x;
  }
  if (slots.length === 1) {
    return Number.POSITIVE_INFINITY;
  }
  return slots[index].x - slots[index - 1].x;
}

function slotHitEnd(slots: InteractiveSlot[], index: number): number {
  return slots[index].x + slotHitWidth(slots, index);
}

export function dragSelectCards(slots: InteractiveSlot[], fromX: number, toX: number): Card[] {
  if (slots.length === 0) return [];

  let start = fromX;
  let end = toX;
  if (start > end) [start, end] = [end, start];

  const firstLeft = slots[0].x;
  const lastRight = slotHitEnd(slots, slots.length - 1);
  start = Math.max(firstLeft, Math.min(start, lastRight));
  end = Math.max(firstLeft, Math.min(end, lastRight));

  if (end < firstLeft || start > lastRight) return [];

  const selected: Card[] = [];
  for (let index = 0; index < slots.length; index += 1) {
    const left = slots[index].x;
    const right = slotHitEnd(slots, index);
    if (right > start && left < end) {
      selected.push(slots[index].card);
    }
  }
  return selected;
}
