/**
 * T-A1 失败测试：table-layout 横屏几何（架构种入·不可改）。
 * 当前 tableLayout(844,390) 的短高 clamp 为竖屏调，横屏三区互压（playArea/actionButtons/playerHand）
 * → 本测试应先红。实现方在 `assets/scripts/ui/table-layout.ts` 加 `width>=height` 横屏分支使其转绿。
 * 规则见 coordination/tasks/T-A1.md。纯函数、确定性、禁止 import `cc`。
 *
 * 兼容性铁律（不可破坏）：
 *   - 无参 tableLayout() 与 tableLayout(390,844) 固定契约（table-layout.test.ts / -metrics.test.ts 用 toEqual 钉死）。
 *   - 竖屏 sweep（table-layout-resolutions.test.ts 的 5 档）继续绿。
 *   本文件只断言横屏（width>=height）下的不变量。
 */
import { describe, it, expect } from 'vitest';
import { tableLayout, type Rect } from '../../assets/scripts/ui/table-layout';

const LANDSCAPE: Array<{ w: number; h: number }> = [
  { w: 844, h: 390 },
  { w: 812, h: 375 },
  { w: 915, h: 412 },
  { w: 780, h: 360 },
];

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

const bottom = (r: Rect): number => r.y + r.height;

describe('T-A1 tableLayout 横屏几何', () => {
  for (const { w, h } of LANDSCAPE) {
    it(`${w}×${h}：纵向有序、各区不重叠、对手贴左右上角、playArea 居中、playerHand 铺底`, () => {
      const r = tableLayout(w, h);

      // 全部区在屏内
      const regions = [r.topBar, r.opponentLeft, r.opponentRight, r.playArea, r.actionButtons, r.playerHand];
      for (const reg of regions) {
        expect(reg.x).toBeGreaterThanOrEqual(0);
        expect(reg.y).toBeGreaterThanOrEqual(0);
        expect(reg.x + reg.width).toBeLessThanOrEqual(w);
        expect(bottom(reg)).toBeLessThanOrEqual(h);
      }

      // 纵向顺序（y 向下）：topBar → opponent → playArea → actionButtons → playerHand，逐带不重叠
      const opponentTop = Math.min(r.opponentLeft.y, r.opponentRight.y);
      const opponentBottom = Math.max(bottom(r.opponentLeft), bottom(r.opponentRight));
      expect(bottom(r.topBar)).toBeLessThanOrEqual(opponentTop);
      expect(opponentBottom).toBeLessThanOrEqual(r.playArea.y);
      expect(bottom(r.playArea)).toBeLessThanOrEqual(r.actionButtons.y);
      expect(bottom(r.actionButtons)).toBeLessThanOrEqual(r.playerHand.y);

      // 对手座左右关于中线镜像对称，且落在上部（贴 topBar 下方左右角）
      const leftRightEdge = r.opponentLeft.x + r.opponentLeft.width;
      const rightLeftEdge = r.opponentRight.x;
      expect(Math.abs(leftRightEdge - (w - rightLeftEdge))).toBeLessThanOrEqual(2);
      expect(r.opponentLeft.x).toBeLessThan(w / 2);
      expect(r.opponentRight.x).toBeGreaterThanOrEqual(w / 2);
      expect(opponentTop).toBeLessThan(h / 2);

      // playArea 横向居中
      const center = r.playArea.x + r.playArea.width / 2;
      expect(Math.abs(center - w / 2)).toBeLessThanOrEqual(2);

      // playerHand 横向铺满不溢出 + 贴底
      expect(r.playerHand.x).toBeGreaterThanOrEqual(0);
      expect(r.playerHand.x + r.playerHand.width).toBeLessThanOrEqual(w);
      expect(bottom(r.playerHand)).toBeGreaterThan(h - 140);

      // 各区两两不重叠
      for (let i = 0; i < regions.length; i++) {
        for (let j = i + 1; j < regions.length; j++) {
          expect(overlaps(regions[i], regions[j])).toBe(false);
        }
      }
    });
  }

  it('确定性：同宽高两次调用深相等', () => {
    expect(tableLayout(844, 390)).toEqual(tableLayout(844, 390));
  });
});
