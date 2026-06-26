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
  throw new Error('M3-00 hand-interaction not implemented');
}

void layoutHand; void sortByRank; void isSelected;
