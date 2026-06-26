/**
 * M4-09 失败测试：判强单一真相源（架构种入·既有断言不可改）。
 * 当前 isStrongHand 为桩（throw not implemented）→ 应先红。实现方实现后应全绿。
 */
import { describe, it, expect } from 'vitest';
import { isStrongHand, chooseBid } from '../../assets/scripts/ai';
import { createBidding } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

describe('M4-09 判强单一真相源 isStrongHand', () => {
  it('火箭/炸弹任意阈值为强', () => {
    expect(isStrongHand(cards('x X 3 4 5'), 3)).toBe(true); // 火箭
    expect(isStrongHand(cards('3 3 3 3 5'), 3)).toBe(true); // 炸弹
  });

  it('highCardCount 阈值边界（点数 ≥ R2 计高牌）', () => {
    expect(isStrongHand(cards('2 2 3 4 5'), 2)).toBe(true); // 2 高牌 ≥ 2
    expect(isStrongHand(cards('2 2 3 4 5'), 3)).toBe(false); // 2 高牌 < 3
    expect(isStrongHand(cards('2 3 4 5 6'), 1)).toBe(true); // 1 高牌 ≥ 1
    expect(isStrongHand(cards('2 3 4 5 6'), 2)).toBe(false); // 1 高牌 < 2
  });

  it('chooseBid 与 isStrongHand(hand,2) 等价（call/pass）', () => {
    const calling = createBidding(0);
    for (const hand of [cards('2 2 3 4 5'), cards('2 3 4 5 6'), cards('x X 3 4 5'), cards('3 4 5 6 7')]) {
      const strong = isStrongHand(hand, 2);
      expect(chooseBid(hand, calling).type).toBe(strong ? 'call' : 'pass');
    }
  });
});
