/**
 * M3-00 失败测试：桌面布局坐标模型（架构种入·不可改）。当前 table-layout.ts 为桩 → 应先红。
 */
import { describe, it, expect } from 'vitest';
import { tableLayout, PORTRAIT, type Rect } from '../../assets/scripts/ui/table-layout';

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

describe('M3-00 桌面布局坐标模型', () => {
  it('PORTRAIT 390×844', () => {
    expect(PORTRAIT.width).toBe(390);
    expect(PORTRAIT.height).toBe(844);
  });

  it('各区在屏内、互不重叠', () => {
    const r = tableLayout();
    const regions = [r.playerHand, r.actionButtons, r.opponentLeft, r.opponentRight, r.playArea, r.topBar];
    for (const reg of regions) {
      expect(reg.x).toBeGreaterThanOrEqual(0);
      expect(reg.y).toBeGreaterThanOrEqual(0);
      expect(reg.x + reg.width).toBeLessThanOrEqual(PORTRAIT.width);
      expect(reg.y + reg.height).toBeLessThanOrEqual(PORTRAIT.height);
    }
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        expect(overlaps(regions[i], regions[j])).toBe(false);
      }
    }
  });

  it('playerHand 底部、topBar 顶部、actionButtons 在 playerHand 上方、playArea 横向居中', () => {
    const r = tableLayout();
    expect(r.playerHand.y + r.playerHand.height).toBeCloseTo(PORTRAIT.height, 0);
    expect(r.topBar.y).toBeCloseTo(0, 0);
    expect(r.actionButtons.y + r.actionButtons.height).toBeLessThanOrEqual(r.playerHand.y);
    const center = r.playArea.x + r.playArea.width / 2;
    expect(Math.abs(center - PORTRAIT.width / 2)).toBeLessThanOrEqual(1);
  });

  it('确定性：同调用两次深相等', () => {
    expect(tableLayout()).toEqual(tableLayout());
  });
});
