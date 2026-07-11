/**
 * 验证 flow 在驱动 AI 决策时会持续传递累积历史事件。
 */
import { describe, expect, it } from 'vitest';
import { runHeadlessRound, type Clock, type PlayPolicy } from '../../assets/scripts/flow';
import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import type { GameEvent } from '../../assets/scripts/game';

function fakeClock(): Clock {
  return { sleep: async () => {} } as unknown as Clock;
}

const simple = strategyFor(AiLevel.Simple);

describe('T-MEMORY-REAL flow→AI 历史传递', () => {
  it('driver 整局：playPolicy 每次收到 history 数组，长度单调不减且末次非空', async () => {
    const seen: Array<GameEvent[] | undefined> = [];
    const probe: PlayPolicy = (args) => {
      seen.push((args as { history?: GameEvent[] }).history);
      return simple(args.snapshot, args.rng);
    };
    await runHeadlessRound({ seed: 1, clock: fakeClock(), playPolicy: probe });

    expect(seen.length).toBeGreaterThan(0);
    // 每次调用都必须携带 history 数组（今日 undefined → 红）
    expect(seen.every((h) => Array.isArray(h))).toBe(true);
    const lengths = seen.map((h) => (h ?? []).length);
    for (let i = 1; i < lengths.length; i += 1) {
      expect(lengths[i]).toBeGreaterThanOrEqual(lengths[i - 1]);
    }
    expect(lengths[lengths.length - 1]).toBeGreaterThan(0);
    // 元素为合法对局事件形状（含 play 事件）
    const last = seen[seen.length - 1] ?? [];
    expect(last.some((e) => e.type === 'play')).toBe(true);
  });

  it('确定性回归：传递 history 不改变固定 seed 的对局结局（与基线同 seed 结果一致性由 selfplay 套件覆盖，这里只保证可运行）', async () => {
    const result = await runHeadlessRound({ seed: 2, clock: fakeClock() });
    expect(result).toBeTruthy();
  });
});
