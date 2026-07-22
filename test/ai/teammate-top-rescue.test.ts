/**
 * sota2-R4 B5 种子①（规划者预写红种子 · 2026-07-21 · sota2）：
 * 队友顶牌不再无条件让——地主残牌（≤2 张）时必须用非炸大牌抢权救场。
 *
 * 落位：Codex 逐字节复制到 test/ai/teammate-top-rescue.test.ts，独立 seed commit（先红取证）。
 * 预期红（对当前 main，规划者已预验）：用例① 红（hard.ts:591 无条件 pass）；②③ 绿（行为锚）。
 *
 * 负向变异自证（实现后逐条自查，报告注明红几条）：
 *   ① 恢复 591 无条件让（去掉 landlord 残牌条件）→ 用例① 红。
 *   ② 救场分支不滤炸（直接 pickLargest(moves) 含炸）→ 用例③ 红（烧炸）。
 *   ③ 兜底阈值改成"永不让"（landlord>0）→ 用例② 红（误伤正常让牌）。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import { GamePhase, type GameSnapshot, type SeatIndex, type TopPlay } from '../../assets/scripts/game';
import { Rank, recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const hard = strategyFor(AiLevel.Hard);
const rng = { next: () => 0 };

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 2,
    top: null,
    handCounts: [5, 4, 1],
    winner: null,
    viewerHand: cards('5 5 5 5 A'),
    ...over,
  };
}

function topPlay(seat: SeatIndex, spec: string): TopPlay {
  return { seat, pattern: recognize(cards(spec))! };
}

function playedRanks(action: ReturnType<typeof hard>): Rank[] {
  if (action.type !== 'play') return [];
  return action.cards.map((card) => card.rank).sort((a, b) => a - b);
}

describe('sota2-R4 B5 队友顶 + 地主告急救场', () => {
  it('① 地主剩 1 张、队友顶单 3：必须用非炸大牌（A）抢权，不许 pass', () => {
    const s = snap({ top: topPlay(1, '3'), handCounts: [5, 4, 1] });
    const a = hard(s, rng, []);
    expect(a.type).toBe('play');
    expect(playedRanks(a)).toEqual([Rank.A]);
  });

  it('② 地主还有 5 张：维持让牌（teammate-top 让牌兜底不被误伤）', () => {
    const s = snap({ top: topPlay(1, '3'), handCounts: [5, 4, 5] });
    expect(hard(s, rng, []).type).toBe('pass');
  });

  it('③ 地主剩 1 张但仅炸可压队友的 A：不烧炸炸队友，过牌', () => {
    const s = snap({ top: topPlay(1, 'A'), handCounts: [5, 4, 1], viewerHand: cards('5 5 5 5 4') });
    expect(hard(s, rng, []).type).toBe('pass');
  });
});
