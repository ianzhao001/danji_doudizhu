/**
 * sota2-R4 B8 种子（规划者预写红种子 · 2026-07-21 · sota2 · P1-d 结构化 + tuning 注册表）：
 * ai/tuning 常数注册表 + weighWorld 矛盾计分"整数单位化"（缺省关断等价，非等权由 SPSA 决定）。
 *
 * 落位：Codex 逐字节复制到 test/ai/tuning-weigh-world.test.ts，独立 seed commit（先红取证）。
 * 预期红（对当前 main，规划者已预验）：整文件红（ai/tuning 模块不存在，import 失败）。
 *
 * 契约：
 *   - getTuning(): AiTuning（冻结对象）；DEFAULT_TUNING 导出；__setTuningForOfflineSearch(t) 仅工具/测试用。
 *   - AiTuning.passUnits = { landlord: 4, farmer: 4, highTopShift: 0 }（缺省）。
 *   - weighWorld(signals, world, cap, landlord?) 第 4 参可选；矛盾单位 = seatUnit >> (高顶 ? highTopShift : 0)，
 *     等效矛盾数 = min(round(unitsSum/4), cap)，权重 = 2^(cap-等效矛盾数)，必须保持正整数
 *     （effectiveSampleDegrade 的 INVALID_PIMC_WEIGHT 契约）。缺省单位全 4 → 与旧公式逐位相等。
 *
 * 负向变异自证（实现后逐条自查，报告注明红几条）：
 *   ① 缺省单位改非 4（关断不等价）→ 用例② 红。
 *   ② __setTuningForOfflineSearch 不生效或不可还原 → 用例③ 红。
 *   ③ 权重出现非整数/<1 → 用例④ 红。
 */
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_TUNING, getTuning, __setTuningForOfflineSearch } from '../../assets/scripts/ai/tuning';
import { weighWorld, type PassSignal } from '../../assets/scripts/ai/pimc';
import { Rank, recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const LEN = Rank.BigJoker + 1;

function row(entries: Partial<Record<number, number>>): number[] {
  const filled = new Array<number>(LEN).fill(0);
  for (const [rank, count] of Object.entries(entries)) filled[Number(rank)] = count!;
  return filled;
}

function signalFrom(seat: 0 | 1 | 2): PassSignal {
  return { seat, top: recognize(cards('3'))!, playedAfter: new Array<number>(LEN).fill(0) };
}

// seat0 世界里有一张 4：本可白压单 3 却过牌 → 恰 1 条矛盾
function contradictingWorld(): [number[], number[], number[]] {
  return [row({ [Rank.R4]: 1 }), row({}), row({})];
}

afterEach(() => __setTuningForOfflineSearch(DEFAULT_TUNING));

describe('sota2-R4 B8 tuning 注册表 + weighWorld 单位化', () => {
  it('① 注册表缺省值冻结可读', () => {
    expect(getTuning().passUnits).toEqual({ landlord: 4, farmer: 4, highTopShift: 0 });
    expect(Object.isFrozen(getTuning())).toBe(true);
  });

  it('② 缺省关断等价：1 条矛盾 → 2^(4-1)=8；0 条矛盾 → 2^4=16（与旧公式逐位相等）', () => {
    expect(weighWorld([signalFrom(0)], contradictingWorld(), 4, 2)).toBe(8);
    expect(weighWorld([signalFrom(0)], [row({}), row({}), row({})], 4, 2)).toBe(16);
  });

  it('③ 离线搜索注入：地主过牌单位调成 8 → 等效矛盾 2 → 权重 4；还原后回到 8', () => {
    __setTuningForOfflineSearch({ ...DEFAULT_TUNING, passUnits: { landlord: 8, farmer: 4, highTopShift: 0 } });
    expect(weighWorld([signalFrom(0)], contradictingWorld(), 4, 0)).toBe(4);
    __setTuningForOfflineSearch(DEFAULT_TUNING);
    expect(weighWorld([signalFrom(0)], contradictingWorld(), 4, 0)).toBe(8);
  });

  it('④ 任意注入下权重保持正整数（ESS 退化契约不破）', () => {
    __setTuningForOfflineSearch({ ...DEFAULT_TUNING, passUnits: { landlord: 6, farmer: 5, highTopShift: 1 } });
    const weight = weighWorld([signalFrom(0), signalFrom(1)], contradictingWorld(), 4, 0);
    expect(Number.isInteger(weight)).toBe(true);
    expect(weight).toBeGreaterThanOrEqual(1);
  });
});
