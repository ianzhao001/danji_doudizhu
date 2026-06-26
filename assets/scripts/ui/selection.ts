/**
 * M3-00 手牌选中模型（纯函数）。架构落桩——实现方实现函数体，使 test/ui/selection.test.ts 转绿。
 * 规则见 coordination/tasks/M3-00-selection.md。纯函数、不可变、禁止 import `cc`。
 * 选中身份按 rank+suit 区分（同点不同花是不同牌）。
 */

import type { Card } from '../rules';

export function isSelected(selected: Card[], card: Card): boolean {
  throw new Error('M3-00 selection isSelected not implemented');
}

export function toggle(selected: Card[], card: Card): Card[] {
  throw new Error('M3-00 selection toggle not implemented');
}

export function sortByRank(cards: Card[]): Card[] {
  throw new Error('M3-00 selection sortByRank not implemented');
}

export function clearSelection(): Card[] {
  throw new Error('M3-00 selection clearSelection not implemented');
}
