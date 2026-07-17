/**
 * W-AI S4 种子：PIMC 候选仲裁（规划者预写红种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制到 test/ai/pimc-decision.test.ts（新建），独立 seed commit。
 * 实现目标：assets/scripts/ai/pimc.ts 的决策半部——
 *   pimcArbitrate({ snapshot, history, candidates, includePass, profile }): Move | null
 *     · 对每个候选（includePass 时外加「过牌」）在 N 个一致采样世界里 rollout 完局，
 *       胜 +1 / 负 −1 整数聚合（固定序），取分最高者；平分 tie-break：过牌优先（保结构保守语义）
 *       → moveOutcomeScore → compareMoves 全序。
 *     · 内部随机只用 deriveWorldSeed(snapshot, history) 派生的 rng——**外部 rng 不参与**。
 *     · 返回 null ⇔ 选择过牌（仅 includePass=true 时可能）。
 *   档位常量：HARD_PIMC={samples:48,maxCandidates:8}、HINT_PIMC={samples:160,maxCandidates:12}。
 *
 * ── 两个夹具的构造原理（点数域全受控 → 每个采样世界的胜负都被逼死，判定与采样划分无关）──
 *   夹具A「竞速局面」：我(农民,座1) 手 A 7 7，地主(座0)只剩 1 张、刚出单 6；
 *     未见牌被历史逼死为 {8,9,10,J}（全部 >7 且 <A）。
 *     → 出 7：地主随手压 7 清手，**每个世界必败**；出 A：无人能压 → 回权领对 77 清手，**每个世界必胜**。
 *     仲裁必须选 A（且与候选顺序无关、两跑深相等）。
 *   夹具B「过牌更优」：我(农民,座1) 手 2 7，地主/队友各剩 1 张，地主刚出单 6；未见牌被逼死为 {2,J}。
 *     → 烧 7：地主的单张(2 或 J)都压得过 7 → 地主清手必败；过牌：队友的单张(2 或 J)都压得过 6 →
 *       队友清手必胜。仲裁必须选 null（过牌）。
 *
 * ── 预期红（实现前）── 模块导出缺失 → 全文件红（5 用例）。
 *
 * ── 负向变异自证（执行者实现后自查，报告注明红几条）──
 *   ① 聚合符号取反（负分选优）→ 夹具A 选 7、夹具B 选烧牌 → 两用例红（证明 PIMC 真在评估而非摆设）。
 *   ② 仲裁内部消费外部传入的策略 rng → 确定性用例红（0.99 桩 vs 0 桩分叉）。
 *   ③ 候选未按全序 tie-break → 顺序无关用例红。
 */
import { describe, expect, it } from 'vitest';
import { legalFollows, recognize, type Move } from '../../assets/scripts/rules';
import { GamePhase, type GameEvent, type GameSnapshot } from '../../assets/scripts/game';
import { HARD_PIMC, HINT_PIMC, pimcArbitrate } from '../../assets/scripts/ai/pimc';
import { cards } from '../rules/_util';

function playEvents(specs: Array<[0 | 1 | 2, string]>): GameEvent[] {
  return specs.map(([seat, spec]) => ({ type: 'play' as const, seat, pattern: recognize(cards(spec))! }));
}

// 夹具A：未见牌 = {8,9,10,J}。已出 47 张 = 全副牌 − 我手(A 7 7) − 未见 4 张。
const HISTORY_RACE = playEvents([
  [0, '3 3 3 3'], [1, '4 4 4 4'], [2, '5 5 5 5'], [0, 'Q Q Q Q'], [1, 'K K K K'], [2, '2 2 2 2'],
  [0, '6 6 6'], [1, '7 7'], [2, '8 8 8'], [0, '9 9 9'], [1, '10 10 10'], [2, 'J J J'],
  [0, 'A A A'], [1, 'x X'],
  [0, '6'],
]);

const SNAP_RACE: GameSnapshot = {
  phase: GamePhase.Playing,
  turn: 1,
  landlord: 0,
  top: { seat: 0, pattern: recognize(cards('6'))! },
  handCounts: [1, 3, 3],
  winner: null,
  viewerHand: cards('A 7 7'),
};

