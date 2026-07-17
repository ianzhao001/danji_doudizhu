/**
 * W-AI-R2b 种子：过牌推断加权采样（规划者预写红种子 · 2026-07-17 · sota2 · 吸收③ DeltaDou 思想自研）。
 *
 * 落位：Codex 逐字节复制到 test/ai/pimc-weighting.test.ts（新建），独立 seed commit（R2b 棒）。
 * 实现目标：assets/scripts/ai/pimc.ts 采样层——
 *   export collectPassSignals(snapshot, history): PassSignal[]
 *     · 顺放历史重建 top/topSeat；只收「非队友顶」的 pass（isTeammateTop 口径排除配合性过牌）；
 *     · PassSignal 至少含 { seat, top: HandPattern }（并含该席其后所打牌的增量信息以重建当时手牌）。
 *   export weighWorld(signals, worldCountsAtNow): number
 *     · 对每个信号：重建该席「当时」的世界手牌（当前采样 counts + 其后打出）；
 *       用 rollout 同型最小可压判定（不拆炸/火箭）——存在免费可压而它过了牌 ⇒ 矛盾 +1；
 *     · 权重 w = 2^(P_CAP − min(p, P_CAP)) ∈ {16,8,4,2,1}（P_CAP=4，全整数，λ=1/2 定点）。
 *   export effectiveSampleDegrade(weights: number[]): boolean —— ESS=(Σw)²/Σw² < len/4 ⇒ true
 *     （触发时整批权重退化为 1——方差与偏差的确定性折中，披露）。
 *   PimcProfile 增可选 `passInferenceCap?: number`（0=关断；缺省 4）；聚合 score += w×(±1) 全整数。
 *
 * ── 预期红（实现前）── 三导出缺失 → 全文件红（6 用例）。
 * ── 负向变异自证（执行者实现后自查）──
 *   ① 队友顶 pass 未排除 → 信号收集用例红。
 *   ② 矛盾判定把「拆炸可压」也计入 → 免费口径用例红。
 *   ③ ESS 门删除 → 退化用例红。
 */
import { describe, expect, it } from 'vitest';
import { recognize } from '../../assets/scripts/rules';
import { GamePhase, type GameEvent, type GameSnapshot } from '../../assets/scripts/game';
import {
  collectPassSignals,
  effectiveSampleDegrade,
  pimcRank,
  weighWorld,
} from '../../assets/scripts/ai/pimc';
import { toRankCounts } from '../../assets/scripts/ai/rollout';
import { cards } from '../rules/_util';

function ev(seat: 0 | 1 | 2, spec: string): GameEvent {
  return { type: 'play', seat, pattern: recognize(cards(spec))! };
}
const pass = (seat: 0 | 1 | 2): GameEvent => ({ type: 'pass', seat });

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [5, 5, 5],
    winner: null,
    viewerHand: cards('3 4 5 6 7'),
    ...over,
  };
}

