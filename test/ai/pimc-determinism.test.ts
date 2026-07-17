/**
 * W-AI S11 种子：PIMC 引擎确定性门（规划者预写红种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制到 test/ai/pimc-determinism.test.ts（新建），独立 seed commit（B2 棒）。
 *
 * ── 契约（确定性铁律的引擎级复核）──
 *   ① 三档策略对同一快照/历史，与外部 rng 完全无关（0.99 桩 vs 0 桩 vs createRng 深相等）；
 *   ② pimcArbitrate 满档（HARD_PIMC）两跑深相等；
 *   ③ 全 Hard 三席 selfplay（seeds 1..20）两跑深相等——PIMC 接线后的整局可复现门；
 *   ④ 混档 selfplay（[Hard,Normal,Simple]）两跑深相等。
 *   实现约束提醒（写进实现注释）：禁 Object.keys 键序依赖 / 禁时基预算 / 聚合固定序。
 *
 * ── 预期红（实现前）── 引擎模块缺失 → 全文件红（4 用例）。
 *
 * ── 负向变异自证（执行者实现后自查，报告注明红几条）──
 *   ① deriveWorldSeed 混入全局自增计数器 → ②③ 红。
 *   ② pimcArbitrate 改用策略形参 rng → ① 红（0.99 桩与 0 桩分叉）。
 *   ③ 聚合改 Map 迭代序（插入序随候选乱序变化）→ ② 顺序敏感红。
 */
import { describe, expect, it } from 'vitest';
import { strategyFor, AiLevel } from '../../assets/scripts/ai';
import { HARD_PIMC, pimcArbitrate } from '../../assets/scripts/ai/pimc';
import { createRng, legalFollows, recognize } from '../../assets/scripts/rules';
import { GamePhase, type GameEvent, type GameSnapshot } from '../../assets/scripts/game';
import { runDifficultyMatchup } from '../selfplay/difficulty';
import { cards } from '../rules/_util';

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

function playEvents(specs: Array<[0 | 1 | 2, string]>): GameEvent[] {
  return specs.map(([seat, spec]) => ({ type: 'play' as const, seat, pattern: recognize(cards(spec))! }));
}

const HISTORY = playEvents([
  [0, '3 3 3 3'], [1, '4 4 4 4'], [2, '5 5 5 5'], [0, 'Q Q Q Q'], [1, 'K K K K'], [2, '2 2 2 2'],
  [0, '6 6 6'], [1, '7 7'], [2, '8 8 8'], [0, '9 9 9'], [1, '10 10 10'], [2, 'J J J'],
  [0, 'A A A'], [1, 'x X'],
  [0, '6'],
]);

const SNAP: GameSnapshot = {
  phase: GamePhase.Playing,
  turn: 1,
  landlord: 0,
  top: { seat: 0, pattern: recognize(cards('6'))! },
  handCounts: [1, 3, 3],
  winner: null,
  viewerHand: cards('A 7 7'),
};

describe('W-AI S11 PIMC 引擎确定性门', () => {
  it('三档策略与外部 rng 无关（0.99 桩 / 0 桩 / createRng 全深相等）', () => {
    for (const level of [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard]) {
      const strategy = strategyFor(level);
      const viaHigh = strategy(SNAP, { next: () => 0.99 }, HISTORY);
      const viaLow = strategy(SNAP, { next: () => 0 }, HISTORY);
      const viaRng = strategy(SNAP, createRng(1234), HISTORY);
      expect(viaLow, `${level} 0 桩`).toEqual(viaHigh);
      expect(viaRng, `${level} createRng`).toEqual(viaHigh);
    }
  });

  it('pimcArbitrate 满档（HARD_PIMC）两跑深相等', () => {
    const candidates = legalFollows(SNAP.viewerHand!, SNAP.top!.pattern).filter((m) => m.cards.length === 1);
    const first = pimcArbitrate({ snapshot: SNAP, history: HISTORY, candidates, includePass: true, profile: HARD_PIMC });
    const second = pimcArbitrate({ snapshot: SNAP, history: HISTORY, candidates, includePass: true, profile: HARD_PIMC });
    expect(second).toEqual(first);
  });

  it('全 Hard 三席 selfplay 两跑深相等（seeds 1..20）', async () => {
    const levels: [AiLevel, AiLevel, AiLevel] = [AiLevel.Hard, AiLevel.Hard, AiLevel.Hard];
    const a = await runDifficultyMatchup(levels, SEEDS);
    const b = await runDifficultyMatchup(levels, SEEDS);
    expect(b).toEqual(a);
  }, 180_000);

  it('混档 selfplay 两跑深相等（seeds 1..20）', async () => {
    const levels: [AiLevel, AiLevel, AiLevel] = [AiLevel.Hard, AiLevel.Normal, AiLevel.Simple];
    const a = await runDifficultyMatchup(levels, SEEDS);
    const b = await runDifficultyMatchup(levels, SEEDS);
    expect(b).toEqual(a);
  }, 180_000);
});
