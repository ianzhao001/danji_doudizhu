/**
 * W-AI-R2 种子：pimc ranked 截断 + pimcRank 契约（规划者预写红种子 · 2026-07-17 · sota2 · 缺陷 D2）。
 *
 * 落位：Codex 逐字节复制到 test/ai/pimc-ranked.test.ts（新建），独立 seed commit（R2a 棒）。
 * 实现目标：assets/scripts/ai/pimc.ts ——
 *   · 候选预排序改「新 moveOutcomeScore 升序 → compareMoves 决胜」后截断 maxCandidates
 *     （替代旧 compareMoves 字典序截断——字典序会把战略候选裁掉）；
 *   · 新参数 `mustInclude?: Move`：截断后若不含该结构化保底着法，强制替换末位；
 *   · 新导出 `pimcRank(args): RankedOption[]`（带分全排序，含 pass 若 includePass）；
 *     pimcArbitrate ≡ pimcRank(...)[0].move（单一权威）。
 *
 * ── 判别夹具原理（点数域全受控，同 S4 竞速夹具族）──
 *   手 `A 7 7` 跟单 6（地主仅剩 1 张，未见牌被历史逼死为 {8,9,10,J}）：
 *   出 A 每世界必胜、出 7 每世界必败。maxCandidates=1 时——
 *   旧截断（compareMoves 字典序）保留 7（小者靠前）→ 判 7（错）；
 *   新截断（outcome score：A 为 cost0 白跟）保留 A → 判 A（对）。红先行判据即此。
 *
 * ── 预期红（对 R2 基线 main，预跑实测）── 截断判别 1 红 + pimcRank/mustInclude 导出缺失红；其余绿。
 * ── 负向变异自证（执行者实现后自查）──
 *   ① 截断排序改回 compareMoves → 截断判别红。
 *   ② mustInclude 不生效 → 保底用例红。
 *   ③ pimcArbitrate 不再委托 pimcRank[0] → 单一权威用例红。
 */
import { describe, expect, it } from 'vitest';
import { legalFollows, recognize, type Move } from '../../assets/scripts/rules';
import { GamePhase, type GameEvent, type GameSnapshot } from '../../assets/scripts/game';
import { pimcArbitrate, pimcRank } from '../../assets/scripts/ai/pimc';
import { cards } from '../rules/_util';

function playEvents(specs: Array<[0 | 1 | 2, string]>): GameEvent[] {
  return specs.map(([seat, spec]) => ({ type: 'play' as const, seat, pattern: recognize(cards(spec))! }));
}

// 未见牌 = {8,9,10,J}：已出 47 张 = 全副 − 我手(A 7 7) − 未见 4 张（同 S4 夹具A 账目）。
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

function singleFollows(): Move[] {
  return legalFollows(SNAP.viewerHand!, SNAP.top!.pattern).filter((m) => m.cards.length === 1);
}

describe('W-AI-R2 pimc ranked 截断与 pimcRank', () => {
  it('D2 判别：maxCandidates=1 截断必须保留 outcome 最优（A），不得按字典序保留 7', () => {
    const verdict = pimcArbitrate({
      snapshot: SNAP, history: HISTORY, candidates: singleFollows(), includePass: false,
      profile: { samples: 8, maxCandidates: 1 },
    });
    expect(verdict).not.toBeNull();
    expect(verdict!.cards[0].rank, '截断后幸存者必须是白跟控牌 A').toBe(14);
  });

  it('mustInclude 保底：候选被截断也必须保留调用方指定的结构化保底', () => {
    const follows = singleFollows();
    const seven = follows.find((m) => m.cards[0].rank === 7)!;
    const ranked = pimcRank({
      snapshot: SNAP, history: HISTORY, candidates: follows, includePass: false,
      profile: { samples: 8, maxCandidates: 1 }, mustInclude: seven,
    });
    const rankedKeys = ranked.filter((o) => o.move !== null)
      .map((o) => o.move!.cards.map((c) => `${c.rank}`).join('.'));
    expect(rankedKeys, '保底 7 必须在选项集内').toContain('7');
  });

  it('pimcRank：全排序带分、分数单调不增、[0] ≡ pimcArbitrate（单一权威）', () => {
    const args = {
      snapshot: SNAP, history: HISTORY, candidates: singleFollows(), includePass: true,
      profile: { samples: 16, maxCandidates: 8 },
    };
    const ranked = pimcRank(args);
    expect(ranked.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < ranked.length; i += 1) {
      expect(ranked[i - 1].score, '排序分数单调不增').toBeGreaterThanOrEqual(ranked[i].score);
    }
    const verdict = pimcArbitrate(args);
    const head = ranked[0].move;
    expect(
      head === null ? null : head.cards.map((c) => c.rank).join('.'),
    ).toBe(verdict === null ? null : verdict.cards.map((c) => c.rank).join('.'));
  });

  it('确定性：pimcRank 两跑深相等；候选反序同榜', () => {
    const base = {
      snapshot: SNAP, history: HISTORY, includePass: true,
      profile: { samples: 16, maxCandidates: 8 },
    };
    const forward = pimcRank({ ...base, candidates: singleFollows() });
    const again = pimcRank({ ...base, candidates: singleFollows() });
    const reversed = pimcRank({ ...base, candidates: singleFollows().reverse() });
    expect(again).toEqual(forward);
    expect(reversed).toEqual(forward);
  });
});
