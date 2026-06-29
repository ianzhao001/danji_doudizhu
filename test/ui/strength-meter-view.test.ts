import { describe, expect, it } from 'vitest';
import type { HandStrength } from '../../assets/scripts/ai/handStrength';
import { deriveStrengthMeter } from '../../assets/scripts/ui/strength-meter-view';

function strength(score: number): HandStrength {
  return { score, bombs: 0, rockets: 0, highCards: 0, longestStraight: 0 };
}

describe('deriveStrengthMeter', () => {
  it('maps weak scores below 34', () => {
    expect(deriveStrengthMeter(strength(0))).toEqual({ pct: 0, label: '偏弱', tone: 'weak' });
    expect(deriveStrengthMeter(strength(33))).toEqual({ pct: 33, label: '偏弱', tone: 'weak' });
  });

  it('maps mid scores from 34 to 66', () => {
    expect(deriveStrengthMeter(strength(34))).toEqual({ pct: 34, label: '均衡', tone: 'mid' });
    expect(deriveStrengthMeter(strength(66))).toEqual({ pct: 66, label: '均衡', tone: 'mid' });
  });

  it('maps strong scores from 67 upward', () => {
    expect(deriveStrengthMeter(strength(67))).toEqual({ pct: 67, label: '强势', tone: 'strong' });
    expect(deriveStrengthMeter(strength(100))).toEqual({ pct: 100, label: '强势', tone: 'strong' });
  });

  it('clamps pct to 0..100 and keeps non-empty labels', () => {
    expect(deriveStrengthMeter(strength(-10)).pct).toBe(0);
    const view = deriveStrengthMeter(strength(120));
    expect(view.pct).toBe(100);
    expect(view.label.length).toBeGreaterThan(0);
  });
});
