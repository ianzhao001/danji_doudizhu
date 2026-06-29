import { describe, expect, it } from 'vitest';
import { deriveTurnTimer } from '../../assets/scripts/ui/turn-timer';

describe('deriveTurnTimer', () => {
  it('formats a full timer', () => {
    expect(deriveTurnTimer(15000, 15000)).toEqual({
      remainingSec: 15,
      pct: 100,
      urgent: false,
      label: '15s',
    });
  });

  it('formats a half timer', () => {
    expect(deriveTurnTimer(7500, 15000)).toMatchObject({
      remainingSec: 8,
      pct: 50,
      urgent: false,
      label: '8s',
    });
  });

  it('marks the 5s boundary as urgent', () => {
    expect(deriveTurnTimer(5000, 15000).urgent).toBe(true);
    expect(deriveTurnTimer(5001, 15000).urgent).toBe(false);
  });

  it('clamps remaining below zero', () => {
    expect(deriveTurnTimer(-100, 15000)).toEqual({
      remainingSec: 0,
      pct: 0,
      urgent: true,
      label: '0s',
    });
  });

  it('handles non-positive total duration safely', () => {
    expect(deriveTurnTimer(1000, 0).pct).toBe(0);
    expect(deriveTurnTimer(1000, -1).pct).toBe(0);
  });

  it('clamps pct above 100 and rounds seconds upward', () => {
    expect(deriveTurnTimer(16000, 15000)).toMatchObject({ remainingSec: 16, pct: 100 });
    expect(deriveTurnTimer(1001, 15000).remainingSec).toBe(2);
  });
});
