import { AiLevel } from '../ai/strategy';
import { isAiLevel } from './settings';

export interface DifficultyConfig {
  level: AiLevel;
  label: string;
  description: string;
  thinkDelayMs: { min: number; max: number };
}

export const DIFFICULTY_CONFIGS: Record<AiLevel, DifficultyConfig> = {
  [AiLevel.Simple]: {
    level: AiLevel.Simple,
    label: '简单',
    description: '会打组合、懂基本配合，适合上手熟悉节奏。',
    thinkDelayMs: { min: 800, max: 1200 },
  },
  [AiLevel.Normal]: {
    level: AiLevel.Normal,
    label: '普通',
    description: '结构化拆牌、护牌型、会喂队友，适合日常对局。',
    thinkDelayMs: { min: 500, max: 900 },
  },
  [AiLevel.Hard]: {
    level: AiLevel.Hard,
    label: '困难',
    description: '记牌算牌、模拟局势、残局精算，适合挑战。',
    // 困难档用更短延迟，表现为更果断的 AI 决策。
    thinkDelayMs: { min: 250, max: 500 },
  },
};

export function difficultyConfig(level: AiLevel): DifficultyConfig {
  return DIFFICULTY_CONFIGS[isAiLevel(level) ? level : AiLevel.Normal];
}

export function difficultyOptions(): DifficultyConfig[] {
  return [
    DIFFICULTY_CONFIGS[AiLevel.Simple],
    DIFFICULTY_CONFIGS[AiLevel.Normal],
    DIFFICULTY_CONFIGS[AiLevel.Hard],
  ];
}
