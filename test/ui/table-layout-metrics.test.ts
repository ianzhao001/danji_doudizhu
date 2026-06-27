import { describe, expect, it } from 'vitest';

import { LAYOUT_METRICS, PORTRAIT, tableLayout, type Rect } from '../../assets/scripts/ui/table-layout';

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function numericLeaves(value: unknown): number[] {
  if (typeof value === 'number') return [value];
  if (typeof value !== 'object' || value === null) return [];
  return Object.values(value).flatMap(numericLeaves);
}

describe('table layout metrics', () => {
  it('exports named metrics used to derive tableLayout', () => {
    expect(LAYOUT_METRICS).toEqual(expect.any(Object));
    expect(tableLayout()).toEqual({
      topBar: { x: 0, y: 0, width: 390, height: 64 },
      opponentLeft: { x: 0, y: 80, width: 150, height: 80 },
      opponentRight: { x: 240, y: 80, width: 150, height: 80 },
      playArea: { x: 45, y: 220, width: 300, height: 180 },
      actionButtons: { x: 55, y: 604, width: 280, height: 64 },
      playerHand: { x: 0, y: 684, width: 390, height: 160 },
    });
  });

  it('keeps layout deterministic and inside portrait bounds', () => {
    const layout = tableLayout();
    const regions = [layout.topBar, layout.opponentLeft, layout.opponentRight, layout.playArea, layout.actionButtons, layout.playerHand];

    expect(layout).toEqual(tableLayout());
    for (const region of regions) {
      expect(Number.isInteger(region.x)).toBe(true);
      expect(Number.isInteger(region.y)).toBe(true);
      expect(Number.isInteger(region.width)).toBe(true);
      expect(Number.isInteger(region.height)).toBe(true);
      expect(region.x).toBeGreaterThanOrEqual(0);
      expect(region.y).toBeGreaterThanOrEqual(0);
      expect(region.x + region.width).toBeLessThanOrEqual(PORTRAIT.width);
      expect(region.y + region.height).toBeLessThanOrEqual(PORTRAIT.height);
    }
  });

  it('keeps opponents symmetric and vertical regions non-overlapping', () => {
    const layout = tableLayout();
    const leftCenter = layout.opponentLeft.x + layout.opponentLeft.width / 2;
    const rightCenter = layout.opponentRight.x + layout.opponentRight.width / 2;
    const center = PORTRAIT.width / 2;
    const ordered = [layout.topBar, layout.opponentLeft, layout.playArea, layout.actionButtons, layout.playerHand];

    expect(layout.opponentLeft.y).toBe(layout.opponentRight.y);
    expect(layout.opponentLeft.height).toBe(layout.opponentRight.height);
    expect(center - leftCenter).toBe(rightCenter - center);
    for (let i = 0; i < ordered.length - 1; i++) {
      expect(overlaps(ordered[i], ordered[i + 1])).toBe(false);
    }
  });

  it('keeps every metric leaf as an integer pixel value', () => {
    expect(numericLeaves(LAYOUT_METRICS).every(Number.isInteger)).toBe(true);
  });
});
