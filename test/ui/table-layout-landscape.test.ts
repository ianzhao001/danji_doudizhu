/**
 * W-VISION S4R 横屏布局契约失败测试 v2（规划者预写种子 · 2026-07-15 · sota2）。
 *
 * 落位机制：Codex 开工 S4R 时将本文件**原样复制**到 `test/ui/table-layout-landscape.test.ts`
 * （覆盖 v1），独立 commit「seed(W-VISION-S4R): relocate planner seeds」；内容一字不得改动，
 * 审查者对 seeds 源文件与落位文件做逐字节一致核。
 *
 * ── v1 → v2 契约变更（用户视觉验收打回 2026-07-15，标注截图为准；是变更不是弱化）──
 *   ② 「actionButtons 去右下（centerX/w > 0.7）」→「**底部居中**（|centerX/w − 0.5| ≤ 0.03）」。
 *      用户标注：操作按钮（出牌/要不起/提示）应居中显示。右锚 0.841w 是打回主因之一。
 *      靠下（centerY/h > 0.58）与触控热区（≥44）保留。
 *   ① playArea 居中/覆盖率保留；新增**垂直链**断言：tray→按钮→手牌自下而上 8px 链
 *      （bottom(playArea)+8 ≤ actionButtons.y；bottom(actionButtons)+8 ≤ playerHand.y），
 *      钉死「抬升式居中」——playArea 允许在 ±0.06h 松量内为按钮让位。
 *   视口矩阵 +839×390（用户实际窗口 4070×1892 的 2.151 比例档）。
 *
 * ── 兼容性铁律（不可破坏，本轮零 diff）──
 *   - 无参 `tableLayout()` 与 `tableLayout(390,844)` 固定契约照旧。
 *   - 竖屏 sweep 继续绿。实现只准改 `landscapeLayout()` 一个函数。
 *
 * ── 预期红因（S4R 实现前，main 上）──
 *   `landscapeLayout(844,390)` 现产出 actionButtons={x:583,y:231,w:253,h:59}（右锚）：
 *   - ②「底部居中」红：centerX/w = 709.5/844 = 0.841，|0.841−0.5| = 0.341 > 0.03（五视口全红）。
 *   - 其余（居中/覆盖/热区/镜像/铺底/链）在现几何下应绿——链验证：
 *     bottom(playArea)=255 ≤ 231−8? 否——255 > 223 → **垂直链亦红**（现 playArea 底 255 越过按钮顶 231），
 *     这正是「托盘与按钮带互相咬合」的隐性病，v2 一并钉死。
 *   规划者已用拟议新几何对五视口做过全断言预验证（geom-verify 全绿），转绿有解。
 */
import { describe, it, expect } from 'vitest';
import { tableLayout, type Rect } from '../../assets/scripts/ui/table-layout';

const LANDSCAPE: Array<{ w: number; h: number }> = [
  { w: 844, h: 390 },
  { w: 812, h: 375 },
  { w: 915, h: 412 },
  { w: 780, h: 360 },
  { w: 839, h: 390 },
];

/** 得物 DW-A17：按钮 L 档高 44。与运行时交互热区门同一数字。 */
const MIN_TOUCH = 44;
const MIN_GAP = 8;

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

const bottom = (r: Rect): number => r.y + r.height;
const centerX = (r: Rect): number => r.x + r.width / 2;
const centerY = (r: Rect): number => r.y + r.height / 2;

/** a 被 b 覆盖的面积占 a 的比例。 */
function coverage(a: Rect, b: Rect): number {
  const ix = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return (ix * iy) / (a.width * a.height);
}

/** 中央盒：横 30%~70%、纵 30%~70%。出牌区必须实打实占住它。 */
function centerBox(w: number, h: number): Rect {
  return { x: w * 0.3, y: h * 0.3, width: w * 0.4, height: h * 0.4 };
}