// 夹具B：未见牌 = {2,J}。已出 50 张 = 全副牌 − 我手(2 7) − 未见 2 张。
const HISTORY_PASS = playEvents([
  [0, '3 3 3 3'], [1, '4 4 4 4'], [2, '5 5 5 5'], [0, '8 8 8 8'], [1, '9 9 9 9'], [2, '10 10 10 10'],
  [0, 'Q Q Q Q'], [1, 'K K K K'], [2, 'A A A A'],
  [0, '6 6 6'], [1, '7 7 7'], [2, 'J J J'], [0, '2 2'], [1, 'x X'],
  [0, '6'],
]);

const SNAP_PASS: GameSnapshot = {
  phase: GamePhase.Playing,
  turn: 1,
  landlord: 0,
  top: { seat: 0, pattern: recognize(cards('6'))! },
  handCounts: [1, 2, 1],
  winner: null,
  viewerHand: cards('2 7'),
};

function singleFollows(snapshot: GameSnapshot): Move[] {
  return legalFollows(snapshot.viewerHand!, snapshot.top!.pattern)
    .filter((move) => move.cards.length === 1);
}

describe('W-AI S4 pimcArbitrate 候选仲裁', () => {
  it('档位常量：HARD_PIMC 与 HINT_PIMC 固定采样数（确定性预算，非时基）', () => {
    expect(HARD_PIMC).toEqual({ samples: 48, maxCandidates: 8 });
    expect(HINT_PIMC).toEqual({ samples: 160, maxCandidates: 12 });
  });

  it('夹具A 竞速：必选控牌 A（每个世界 A 必胜、7 必败）', () => {
    const candidates = singleFollows(SNAP_RACE);
    expect(candidates).toHaveLength(2); // 单 7 与 单 A
    const verdict = pimcArbitrate({
      snapshot: SNAP_RACE, history: HISTORY_RACE, candidates, includePass: false,
      profile: { samples: 16, maxCandidates: 8 },
    });
    expect(verdict).not.toBeNull();
    expect(verdict!.cards).toHaveLength(1);
    expect(verdict!.cards[0].rank).toBe(14); // Rank.A
  });

  it('夹具A 顺序无关 + 确定性：候选反序同判，两跑深相等', () => {
    const candidates = singleFollows(SNAP_RACE);
    const forward = pimcArbitrate({
      snapshot: SNAP_RACE, history: HISTORY_RACE, candidates, includePass: false,
      profile: { samples: 16, maxCandidates: 8 },
    });
    const reversed = pimcArbitrate({
      snapshot: SNAP_RACE, history: HISTORY_RACE, candidates: candidates.slice().reverse(), includePass: false,
      profile: { samples: 16, maxCandidates: 8 },
    });
    expect(reversed).toEqual(forward);
    const again = pimcArbitrate({
      snapshot: SNAP_RACE, history: HISTORY_RACE, candidates, includePass: false,
      profile: { samples: 16, maxCandidates: 8 },
    });
    expect(again).toEqual(forward);
  });

  it('夹具B 过牌更优：includePass 下必须返回 null（让队友清手）', () => {
    const burnSeven = singleFollows(SNAP_PASS).filter((move) => move.cards[0].rank === 7);
    expect(burnSeven).toHaveLength(1);
    const verdict = pimcArbitrate({
      snapshot: SNAP_PASS, history: HISTORY_PASS, candidates: burnSeven, includePass: true,
      profile: { samples: 8, maxCandidates: 4 },
    });
    expect(verdict).toBeNull();
  });

  it('结果封闭性：verdict ∈ candidates（按牌组逐字段），includePass=false 时恒非 null', () => {
    const candidates = singleFollows(SNAP_RACE);
    const verdict = pimcArbitrate({
      snapshot: SNAP_RACE, history: HISTORY_RACE, candidates, includePass: false,
      profile: { samples: 4, maxCandidates: 8 },
    });
    expect(verdict).not.toBeNull();
    const keys = new Set(candidates.map((move) => move.cards.map((card) => `${card.rank}:${card.suit}`).sort().join('|')));
    expect(keys.has(verdict!.cards.map((card) => `${card.rank}:${card.suit}`).sort().join('|'))).toBe(true);
  });
});