describe('W-AI-R2b 过牌推断加权采样', () => {
  it('信号收集：地主顶上的农民 pass 计入；队友顶上的农民 pass 排除（配合零信息）', () => {
    // 地主(0)出单6 → 农民1 pass(计入) → 农民2 pass(计入,顶仍是地主的)
    // 农民1 出对9 → 农民2 pass(队友顶,排除) → 地主 pass(对手顶,计入)
    const history: GameEvent[] = [
      ev(0, '6'), pass(1), pass(2),
      ev(1, '9 9'), pass(2), pass(0),
    ];
    const signals = collectPassSignals(snap({}), history);
    const seats = signals.map((s) => s.seat).sort();
    expect(seats, '应恰收 3 个信号：农民1@单6、农民2@单6、地主@对9').toEqual([0, 1, 2]);
    const teammatePass = signals.filter((s) => s.seat === 2 && s.top.cards.length === 2);
    expect(teammatePass, '农民2 对队友对9 的 pass 不得成为信号').toEqual([]);
  });

  it('矛盾判定：世界里过牌席持有免费同型可压 → 矛盾；持炸弹可压不计（免费口径）', () => {
    const history: GameEvent[] = [ev(0, '6'), pass(1)];
    const signals = collectPassSignals(snap({}), history);
    expect(signals).toHaveLength(1);

    // 世界A：席1 现持 {7}——当时也持 7，可免费压 6 却过了 → 矛盾 1 → w=8。
    const contradictory: [number[], number[], number[]] = [
      toRankCounts(cards('K K')), toRankCounts(cards('7')), toRankCounts(cards('3 3')),
    ];
    expect(weighWorld(signals, contradictory)).toBe(8);

    // 世界B：席1 现持 {4,4}——无同型可压（对不跟单）→ 零矛盾 → w=16。
    const consistent: [number[], number[], number[]] = [
      toRankCounts(cards('K K')), toRankCounts(cards('4 4')), toRankCounts(cards('3 3')),
    ];
    expect(weighWorld(signals, consistent)).toBe(16);

    // 世界C：席1 现持 {9,9,9,9}——只有拆炸才能压单 6 → 免费口径不计矛盾 → w=16。
    const bombOnly: [number[], number[], number[]] = [
      toRankCounts(cards('K K')), toRankCounts(cards('9 9 9 9')), toRankCounts(cards('3 3')),
    ];
    expect(weighWorld(signals, bombOnly)).toBe(16);
  });

  it('权重封顶：矛盾数超 P_CAP=4 仍 w=1（2^0 地板）', () => {
    const history: GameEvent[] = [
      ev(0, '3'), pass(1), pass(2),
      ev(0, '4'), pass(1), pass(2),
      ev(0, '5'), pass(1), pass(2),
    ];
    const signals = collectPassSignals(snap({}), history).filter((s) => s.seat === 1);
    expect(signals.length).toBeGreaterThanOrEqual(3);
    // 席1 世界手牌 {2,2,2}——对每个历史单牌 top 都有免费可压 → 矛盾≥3 → w ≤ 2。
    const world: [number[], number[], number[]] = [
      toRankCounts(cards('K')), toRankCounts(cards('2 2 2')), toRankCounts(cards('3')),
    ];
    const w = weighWorld(signals, world);
    expect(w).toBeGreaterThanOrEqual(1);
    expect(w).toBeLessThanOrEqual(2);
  });

  it('ESS 退化门：极端集中权重 → true；均匀权重 → false（定点整数运算）', () => {
    const concentrated = [...Array(4).fill(16), ...Array(44).fill(1)];
    expect(effectiveSampleDegrade(concentrated)).toBe(true); // ESS≈10.9 < 48/4=12
    const uniform = Array(48).fill(16);
    expect(effectiveSampleDegrade(uniform)).toBe(false); // ESS=48 ≥ 12
    const allOnes = Array(48).fill(1);
    expect(effectiveSampleDegrade(allOnes)).toBe(false);
  });

  it('关断等价：无 pass 历史时，passInferenceCap:0 与缺省档 pimcRank 深相等（守恒回归锚）', () => {
    const history: GameEvent[] = [
      ev(0, '3 3 3 3'), ev(1, '4 4 4 4'), ev(2, '5 5 5 5'), ev(0, '6 6 6'), ev(0, '6'),
    ];
    const s = snap({ turn: 1, top: { seat: 0, pattern: recognize(cards('6'))! }, handCounts: [1, 3, 3], viewerHand: cards('A 7 7') });
    const candidates = [
      { cards: cards('A'), pattern: recognize(cards('A'))! },
      { cards: cards('7'), pattern: recognize(cards('7'))! },
    ];
    const base = { snapshot: s, history, candidates, includePass: true } as const;
    const off = pimcRank({ ...base, profile: { samples: 8, maxCandidates: 4, passInferenceCap: 0 } });
    const on = pimcRank({ ...base, profile: { samples: 8, maxCandidates: 4 } });
    expect(on, '零 pass 信号时加权必须无痕').toEqual(off);
  });

  it('确定性：同入参 weighWorld/collectPassSignals 两跑深相等，不改入参', () => {
    const history: GameEvent[] = [ev(0, '6'), pass(1)];
    const signals = collectPassSignals(snap({}), history);
    expect(collectPassSignals(snap({}), history)).toEqual(signals);
    const world: [number[], number[], number[]] = [
      toRankCounts(cards('K K')), toRankCounts(cards('7')), toRankCounts(cards('3 3')),
    ];
    const before = world.map((b) => b.join(',')).join('|');
    const w1 = weighWorld(signals, world);
    expect(weighWorld(signals, world)).toBe(w1);
    expect(world.map((b) => b.join(',')).join('|')).toBe(before);
  });
});
