import { describe, expect, it } from 'vitest';
import {
  DIFFICULTY_CONFIGS,
  difficultyConfig,
  difficultyOptions,
} from '../../assets/scripts/data/difficultyConfig';
import { AiLevel } from '../../assets/scripts/ai/strategy';

describe('M5-15 难度配置纯数据', () => {
  it('覆盖全部三档且每档配置完整', () => {
    expect(Object.keys(DIFFICULTY_CONFIGS).sort()).toEqual([
      AiLevel.Hard,
      AiLevel.Normal,
      AiLevel.Simple,
    ].sort());

    for (const level of [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard]) {
      const config = DIFFICULTY_CONFIGS[level];
      expect(config.level).toBe(level);
      expect(config.label.trim().length).toBeGreaterThan(0);
      expect(config.description.trim().length).toBeGreaterThan(0);
      expect(Number.isInteger(config.thinkDelayMs.min)).toBe(true);
      expect(Number.isInteger(config.thinkDelayMs.max)).toBe(true);
      expect(config.thinkDelayMs.min).toBeGreaterThanOrEqual(0);
      expect(config.thinkDelayMs.max).toBeGreaterThanOrEqual(config.thinkDelayMs.min);
    }
  });

  it('困难档思考延迟不慢于普通档', () => {
    expect(DIFFICULTY_CONFIGS[AiLevel.Hard].thinkDelayMs.min).toBeLessThanOrEqual(
      DIFFICULTY_CONFIGS[AiLevel.Normal].thinkDelayMs.min,
    );
    expect(DIFFICULTY_CONFIGS[AiLevel.Hard].thinkDelayMs.max).toBeLessThanOrEqual(
      DIFFICULTY_CONFIGS[AiLevel.Normal].thinkDelayMs.max,
    );
  });

  it('difficultyConfig 返回合法档位配置，非法值回退 Normal', () => {
    expect(difficultyConfig(AiLevel.Hard)).toBe(DIFFICULTY_CONFIGS[AiLevel.Hard]);
    expect(difficultyConfig('x' as AiLevel)).toBe(DIFFICULTY_CONFIGS[AiLevel.Normal]);
  });

  it('difficultyOptions 固定 simple → normal → hard 顺序', () => {
    expect(difficultyOptions()).toEqual([
      DIFFICULTY_CONFIGS[AiLevel.Simple],
      DIFFICULTY_CONFIGS[AiLevel.Normal],
      DIFFICULTY_CONFIGS[AiLevel.Hard],
    ]);
    expect(difficultyOptions()).toHaveLength(3);
  });
});
