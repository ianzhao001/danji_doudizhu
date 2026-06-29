export interface TurnTimerView {
  remainingSec: number;
  pct: number;
  urgent: boolean;
  label: string;
}

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function deriveTurnTimer(remainingMs: number, totalMs: number): TurnTimerView {
  const safeRemaining = Math.max(0, remainingMs);
  const remainingSec = Math.ceil(safeRemaining / 1000);
  const pct = totalMs <= 0 ? 0 : clampPct((safeRemaining / totalMs) * 100);

  return {
    remainingSec,
    pct,
    urgent: remainingMs <= 5000,
    label: `${remainingSec}s`,
  };
}
