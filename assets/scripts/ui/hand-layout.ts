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
  throw new Error('M3-00 hand-layout not implemented');
}
