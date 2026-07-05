import { describe, expect, it } from 'vitest';
import { tableZones } from '../../assets/scripts/ui/table-zones';
import type { Rect } from '../../assets/scripts/ui/table-layout';

const LANDSCAPE_RESOLUTIONS: Array<[number, number]> = [
  [844, 390],
  [812, 375],
  [915, 412],
  [780, 360],
];

const V13_ZONES = [
  'heroBody',
  'opponentLeftBody',
  'opponentRightBody',
  'heroNameplate',
  'opponentLeftNameplate',
  'opponentRightNameplate',
  'heroHandLarge',
  'tableActionBar',
  'settlementShowcase',
] as const;

type V13ZoneName = (typeof V13_ZONES)[number];
type V13ZoneMap = Record<V13ZoneName, Rect>;

function right(rect: Rect): number {
  return rect.x + rect.width;
}

function bottom(rect: Rect): number {
  return rect.y + rect.height;
}

function centerX(rect: Rect): number {
  return rect.x + rect.width / 2;
}

function rectGap(a: Rect, b: Rect): number {
  return Math.max(
    a.x - (b.x + b.width),
    b.x - (a.x + a.width),
    a.y - (b.y + b.height),
    b.y - (a.y + a.height),
  );
}

describe('T-LAYOUT3 v13 pink game-scene remake zones', () => {
  for (const [width, height] of LANDSCAPE_RESOLUTIONS) {
    describe(`${width}x${height}`, () => {
      function v13(): ReturnType<typeof tableZones> & V13ZoneMap {
        return tableZones(width, height) as ReturnType<typeof tableZones> & V13ZoneMap;
      }

      it('declares every v13 zone with positive in-screen geometry', () => {
        const zones = v13();
        for (const name of V13_ZONES) {
          const rect = zones[name];
          expect(rect, `${name} missing`).toBeTruthy();
          expect(rect.width, `${name}.width`).toBeGreaterThan(0);
          expect(rect.height, `${name}.height`).toBeGreaterThan(0);
          expect(rect.x, `${name}.x`).toBeGreaterThanOrEqual(0);
          expect(rect.y, `${name}.y`).toBeGreaterThanOrEqual(0);
          expect(right(rect), `${name} right`).toBeLessThanOrEqual(width);
          expect(bottom(rect), `${name} bottom`).toBeLessThanOrEqual(height);
        }
      });

      it('keeps character bodies around the tabletop without covering the large hand strip', () => {
        const zones = v13();
        expect(rectGap(zones.heroBody, zones.heroHandLarge), 'hero body vs large hand').toBeGreaterThanOrEqual(0);
        expect(rectGap(zones.opponentLeftBody, zones.heroHandLarge), 'left body vs large hand').toBeGreaterThanOrEqual(8);
        expect(rectGap(zones.opponentRightBody, zones.heroHandLarge), 'right body vs large hand').toBeGreaterThanOrEqual(8);
        expect(centerX(zones.opponentLeftBody), 'left body half').toBeLessThan(width / 2);
        expect(centerX(zones.opponentRightBody), 'right body half').toBeGreaterThan(width / 2);
      });

      it('keeps action controls touchable and separated from the large hand and settlement area', () => {
        const zones = v13();
        expect(zones.tableActionBar.height, 'action touch height').toBeGreaterThanOrEqual(44);
        expect(rectGap(zones.tableActionBar, zones.heroHandLarge), 'action vs hand').toBeGreaterThanOrEqual(8);
        expect(rectGap(zones.tableActionBar, zones.settlementShowcase), 'action vs settlement').toBeGreaterThanOrEqual(0);
      });

      it('places the settlement showcase centrally above the table while leaving buttons reachable', () => {
        const zones = v13();
        expect(Math.abs(centerX(zones.settlementShowcase) - width / 2), 'settlement center').toBeLessThanOrEqual(24);
        expect(zones.settlementShowcase.width, 'settlement readable width').toBeGreaterThanOrEqual(Math.min(360, width * 0.42));
        expect(zones.settlementShowcase.height, 'settlement readable height').toBeGreaterThanOrEqual(Math.min(210, height * 0.5));
      });
    });
  }
});

// T-LAYOUT4 收紧（规划者种入·不可改）：用户视觉终审「元素不可重叠」硬约束。
// 早先 T-LAYOUT3「名字牌贴附 body 允许重叠」裁定被推翻（用户 2026-07-05）；遗留 HUD 停靠点
// (strengthMeter/memoryDock/advisorDock) 用 T-LAYOUT2 旧坐标撞上 v13 大立绘。现应先红，
// T-LAYOUT4 把名字牌与 HUD 移到与立绘不重叠的落点（角色外移腾出空间）后转绿。
// 不改既有 16 断言、不改 T-LAYOUT2 语义（强度左于 actionBar / 记牌左半 / 建议右半）。
describe('T-LAYOUT4 v13 无重叠硬约束（名字牌 + HUD 停靠点 vs 立绘）', () => {
  for (const [width, height] of LANDSCAPE_RESOLUTIONS) {
    describe(`${width}x${height}`, () => {
      function zones(): ReturnType<typeof tableZones> & V13ZoneMap {
        return tableZones(width, height) as ReturnType<typeof tableZones> & V13ZoneMap;
      }

      it('名字牌与各自宿主立绘分离（rectGap ≥ 8·不再贴附重叠）', () => {
        const z = zones();
        expect(rectGap(z.heroNameplate, z.heroBody), 'hero nameplate vs hero body').toBeGreaterThanOrEqual(8);
        expect(rectGap(z.opponentLeftNameplate, z.opponentLeftBody), 'left nameplate vs left body').toBeGreaterThanOrEqual(8);
        expect(rectGap(z.opponentRightNameplate, z.opponentRightBody), 'right nameplate vs right body').toBeGreaterThanOrEqual(8);
      });

      it('名字牌不压手牌区/桌面行动区', () => {
        const z = zones();
        expect(rectGap(z.heroNameplate, z.heroHandLarge), 'hero nameplate vs large hand').toBeGreaterThanOrEqual(0);
        expect(rectGap(z.heroNameplate, z.tableActionBar), 'hero nameplate vs action bar').toBeGreaterThanOrEqual(0);
      });

      it('HUD 停靠点（强度/剩牌/建议）不撞对家立绘（rectGap ≥ 8）', () => {
        const z = zones();
        expect(rectGap(z.strengthMeter, z.opponentLeftBody), 'strength vs left body').toBeGreaterThanOrEqual(8);
        expect(rectGap(z.memoryDock, z.opponentLeftBody), 'memory vs left body').toBeGreaterThanOrEqual(8);
        expect(rectGap(z.advisorDock, z.opponentRightBody), 'advisor vs right body').toBeGreaterThanOrEqual(8);
      });
    });
  }
});
