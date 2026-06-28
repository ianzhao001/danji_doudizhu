/**
 * M6-L3 失败测试：table-layout 多分辨率不变量 sweep（架构种入·不可改）。
 * 当前 tableLayout() 无参数返回 390×844 固定值 → 显式传宽高时应按比例重算，本测试应先红。
 * 规则见 coordination/tasks/M6-L3-table-layout-resolutions.md。纯函数、确定性、禁止 import `cc`。
 *
 * 兼容性铁律（不可破坏现有 test/ui/table-layout.test.ts + table-layout-metrics.test.ts）：
 *   tableLayout() 无参调用必须仍返回精确的 390×844 固定值（后者用 toEqual 钉死）。
 *   故参数化须以「显式传宽高才走重算分支，无参走固定 LAYOUT_METRICS」实现，或在重算分支
 *   于默认 390×844 时严格还原固定值。本测试只断言显式传参下的不变量，不触碰无参契约。
 */
import { describe, it, expect } from 'vitest';
import { tableLayout, type Rect } from '../../assets/scripts/ui/table-layout';

const RESOLUTIONS: Array<{ w: number; h: number }> = [
  { w: 320, h: 780 },
  { w: 360, h: 780 },
  { w: 390, h: 844 },
  { w: 412, h: 915 },
  { w: 414, h: 896 },
];

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

describe('M6-L3 table-layout 多分辨率不变量', () => {
  for (const { w, h } of RESOLUTIONS) {
    it(`${w}×${h}：对手座左右关于中线对称、playArea 居中、playerHand 贴底不溢出、各区不重叠`, () => {
      const r = tableLayout(w, h);

      // 对手座左右关于 w/2 对称：左座右沿 与 右座左沿 关于中线镜像
      const leftRightEdge = r.opponentLeft.x + r.opponentLeft.width;
      const rightLeftEdge = r.opponentRight.x;
      expect(Math.abs(leftRightEdge - (w - rightLeftEdge))).toBeLessThanOrEqual(2);

      // playArea 横向居中
      const center = r.playArea.x + r.playArea.width / 2;
      expect(Math.abs(center - w / 2)).toBeLessThanOrEqual(2);

      // playerHand 横向占满不溢出
      expect(r.playerHand.x).toBeGreaterThanOrEqual(0);
      expect(r.playerHand.x + r.playerHand.width).toBeLessThanOrEqual(w);

      // playerHand 贴底
      expect(r.playerHand.y + r.playerHand.height).toBeLessThanOrEqual(h);
      expect(r.playerHand.y + r.playerHand.height).toBeGreaterThan(h - 200);

      // topBar 贴顶
      expect(r.topBar.y).toBeGreaterThanOrEqual(0);

      // actionButtons 在 playerHand 上方
      expect(r.actionButtons.y + r.actionButtons.height).toBeLessThanOrEqual(r.playerHand.y);

      // 各区在屏内
      const regions = [r.playerHand, r.actionButtons, r.opponentLeft, r.opponentRight, r.playArea, r.topBar];
      for (const reg of regions) {
        expect(reg.x).toBeGreaterThanOrEqual(0);
        expect(reg.y).toBeGreaterThanOrEqual(0);
        expect(reg.x + reg.width).toBeLessThanOrEqual(w);
        expect(reg.y + reg.height).toBeLessThanOrEqual(h);
      }

      // 各区互不重叠
      for (let i = 0; i < regions.length; i++) {
        for (let j = i + 1; j < regions.length; j++) {
          expect(overlaps(regions[i], regions[j])).toBe(false);
        }
      }
    });
  }

  it('确定性：同宽高两次调用深相等', () => {
    expect(tableLayout(360, 780)).toEqual(tableLayout(360, 780));
  });

  it('无参调用仍返回 390×844 固定契约（不破坏现有测试）', () => {
    const r = tableLayout();
    expect(r.playerHand.width).toBe(390);
    expect(r.playArea.x).toBe(45);
  });
});
