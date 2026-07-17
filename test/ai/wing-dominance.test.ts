/**
 * W-AI-R2 种子：翼支配守护门（规划者预写 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制到 test/ai/wing-dominance.test.ts（新建），独立 seed commit（R2a 棒）。
 *
 * ── 契约（weights-only 纯打分面，防「弃控牌翼」类退化复辟的长期守护）──
 *   对领出决策：若存在与所选着法**同型同链同长**、结构代价相同、而「控牌质量」严格更低的
 *   翼变体，则所选不得携带更贵控牌（controlMass：王=4、2=3、A=1、其余=0，翼位求和）。
 *   即：等价结构下，翼永远拿最便宜的。
 *
 * ── 预期红 ── 对旧实现即绿（旧式等代价下靠余牌项同样偏好留控牌）——**守护门**；
 *   真正的跨代价判别在 wing-regression 场景 B。负向自证：controlSpend 取反（弃控牌得奖励）
 *   → 本门红（构造翼变体必选贵者）。
 */
import { describe, expect, it } from 'vitest';
import { hardStrategyWithProfile } from '../../assets/scripts/ai/levels/hard';
import { Decomposer } from '../../assets/scripts/ai/decompose';
import { createRng, enumerateMoves, recognize, Rank, type Card, type Move } from '../../assets/scripts/rules';
import { GamePhase, type GameSnapshot } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const weightsOnly = hardStrategyWithProfile({ samples: 0, maxCandidates: 8 });

const CONTROL_MASS: Partial<Record<number, number>> = {
  [Rank.A]: 1, [Rank.R2]: 3, [Rank.SmallJoker]: 4, [Rank.BigJoker]: 4,
};

function controlMassOf(move: Move, coreRanks: Set<number>): number {
  return move.cards
    .filter((card) => !coreRanks.has(card.rank))
    .reduce((sum, card) => sum + (CONTROL_MASS[card.rank] ?? 0), 0);
}

function coreRanksOf(move: Move): Set<number> {
  const counts = new Map<number, number>();
  for (const card of move.cards) counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
  return new Set([...counts.entries()].filter(([, n]) => n >= 3).map(([rank]) => rank));
}

function snap(hand: Card[], counts: [number, number, number]): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: counts,
    winner: null,
    viewerHand: hand,
  };
}

const FIXTURES: Array<{ name: string; hand: Card[]; counts: [number, number, number] }> = [
  { name: '场景B', hand: cards('3 4 5 6 7 10 8 8 8 9 9 9 2'), counts: [13, 17, 17] },
  { name: '场景A', hand: cards('8 8 8 9 9 9 3 2 K'), counts: [9, 17, 17] },
  { name: '三带域', hand: cards('4 4 4 3 6 2 K'), counts: [7, 9, 9] },
];

describe('W-AI-R2 翼支配守护门（等价结构下翼取最便宜）', () => {
  for (const fixture of FIXTURES) {
    it(`${fixture.name}：所选着法不被「同型同链等代价而控牌更便宜」的翼变体支配`, () => {
      const s = snap(fixture.hand, fixture.counts);
      const action = weightsOnly(s, createRng(1));
      expect(action.type).toBe('play');
      if (action.type !== 'play') return;
      const chosen = recognize(action.cards)!;
      const chosenMove: Move = { cards: action.cards, pattern: chosen };
      const core = coreRanksOf(chosenMove);
      const d = new Decomposer();
      const chosenCost = d.structureCost(fixture.hand, action.cards);
      const chosenMass = controlMassOf(chosenMove, core);

      const rivals = enumerateMoves(fixture.hand).filter((move) =>
        move.pattern.category === chosen.category
        && move.pattern.mainRank === chosen.mainRank
        && move.pattern.length === chosen.length
        && move.cards.length === action.cards.length);
      const dominators = rivals.filter((rival) =>
        controlMassOf(rival, core) < chosenMass
        && d.structureCost(fixture.hand, rival.cards) === chosenCost);
      expect(
        dominators.map((m) => m.cards.map((c) => c.rank).join('.')),
        `${fixture.name}: 所选(mass=${chosenMass}, cost=${chosenCost})被等代价更廉翼变体支配`,
      ).toEqual([]);
    });
  }

  it('确定性：三夹具 weights-only 决策与 rng 无关', () => {
    for (const fixture of FIXTURES) {
      const s = snap(fixture.hand, fixture.counts);
      expect(weightsOnly(s, createRng(5))).toEqual(weightsOnly(s, createRng(55)));
    }
  });
});
