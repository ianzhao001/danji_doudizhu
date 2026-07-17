/** Build deterministic integer frames for a settlement score roll. */
export function scoreRollFrames(from: number, to: number, steps: number): number[] {
  if (!Number.isInteger(steps) || steps < 1) {
    throw new RangeError('steps must be a positive integer');
  }

  const frames = Array.from({ length: steps }, (_, index) => (
    Math.round(from + ((to - from) * (index + 1)) / steps)
  ));
  frames[frames.length - 1] = to;
  return frames;
}
