/**
 * W-AI-R2 种子：玩家场景回归夹具（规划者预写红种子 · 2026-07-17 · sota2 · 打回证据①）。
 *
 * 落位：Codex 逐字节复制到 test/ai/wing-regression.test.ts（新建），独立 seed commit（R2a 棒）。
 *
 * ── 契约（穿透 pimc 钉「最终决策」，非中间量）──
 *   场景 B（打回原案）：手 `3,4,5,6,7,10,888,999,2` 领出——
 *     旧引擎打 `888999+{10,2}`（把 2 当翼甩出保顺子，玩家实测投诉）；
 *     新契约：**必须领顺子 34567**（保住 2 与飞机作中后期资产）。
 *   场景 A（取证反证回归）：手 `888,999,3,2,K` 领出——孤立散单下新旧引擎都应留 2
 *     （决策 cards 不含 rank 2）。
 *   清手豁免：手 `10,888,999,2` 领出——整手 AirplaneSingles 一手清完（带 2 收官合法）。
 *   确定性：三夹具 rng 无关。
 *
 * ── 预期红（对 R2 基线 main，预跑实测）── 场景 B 1 用例红（旧引擎打飞机带 2）；A/清手/确定性绿。
 * ── 负向变异自证（执行者实现后自查）──
 *   ① controlSpend 置 0（回退旧口径）→ 场景 B 红。
 *   （v2 修订·R2a 阻断④：原自证②「清手豁免删除→清手用例红」系规划者过度承诺——
 *    hard 管线的 chooseFinishingMove/finishingFollow 在评分之前拦截整手清完，评分层豁免
 *    参与不到最终决策；该变异的单点权威自证在 hand-weight「清手豁免」夹具（已实测恰红 1）。
 *    本文件的清手用例定位为**管线级行为回归钉**：守「整手清完必被拦截执行」，不承诺评分层变异红。）
 */
import { describe, expect, it } from 'vitest';
import { strategyFor, AiLevel } from '../../assets/scripts/ai';
import { createRng, recognize, Category, Rank } from '../../assets/scripts/rules';
import { GamePhase, type GameSnapshot } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const hard = strategyFor(AiLevel.Hard);

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [13, 17, 17],
    winner: null,
    viewerHand: cards('3 4 5 6 7 10 8 8 8 9 9 9 2'),
    ...over,
  };
}

describe('W-AI-R2 翼缺陷玩家场景回归', () => {
  it('场景 B（打回原案）：领出必为顺子 34567，绝不打 888999 带 2（穿透 pimc 的最终决策钉）', () => {
    const action = hard(snap({}), createRng(1));
    expect(action.type).toBe('play');
    if (action.type !== 'play') return;
    const pattern = recognize(action.cards)!;
    expect(pattern.category, '应领顺子而非飞机').toBe(Category.Straight);
    expect(action.cards).toHaveLength(5);
    expect(pattern.mainRank).toBe(Rank.R7);
    expect(action.cards.some((c) => c.rank === Rank.R2), '2 不得被当翼甩出').toBe(false);
  });

  it('场景 A（取证反证回归）：孤立散单下留 2——决策不含 rank 2', () => {
    const s = snap({ viewerHand: cards('8 8 8 9 9 9 3 2 K'), handCounts: [9, 17, 17] });
    const action = hard(s, createRng(2));
    expect(action.type).toBe('play');
    if (action.type !== 'play') return;
    expect(action.cards.some((c) => c.rank === Rank.R2), '孤立散单局面必须保住 2').toBe(false);
  });

  it('清手豁免：整手 888999+{10,2} 一手清完（终局带 2 收官合法）', () => {
    const s = snap({ viewerHand: cards('10 8 8 8 9 9 9 2'), handCounts: [8, 3, 3] });
    const action = hard(s, createRng(3));
    expect(action.type).toBe('play');
    if (action.type !== 'play') return;
    expect(action.cards, '整手清完').toHaveLength(8);
    expect(recognize(action.cards)!.category).toBe(Category.AirplaneSingles);
  });

  it('确定性：三夹具与 rng 无关', () => {
    for (const fixture of [
      snap({}),
      snap({ viewerHand: cards('8 8 8 9 9 9 3 2 K'), handCounts: [9, 17, 17] }),
      snap({ viewerHand: cards('10 8 8 8 9 9 9 2'), handCounts: [8, 3, 3] }),
    ]) {
      expect(hard(fixture, createRng(7))).toEqual(hard(fixture, createRng(99)));
    }
  });
});
