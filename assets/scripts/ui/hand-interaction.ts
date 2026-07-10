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
  hitRight: number;
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
    const x = baseSlots[index].x;
    const hitRight = index < baseSlots.length - 1
      ? baseSlots[index + 1].x
      : x + args.cardWidth;
    return {
      card,
      x,
      y: selected ? -args.liftOffset : 0,
      selected,
      hitRight,
    };
  });
}

function slotOverlapsDrag(slot: InteractiveSlot, isLast: boolean, start: number, end: number): boolean {
  if (isLast) {
    return slot.hitRight >= start && slot.x <= end;
  }
  return slot.hitRight > start && slot.x <= end;
}

export function dragSelectCards(slots: InteractiveSlot[], fromX: number, toX: number): Card[] {
  if (slots.length === 0) return [];

  let start = fromX;
  let end = toX;
  if (start > end) [start, end] = [end, start];

  const firstLeft = slots[0].x;
  const lastRight = slots[slots.length - 1].hitRight;

  if (end < firstLeft || start > lastRight) return [];

  start = Math.max(firstLeft, start);
  end = Math.min(lastRight, end);

  const selected: Card[] = [];
  const lastIndex = slots.length - 1;
  for (let index = 0; index < slots.length; index += 1) {
    if (slotOverlapsDrag(slots[index], index === lastIndex, start, end)) {
      selected.push(slots[index].card);
    }
  }
  return selected;
}
