import { beforeAll, describe, expect, it } from 'vitest';
import { buildLatencyCorpus, type LatencyFrame } from './latency-corpus';

describe('fixed latency corpus', () => {
  let corpus: Awaited<ReturnType<typeof buildLatencyCorpus>>;
  beforeAll(async () => { corpus = await buildLatencyCorpus(); }, 30_000);

  it('keeps the frozen-policy replay identical across candidate upgrades', () => {
    // Intentional corpus/rule changes require a reviewed new digest and invalidate
    // comparisons with the previous corpus. Candidate-only changes must not drift.
    expect(corpus.metadata.sha256).toBe('3c70ec921cd685c27ff22a5301dec7183b46b2d31391f621427c5ef142d7970c');
    expect(corpus.metadata.collectedFrames).toBe(159);
  });

  it('covers every role and phase, with unique frames and a representative hint subset', () => {
    expect(corpus.frames).toHaveLength(60);
    expect(corpus.hintFrames).toHaveLength(24);
    const id = (frame: LatencyFrame) => `${frame.seed}:${frame.turnIndex}`;
    const decisionIds = new Set(corpus.frames.map(id));
    expect(decisionIds.size).toBe(60);
    expect(new Set(corpus.hintFrames.map(id)).size).toBe(24);
    expect(corpus.hintFrames.every((frame) => decisionIds.has(id(frame)))).toBe(true);

    for (const frames of [corpus.frames, corpus.hintFrames]) {
      expect(new Set(frames.map((frame) => frame.seed))).toEqual(new Set([1, 2, 3, 4]));
      // All three roles get the same sample budget, including each game phase.
      for (const offset of [0, 1, 2]) {
        const roleFrames = frames.filter(({ snapshot }) => snapshot.turn === (snapshot.landlord + offset) % 3);
        expect(roleFrames).toHaveLength(frames.length / 3);
        const totals = roleFrames.map(({ snapshot }) => snapshot.handCounts.reduce((a, b) => a + b, 0));
        expect(totals.some((total) => total > 36)).toBe(true);
        expect(totals.some((total) => total > 18 && total <= 36)).toBe(true);
        expect(totals.some((total) => total <= 18)).toBe(true);
      }
    }
  });
});
