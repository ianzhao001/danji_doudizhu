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
