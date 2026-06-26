/**
 * M3-00 手牌布局算法（竖屏纯函数）。架构落桩——实现方实现函数体，使 test/ui/hand-layout.test.ts 转绿。
 * 规则见 coordination/tasks/M3-00-hand-layout.md。纯函数、确定性，禁止 import `cc`。
 * ui 层纯算法岛；后续 Cocos 组件消费坐标。
 */

export interface HandLayoutOpts {
  containerWidth: number;
  cardWidth: number;
}

export interface CardSlot {
  x: number;
}

export function layoutHand(count: number, opts: HandLayoutOpts): CardSlot[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error('layoutHand: count must be a non-negative integer');
  }
  if (count <= 0) return [];

  const { containerWidth, cardWidth } = opts;
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
    throw new Error('layoutHand: containerWidth must be a positive finite number');
  }
  if (!Number.isFinite(cardWidth) || cardWidth <= 0) {
    throw new Error('layoutHand: cardWidth must be a positive finite number');
  }
  if (count > 1 && cardWidth > containerWidth) {
    throw new Error('layoutHand: cardWidth must not exceed containerWidth when count > 1');
  }

  if (count === 1) return [{ x: (containerWidth - cardWidth) / 2 }];

  const fitsWithoutOverlap = count * cardWidth <= containerWidth;
  const step = fitsWithoutOverlap ? cardWidth : (containerWidth - cardWidth) / (count - 1);
  const totalWidth = cardWidth + step * (count - 1);
  const start = (containerWidth - totalWidth) / 2;

  return Array.from({ length: count }, (_, index) => ({ x: start + step * index }));
}
