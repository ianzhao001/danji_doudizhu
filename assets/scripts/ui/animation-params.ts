export interface PulseParams {
  scaleUp: number;
  upMs: number;
  downMs: number;
}

export interface FlyFromTo {
  fromY: number;
  toY: number;
  durationMs: number;
}

const PULSE_DURATION = { upMs: 100, downMs: 160 } as const;
const PULSE_SCALE: Record<string, number> = {
  bomb: 1.12,
  rocket: 1.12,
  deal: 1.04,
  play: 1.04,
};

export function pulseParams(cue: string): PulseParams | null {
  const scaleUp = PULSE_SCALE[cue];
  if (scaleUp === undefined) return null;
  return { scaleUp, ...PULSE_DURATION };
}

export function dealCardDelay(index: number, total: number): number {
  const safeIndex = Math.max(0, Math.floor(index));
  const safeTotal = Math.max(1, Math.floor(total));
  const stepMs = safeTotal > 17 ? 18 : 24;
  return safeIndex * stepMs;
}

export function playFlyFromTo(): FlyFromTo {
  return { fromY: -96, toY: 0, durationMs: 180 };
}
