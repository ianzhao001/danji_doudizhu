/**
 * T-LAYOUT2 失败测试（架构种入·不可改）：全元素命名 zone + 相位可见集互斥。
 * 当前 table-zones.ts 为落桩（throw）→ 应先红，实现到绿。
 * 契约见 coordination/tasks/T-LAYOUT2.md。
 */
import { describe, expect, it } from 'vitest';
import { tableLayout, type Rect } from '../../assets/scripts/ui/table-layout';
import { tableZones, type TableZones } from '../../assets/scripts/ui/table-zones';

const LANDSCAPE_RESOLUTIONS: Array<[number, number]> = [
  [844, 390],
  [812, 375],
  [915, 412],
  [780, 360],
];

/** 两矩形分离间距：任一轴向正向分离取最大；相交为负。 */
function rectGap(a: Rect, b: Rect): number {
  return Math.max(
    a.x - (b.x + b.width),
    b.x - (a.x + a.width),
    a.y - (b.y + b.height),
    b.y - (a.y + a.height),
  );
}

function centerX(r: Rect): number {
  return r.x + r.width / 2;
}
function centerY(r: Rect): number {
  return r.y + r.height / 2;
}
function bottom(r: Rect): number {
  return r.y + r.height;
}
function right(r: Rect): number {
  return r.x + r.width;
}

const MIN_GAP = 8;

type ZoneName = keyof TableZones;

const BIDDING_SET: ZoneName[] = [
  'topBar',
  'infoStrip',
  'opponentLeft',
  'opponentRight',
  'bottomCardsDock',
  'statusLine',
  'actionBar',
  'playerHand',
];

const PLAYING_SET: ZoneName[] = [
  ...BIDDING_SET,
  'dropZoneLeft',
  'dropZoneRight',
  'dropZoneHero',
  'strengthMeter',
  'turnTimer',
  'memoryDock',
  'advisorDock',
];

const NEW_ZONES: ZoneName[] = [
  'infoStrip',
  'bottomCardsDock',
  'dropZoneLeft',
  'dropZoneRight',
  'dropZoneHero',
  'statusLine',
  'actionBar',
  'strengthMeter',
  'turnTimer',
  'memoryDock',
  'advisorDock',
];

describe('T-LAYOUT2 tableZones 相位可见集契约（四横屏）', () => {
  for (const [w, h] of LANDSCAPE_RESOLUTIONS) {
    describe(`${w}x${h}`, () => {
      it('legacy 6 字段与 tableLayout 深相等（单一事实源）', () => {
        const zones = tableZones(w, h);
        const legacy = tableLayout(w, h);
        expect(zones.topBar).toEqual(legacy.topBar);
        expect(zones.opponentLeft).toEqual(legacy.opponentLeft);
        expect(zones.opponentRight).toEqual(legacy.opponentRight);
        expect(zones.playArea).toEqual(legacy.playArea);
        expect(zones.actionButtons).toEqual(legacy.actionButtons);
        expect(zones.playerHand).toEqual(legacy.playerHand);
      });

      it('全部新 zone 落屏内且有正面积', () => {
        const zones = tableZones(w, h);
        for (const name of NEW_ZONES) {
          const r = zones[name];
          expect(r.width, `${name}.width`).toBeGreaterThan(0);
          expect(r.height, `${name}.height`).toBeGreaterThan(0);
          expect(r.x, `${name}.x`).toBeGreaterThanOrEqual(0);
          expect(r.y, `${name}.y`).toBeGreaterThanOrEqual(0);
          expect(right(r), `${name} 右缘`).toBeLessThanOrEqual(w);
          expect(bottom(r), `${name} 下缘`).toBeLessThanOrEqual(h);
        }
      });

      it(`bidding 可见集内两两间距 ≥${MIN_GAP}px`, () => {
        const zones = tableZones(w, h);
        for (let i = 0; i < BIDDING_SET.length; i++) {
          for (let j = i + 1; j < BIDDING_SET.length; j++) {
            const a = BIDDING_SET[i];
            const b = BIDDING_SET[j];
            expect(rectGap(zones[a], zones[b]), `${a} vs ${b}`).toBeGreaterThanOrEqual(MIN_GAP);
          }
        }
      });

      it(`playing 可见集内两两间距 ≥${MIN_GAP}px`, () => {
        const zones = tableZones(w, h);
        for (let i = 0; i < PLAYING_SET.length; i++) {
          for (let j = i + 1; j < PLAYING_SET.length; j++) {
            const a = PLAYING_SET[i];
            const b = PLAYING_SET[j];
            expect(rectGap(zones[a], zones[b]), `${a} vs ${b}`).toBeGreaterThanOrEqual(MIN_GAP);
          }
        }
      });

      it('语义约束：infoStrip 在 topBar 与座位之间；纵向序 hero→status→actionBar→hand', () => {
        const zones = tableZones(w, h);
        expect(zones.infoStrip.y).toBeGreaterThanOrEqual(bottom(zones.topBar));
        expect(bottom(zones.infoStrip) + MIN_GAP).toBeLessThanOrEqual(zones.opponentLeft.y);
        expect(bottom(zones.infoStrip) + MIN_GAP).toBeLessThanOrEqual(zones.opponentRight.y);

        expect(bottom(zones.dropZoneHero)).toBeLessThanOrEqual(zones.statusLine.y);
        expect(bottom(zones.statusLine)).toBeLessThanOrEqual(zones.actionBar.y);
        expect(bottom(zones.actionBar)).toBeLessThanOrEqual(zones.playerHand.y);
      });

      it('语义约束：落点分区（左右贴座、hero/底牌居中）', () => {
        const zones = tableZones(w, h);
        expect(zones.dropZoneLeft.x).toBeGreaterThanOrEqual(right(zones.opponentLeft) + MIN_GAP);
        expect(right(zones.dropZoneRight)).toBeLessThanOrEqual(zones.opponentRight.x - MIN_GAP);
        expect(Math.abs(centerY(zones.dropZoneLeft) - centerY(zones.opponentLeft))).toBeLessThanOrEqual(
          zones.opponentLeft.height,
        );
        expect(Math.abs(centerY(zones.dropZoneRight) - centerY(zones.opponentRight))).toBeLessThanOrEqual(
          zones.opponentRight.height,
        );
        expect(Math.abs(centerX(zones.dropZoneHero) - w / 2)).toBeLessThanOrEqual(40);
        expect(Math.abs(centerX(zones.bottomCardsDock) - w / 2)).toBeLessThanOrEqual(40);
        expect(zones.bottomCardsDock.y).toBeGreaterThanOrEqual(bottom(zones.topBar));
      });

      it('语义约束：meter/timer 分列 actionBar 两翼，memory 左半屏、advisor 右半屏', () => {
        const zones = tableZones(w, h);
        expect(right(zones.strengthMeter)).toBeLessThanOrEqual(zones.actionBar.x);
        expect(zones.turnTimer.x).toBeGreaterThanOrEqual(right(zones.actionBar));
        expect(centerX(zones.memoryDock)).toBeLessThan(w / 2);
        expect(centerX(zones.advisorDock)).toBeGreaterThan(w / 2);
      });
    });
  }
});
