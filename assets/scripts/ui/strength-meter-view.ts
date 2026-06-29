import type { HandStrength } from '../ai/handStrength';

export interface StrengthMeterView {
  pct: number;
  label: string;
  tone: 'weak' | 'mid' | 'strong';
}

function clampPct(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function deriveStrengthMeter(strength: HandStrength): StrengthMeterView {
  const pct = clampPct(strength.score);
  if (pct < 34) return { pct, label: '偏弱', tone: 'weak' };
  if (pct < 67) return { pct, label: '均衡', tone: 'mid' };
  return { pct, label: '强势', tone: 'strong' };
}