describe('W-VISION tableLayout 横屏几何 v2（底部居中按钮带 + 抬升式居中托盘）', () => {
  for (const { w, h } of LANDSCAPE) {
    describe(`${w}×${h}`, () => {
      it('全部区落屏内且有正面积', () => {
        const r = tableLayout(w, h);
        const regions = [r.topBar, r.opponentLeft, r.opponentRight, r.playArea, r.actionButtons, r.playerHand];
        for (const reg of regions) {
          expect(reg.width).toBeGreaterThan(0);
          expect(reg.height).toBeGreaterThan(0);
          expect(reg.x).toBeGreaterThanOrEqual(0);
          expect(reg.y).toBeGreaterThanOrEqual(0);
          expect(reg.x + reg.width).toBeLessThanOrEqual(w);
          expect(bottom(reg)).toBeLessThanOrEqual(h);
        }
      });

      it('各区两两不重叠', () => {
        const r = tableLayout(w, h);
        const regions = [r.topBar, r.opponentLeft, r.opponentRight, r.playArea, r.actionButtons, r.playerHand];
        for (let i = 0; i < regions.length; i++) {
          for (let j = i + 1; j < regions.length; j++) {
            expect(overlaps(regions[i], regions[j]), `region[${i}] vs region[${j}]`).toBe(false);
          }
        }
      });

      it('① playArea 双轴居中（抬升式：±0.06h 松量内为按钮带让位）', () => {
        const r = tableLayout(w, h);
        expect(Math.abs(centerX(r.playArea) - w / 2), 'playArea 横向居中').toBeLessThanOrEqual(16);
        expect(Math.abs(centerY(r.playArea) - h / 2), 'playArea 纵向居中').toBeLessThanOrEqual(h * 0.06);
      });

      it('① playArea 够大：覆盖中央盒 ≥55%（中央桌面不再空着）', () => {
        const r = tableLayout(w, h);
        expect(coverage(centerBox(w, h), r.playArea)).toBeGreaterThanOrEqual(0.55);
      });

      it('② actionButtons 底部居中（用户打回：操作按钮应居中显示）', () => {
        const r = tableLayout(w, h);
        expect(Math.abs(centerX(r.actionButtons) / w - 0.5), 'actionButtons 水平居中').toBeLessThanOrEqual(0.03);
        expect(centerY(r.actionButtons) / h, 'actionButtons 靠下').toBeGreaterThan(0.58);
      });

      it('② actionButtons 触控热区达标（得物 DW-A17 L 档：高 ≥44；三键均分后单键宽 ≥44）', () => {
        const r = tableLayout(w, h);
        expect(r.actionButtons.height, '按钮条高').toBeGreaterThanOrEqual(MIN_TOUCH);
        expect(r.actionButtons.width / 3, '三键单键宽').toBeGreaterThanOrEqual(MIN_TOUCH);
      });

      it('②b 垂直链：tray → 按钮 → 手牌自下而上留 ≥8px（托盘与按钮带不得咬合）', () => {
        const r = tableLayout(w, h);
        expect(r.actionButtons.y - bottom(r.playArea), 'playArea→actionButtons').toBeGreaterThanOrEqual(MIN_GAP);
        expect(r.playerHand.y - bottom(r.actionButtons), 'actionButtons→playerHand').toBeGreaterThanOrEqual(MIN_GAP);
      });

      it('对手座左右关于中线镜像对称，且落在上半屏', () => {
        const r = tableLayout(w, h);
        const leftRightEdge = r.opponentLeft.x + r.opponentLeft.width;
        const rightLeftEdge = r.opponentRight.x;
        expect(Math.abs(leftRightEdge - (w - rightLeftEdge))).toBeLessThanOrEqual(2);
        expect(r.opponentLeft.x).toBeLessThan(w / 2);
        expect(r.opponentRight.x).toBeGreaterThanOrEqual(w / 2);
        expect(Math.min(r.opponentLeft.y, r.opponentRight.y)).toBeLessThan(h / 2);
      });

      it('topBar 贴顶通栏；playerHand 横向铺满且贴底', () => {
        const r = tableLayout(w, h);
        expect(r.topBar.x).toBe(0);
        expect(r.topBar.y).toBe(0);
        expect(r.topBar.width).toBe(w);
        expect(r.playerHand.x).toBeGreaterThanOrEqual(0);
        expect(r.playerHand.x + r.playerHand.width).toBeLessThanOrEqual(w);
        expect(bottom(r.playerHand)).toBe(h);
      });
    });
  }

  it('确定性：同宽高两次调用深相等', () => {
    expect(tableLayout(844, 390)).toEqual(tableLayout(844, 390));
  });
});
