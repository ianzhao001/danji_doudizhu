/**
 * W-AI 修订版：hard 纵深启发式对比锚（规划者修订种子 · 2026-07-17 · sota2 · 阻断④）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/ai/hard-depth.test.ts，独立 seed commit（B2 棒）。
 *
 * ── 修订依据（阻断④裁决：授权 Normal 结构领出）──
 *   已批计划三档组成表本就规定 Normal 领出 = moveOutcomeScore（结构+权重，不带 PIMC）——
 *   任务书 B2 第 2 条漏写领出升级，系规划者失误，本种子随裁决追认。旧用例①钉
 *   「Normal 领出=最小单 3」是旧 chooseNormalLeadMove 碎短顺规则的产物，与结构领出冲突，废止：
 *   · 档位对比改由 **Simple** 承接（Simple=chooseNormalLeadMove，碎短顺规则下确定出单 3）；
 *   · Normal 改**性质钉**：领出必为结构代价 ≤0 的白出、不动保护牌、rng 无关
 *     （具体选顺子还是别的白出组件由 B2 调参，契约不钉常数）。
 *   用例②③④逐字保留（③的 Normal 跟牌走结构轻量版 cost0 白跟路径，行为不变已推演）。
 *   分层护栏不变：quality Hard−Normal ≥ +0.05 与 SELFPLAY_GATE G3 ≥ +0.05 仍是硬门——
 *   Normal 增强不得吃掉 Hard 分层（调不拢先砍 Normal 增强面：喂队友降为 Hard 独占，再阻断）。
 *
 * ── 预期红（对 main 旧实现，预跑实测）── 用例① 1 红（旧 Normal 单 3 领出 cost=4 违白出性质），
 *   其余 3 绿（Simple 锚在旧 pickSmallest 下同样出单 3）。
 * ── 负向变异自证（执行者实现后自查）──
 *   ① Normal 领出退回旧碎短顺规则（单 3）→ 性质钉红。
 *   ② Simple 领出误升结构引擎 → Simple 锚红（档位对比消失）。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import { Decomposer } from '../../assets/scripts/ai/decompose';
import { protectedCards, usesProtectedCards } from '../../assets/scripts/ai/levels/_shared';
import { GamePhase, type GameSnapshot, type SeatIndex, type TopPlay } from '../../assets/scripts/game';
import { createRng, Rank, recognize } from '../../assets/scripts/rules';
import { runDifficultyMatchup, type MatchSummary } from '../selfplay/difficulty';
import { cards } from '../rules/_util';

const hard = strategyFor(AiLevel.Hard);
const normal = strategyFor(AiLevel.Normal);
const simple = strategyFor(AiLevel.Simple);

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [7, 7, 7],
    winner: null,
    viewerHand: cards('3 4 5 6 7 9 K'),
    ...over,
  };
}

function topPlay(seat: SeatIndex, spec: string): TopPlay {
  return { seat, pattern: recognize(cards(spec))! };
}

function playedRanks(action: ReturnType<typeof hard>): Rank[] {
  if (action.type !== 'play') return [];
  return action.cards.map((card) => card.rank);
}

function assertSelfplayInvariant(summary: MatchSummary): void {
  expect(summary.scores[0] + summary.scores[1] + summary.scores[2]).toBe(0);
  expect(summary.turns).toBeGreaterThan(0);
  expect(summary.turns).toBeLessThan(300);
}

describe('M4-42 hard AI 纵深启发式（W-AI 修订：档位对比下移至 Simple）', () => {
  it('非压迫领牌：hard 打成型顺子；Simple 锚定最小单 3；Normal 领出满足结构白出性质', () => {
    const s = snap({ viewerHand: cards('3 4 5 6 7 9 K'), handCounts: [7, 7, 7] });

    const hardAction = hard(s, createRng(1));
    expect(playedRanks(hardAction)).toEqual([Rank.R3, Rank.R4, Rank.R5, Rank.R6, Rank.R7]);

    // 档位对比锚（原 Normal 锚随结构领出授权下移）：Simple=chooseNormalLeadMove，
    // 本手无对无三、五张顺属「碎短顺」被其规则排除 → 确定出最小单 3。
    const simpleAction = simple(s, createRng(1));
    expect(playedRanks(simpleAction)).toEqual([Rank.R3]);

    // Normal 性质钉：结构领出=白出（cost≤0）、不动保护牌、rng 无关；不钉具体组件。
    const normalAction = normal(s, createRng(1));
    expect(normalAction.type).toBe('play');
    if (normalAction.type === 'play') {
      const hand = s.viewerHand!;
      const cost = new Decomposer().structureCost(hand, normalAction.cards);
      expect(cost, 'Normal 领出不得拆散最优分解').toBeLessThanOrEqual(0);
      const pattern = recognize(normalAction.cards);
      expect(pattern).not.toBeNull();
      expect(usesProtectedCards({ cards: normalAction.cards, pattern: pattern! }, protectedCards(hand))).toBe(false);
      expect(normal(s, createRng(99))).toEqual(normalAction);
    }
  });

  it('可一手走完时直接走完整手牌', () => {
    const action = hard(
      snap({ viewerHand: cards('3 4 5 6 7'), handCounts: [5, 7, 7] }),
      createRng(2),
    );

    expect(playedRanks(action)).toEqual([Rank.R3, Rank.R4, Rank.R5, Rank.R6, Rank.R7]);
  });

  it('农民非终结态不抢队友牌权', () => {
    const s = snap({
      turn: 2,
      landlord: 0,
      top: topPlay(1, '5'),
      viewerHand: cards('6 K'),
      handCounts: [8, 8, 2],
    });

    expect(hard(s, createRng(3))).toEqual({ type: 'pass', seat: 2 });

    const normalAction = normal(s, createRng(3));
    expect(playedRanks(normalAction)).toEqual([Rank.R6]);
  });

  it(
    '固定种子 selfplay：不变量保持（三档胜率排序契约已迁移至 T-AI-2 质量门）',
    async () => {
      const seeds = Array.from({ length: 12 }, (_, index) => index + 1);
      const hardLandlord = await runDifficultyMatchup([AiLevel.Hard, AiLevel.Normal, AiLevel.Normal], seeds);
      const normalBaseline = await runDifficultyMatchup([AiLevel.Normal, AiLevel.Normal, AiLevel.Normal], seeds);

      for (const summary of hardLandlord.concat(normalBaseline)) {
        assertSelfplayInvariant(summary);
        expect(summary.landlord).toBe(0);
      }

      // 困难档相对普通档的胜率约束以单独质量门为准（test/selfplay/quality.test.ts T-AI-2）。
      // 历史注记：T-AI-1 强化普通档后曾出现 12-seed 代理反转（Hard 0.5 vs Normal 0.667），
      // 登记为过渡态。W-AUDIT-AI（2026-07-13）拆解内核+结构化叫分落地后过渡态关闭：
      // T-AI-2 实测 Hard−Normal=+0.117、Hard−Simple=+0.567，门槛已收紧至 ≥+0.05/≥+0.15。
      // W-AI（2026-07-17）全体上移后底线随 BOARD 披露 re-baseline。本用例只保留 selfplay 不变量。
    },
    60000,
  );
});
