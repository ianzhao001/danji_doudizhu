import { describe, expect, it } from 'vitest';
import { TUTORIAL_HIGHLIGHTS, nextStep, tutorialSteps } from '../../assets/scripts/ui/tutorial-steps';

describe('tutorialSteps', () => {
  it('returns stable ordered ids', () => {
    expect(tutorialSteps().map((step) => step.id)).toEqual([
      'deal-hand',
      'bidding',
      'play-patterns',
      'follow-pass',
      'bomb-rocket',
      'settlement',
    ]);
  });

  it('covers bidding, play, bomb, and settlement keywords', () => {
    const text = tutorialSteps()
      .map((step) => `${step.title} ${step.body}`)
      .join('\n');

    expect(text).toContain('叫');
    expect(text).toContain('出牌');
    expect(text).toContain('炸弹');
    expect(text).toContain('结算');
  });

  it('clamps nextStep to the valid range', () => {
    const steps = tutorialSteps();

    expect(nextStep(steps, -5)).toBe(0);
    expect(nextStep(steps, 0)).toBe(1);
    expect(nextStep(steps, steps.length - 1)).toBe(steps.length - 1);
    expect(nextStep([], 0)).toBe(0);
  });

  it('uses known highlight keys only', () => {
    const allowed = new Set<string>(TUTORIAL_HIGHLIGHTS);

    for (const step of tutorialSteps()) {
      if (step.highlight) expect(allowed.has(step.highlight)).toBe(true);
    }
  });

  it('returns fresh step objects', () => {
    const first = tutorialSteps();
    const second = tutorialSteps();

    expect(first).toEqual(second);
    expect(first[0]).not.toBe(second[0]);
  });
});
