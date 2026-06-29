import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai/strategy';
import { difficultyConfig, difficultyOptions } from '../../assets/scripts/data/difficultyConfig';
import { deriveDifficultyPicker } from '../../assets/scripts/ui/difficulty-picker-view';

describe('deriveDifficultyPicker', () => {
  it('returns all options in simple normal hard order', () => {
    expect(deriveDifficultyPicker(AiLevel.Normal).options.map((option) => option.level)).toEqual([
      AiLevel.Simple,
      AiLevel.Normal,
      AiLevel.Hard,
    ]);
  });

  it('uses labels and descriptions from difficulty config', () => {
    const view = deriveDifficultyPicker(AiLevel.Hard);

    expect(view.options.map(({ label, description }) => ({ label, description }))).toEqual(
      difficultyOptions().map(({ label, description }) => ({ label, description })),
    );
  });

  it('selects only the current level', () => {
    const view = deriveDifficultyPicker(AiLevel.Simple);

    expect(view.options.filter((option) => option.selected).map((option) => option.level)).toEqual([
      AiLevel.Simple,
    ]);
  });

  it('falls back invalid current level through difficultyConfig', () => {
    const view = deriveDifficultyPicker('bad' as AiLevel);

    expect(difficultyConfig('bad' as AiLevel).level).toBe(AiLevel.Normal);
    expect(view.options.filter((option) => option.selected).map((option) => option.level)).toEqual([
      AiLevel.Normal,
    ]);
  });
});
