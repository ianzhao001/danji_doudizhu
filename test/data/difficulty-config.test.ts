/**
 * W-AI 修订版：难度配置纯数据契约（规划者修订种子 · 2026-07-17 · sota2 · 阻断③）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/data/difficulty-config.test.ts，独立 seed commit（B2 棒）。
 * 实现目标：assets/scripts/data/difficultyConfig.ts 三档 description 按下方**精确文案**改写
 *   （data 层定点解冻仅此一处；label/thinkDelayMs/结构一字不动）。
 *
 * ── 修订依据（用户裁决：全体上移一档）──
 *   旧 Simple 文案「出牌直接，一次一张…」随人设废止；三档新文案由规划者定稿如下（Codex 照写）：
 *     Simple：会打组合、懂基本配合，适合上手熟悉节奏。
 *     Normal：结构化拆牌、护牌型、会喂队友，适合日常对局。
 *     Hard  ：记牌算牌、模拟局势、残局精算，适合挑战。
 *   并加反回归钉：全档文案不得再含「一次一张」。其余结构/延迟断言逐字保留。
 *
 * ── 预期红（对 main 旧文案）── 精确文案用例 1 红；其余 4 用例绿。
 * ── 负向变异自证：把 Simple 文案改回旧句 → 精确文案用例与反回归钉双红。
 */
import { describe, expect, it } from 'vitest';
import {
  DIFFICULTY_CONFIGS,
  difficultyConfig,
  difficultyOptions,
} from '../../assets/scripts/data/difficultyConfig';
import { AiLevel } from '../../assets/scripts/ai/strategy';

describe('M5-15 难度配置纯数据（W-AI 修订）', () => {
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

  // 文案需与三档真实行为对齐（W-AI 全体上移：Simple「一次一张」人设废止）。
  it('W-AI：三档 description 与新行为对齐（精确文案）', () => {
    expect(DIFFICULTY_CONFIGS[AiLevel.Simple].description).toBe('会打组合、懂基本配合，适合上手熟悉节奏。');
    expect(DIFFICULTY_CONFIGS[AiLevel.Normal].description).toBe('结构化拆牌、护牌型、会喂队友，适合日常对局。');
    expect(DIFFICULTY_CONFIGS[AiLevel.Hard].description).toBe('记牌算牌、模拟局势、残局精算，适合挑战。');
    for (const level of [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard]) {
      expect(DIFFICULTY_CONFIGS[level].description, '反回归钉：旧新手人设文案不得复辟').not.toContain('一次一张');
    }
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
