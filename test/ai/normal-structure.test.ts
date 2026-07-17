/**
 * W-AI S7 种子：Normal 档结构引擎行为契约（规划者预写红种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制到 test/ai/normal-structure.test.ts（新建），独立 seed commit（B2 棒）。
 * 实现目标：assets/scripts/ai/levels/normal.ts 升级为「结构轻量版」（用户裁决：全体上移）——
 *   · 跟牌：小预算 Decomposer（nodeBudget 30k）——cost≤0 白跟最小 / cost==1 且主点 < A 跟最小 /
 *     其余 pass（拆高位结构宁可让牌）；无安全跟法沿用 conservativeAction 的炸弹语义。
 *   · 领出：新增喂队友（队友报单/报双且地主未告急时喂最小单/对）；其余领出维持 chooseNormalLeadMove。
 *   · 清手检测（canFinishInOneMove/finishingFollow）前置。
 *   · 确定性不变（rng 无关）。
 *
 * ── 预期红（对 main 现 Normal=conservativeAction）──
 *   ① 孤张白跟用例红（旧实现出 5，新契约出 7）；
 *   ② 高位拆结构 pass 用例红（旧实现拆 2 跟牌）；
 *   ③ 喂队友用例红（旧实现领出对 99）。
 *   其余（保护牌/确定性）对旧实现即绿（回归性质）。
 *
 * ── 负向变异自证（执行者实现后自查，报告注明红几条）──
 *   ① 白跟选择改回「最小安全牌优先」（无视结构代价）→ 孤张用例红。
 *   ② 喂队友条件去掉「地主未告急」守卫 → 告急用例红。
 */
import { describe, expect, it } from 'vitest';
import { strategyFor, AiLevel } from '../../assets/scripts/ai';
import { createRng, recognize, Rank } from '../../assets/scripts/rules';
import { GamePhase, type GameSnapshot, type SeatIndex, type TopPlay } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const normal = strategyFor(AiLevel.Normal);

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [5, 5, 5],
    winner: null,
    viewerHand: cards('3 4 5'),
    ...over,
  };
}

const topFrom = (seat: SeatIndex, spec: string): TopPlay => ({ seat, pattern: recognize(cards(spec))! });

describe('W-AI S7 Normal 结构引擎（全体上移）', () => {
  it('孤张白跟：top=单4、手 5 5 7 9 → 出孤张 7（结构代价 0），不拆对 5', () => {
    const s = snap({ top: topFrom(1, '4'), viewerHand: cards('5 5 7 9'), handCounts: [4, 5, 5] });
    const a = normal(s, createRng(1));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(1);
      expect(a.cards[0].rank).toBe(Rank.R7);
    }
  });

  it('高位不拆结构：top=单A、手 2 2 5（跟牌只能拆对 2）→ pass 保结构', () => {
    const s = snap({ top: topFrom(1, 'A'), viewerHand: cards('2 2 5'), handCounts: [3, 5, 5] });
    expect(normal(s, createRng(2)).type).toBe('pass');
  });

  it('喂队友：农民领出、队友报单、地主未告急 → 喂最小单 3（不再打对 99）', () => {
    const s = snap({
      turn: 1,
      landlord: 0,
      top: null,
      viewerHand: cards('3 6 9 9'),
      handCounts: [5, 4, 1],
    });
    const a = normal(s, createRng(3));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(1);
      expect(a.cards[0].rank).toBe(Rank.R3);
    }
  });

  it('地主告急时不喂：地主 ≤2 张 → 不走喂牌（照常组合领出）', () => {
    const s = snap({
      turn: 1,
      landlord: 0,
      top: null,
      viewerHand: cards('3 6 9 9'),
      handCounts: [2, 4, 1],
    });
    const a = normal(s, createRng(4));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards.length, '告急期不喂单 3——至少不是喂牌形态').toBeGreaterThanOrEqual(1);
      expect(a.cards[0].rank === Rank.R3 && a.cards.length === 1, '不得仍喂最小单').toBe(false);
    }
  });

  it('清手检测：跟牌整手可清必清（top=对3、手 4 4 → 出 44 结束）', () => {
    const s = snap({ top: topFrom(1, '3 3'), viewerHand: cards('4 4'), handCounts: [2, 5, 5] });
    const a = normal(s, createRng(5));
    expect(a.type).toBe('play');
    if (a.type === 'play') expect(a.cards).toHaveLength(2);
  });

  it('保护牌回归 + 确定性：top=单3、手 5 4444 → 出 5；rng 无关', () => {
    const s = snap({ top: topFrom(1, '3'), viewerHand: cards('5 4 4 4 4'), handCounts: [5, 5, 5] });
    const a = normal(s, createRng(6));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.cards).toHaveLength(1);
      expect(a.cards[0].rank).toBe(Rank.R5);
    }
    expect(normal(s, createRng(99))).toEqual(a);
  });
});
