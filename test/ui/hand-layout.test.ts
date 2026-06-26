/**
 * M3-00 失败测试：手牌布局算法（架构种入·不可改）。
 * 当前 hand-layout.ts 为桩（throw not implemented）→ 应先红。
 */
import { describe, it, expect } from 'vitest';
import { layoutHand } from '../../assets/scripts/ui/hand-layout';

describe('M3-00 手牌布局算法', () => {
  const W = 390;
  const cardWidth = 60;

  it('count=0 → []', () => {
    expect(layoutHand(0, { containerWidth: W, cardWidth })).toEqual([]);
  });

  it('返回数组长度恒为 count', () => {
    for (const count of [1, 3, 7, 20]) {
      expect(layoutHand(count, { containerWidth: W, cardWidth })).toHaveLength(count);
    }
  });

  it('count=1 单张居中', () => {
    const [slot] = layoutHand(1, { containerWidth: W, cardWidth });
    expect(slot.x + cardWidth / 2).toBeCloseTo(W / 2, 5);
  });

  it('放得下（3 张）：步距 ≥ cardWidth、对称、单调、全在容器内', () => {
    const slots = layoutHand(3, { containerWidth: W, cardWidth });
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i].x - slots[i - 1].x).toBeGreaterThanOrEqual(cardWidth - 1e-6);
    }
    expect(slots[0].x + slots[slots.length - 1].x).toBeCloseTo(W - cardWidth, 5);
    for (const s of slots) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(W - cardWidth);
    }
  });

  it('放不下（20 张）：步距 < cardWidth、对称、单调、0≤x≤W-cardWidth', () => {
    const slots = layoutHand(20, { containerWidth: W, cardWidth });
    expect(slots[1].x - slots[0].x).toBeLessThan(cardWidth);
    expect(slots[0].x + slots[slots.length - 1].x).toBeCloseTo(W - cardWidth, 5);
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i].x).toBeGreaterThanOrEqual(slots[i - 1].x);
    }
    for (const s of slots) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(W - cardWidth);
    }
  });
});
