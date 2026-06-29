import { AiLevel } from '../ai/strategy';
import { difficultyConfig, difficultyOptions } from '../data/difficultyConfig';

export interface DifficultyOptionView {
  level: AiLevel;
  label: string;
  description: string;
  selected: boolean;
}

export interface DifficultyPickerView {
  options: DifficultyOptionView[];
}

export function deriveDifficultyPicker(current: AiLevel): DifficultyPickerView {
  const selectedLevel = difficultyConfig(current).level;
  return {
    options: difficultyOptions().map((option) => ({
      level: option.level,
      label: option.label,
      description: option.description,
      selected: option.level === selectedLevel,
    })),
  };
}
