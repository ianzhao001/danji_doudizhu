/**
 * T-MEMORY-REAL 失败测试（规划者种入·不可改）：flow 向 AI 策略传递累积对局事件。
 * 契约见 coordination/tasks/T-MEMORY-REAL.md：PlayPolicy 入参对象新增 history: GameEvent[]
 * （驱动方每次决策时传当前已累积的对局事件；driver 与 round-runtime 两条驱动路径都必须传）。
 * 今日红因：PlayPolicy 入参尚无 history 字段（probe 收到 undefined）。
 * runtime 路径（round-runtime.ts 调 decidePlayAction 处传 fullGameEvents）由审查者 diff 核 + V7 兜底。
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
