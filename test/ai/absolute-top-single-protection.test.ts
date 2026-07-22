/**
 * sota2-R4 B5 种子②（规划者预写红种子 · 2026-07-21 · sota2）：
 * 绝对顶单跟牌不得拆火箭/四张炸弹的保护牌去顶一张小单。
 *
 * 落位：Codex 逐字节复制到 test/ai/absolute-top-single-protection.test.ts，独立 seed commit（先红取证）。
 * 预期红（对当前 main，规划者已预验）：用例① 红（hard.ts:314-324 不查 protectedCards，
 *   手握双王时会拆出单小王去顶 A）；② 绿（行为锚：孤张大王合理夺权不受误伤）。
 *
 * 负向变异自证（实现后逐条自查，报告注明红几条）：
 *   ① 删掉 usesProtectedCards 过滤 → 用例① 红。
 *   ② 过滤扩大成"任何王都不出"→ 用例② 红（孤张大王夺权被误杀）。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import { GamePhase, type GameEvent, type GameSnapshot, type SeatIndex, type TopPlay } from '../../assets/scripts/game';
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
    handCounts: [4, 5, 3],
    winner: null,
    viewerHand: cards('x X 3 3'),
    ...over,
  };
}

function topPlay(seat: SeatIndex, spec: string): TopPlay {
  return { seat, pattern: recognize(cards(spec))! };
}

function played(seat: SeatIndex, spec: string): GameEvent {
  return { type: 'play', seat, pattern: recognize(cards(spec))! };
}

function playedRanks(action: ReturnType<typeof hard>): Rank[] {
  if (action.type !== 'play') return [];
  return action.cards.map((card) => card.rank).sort((a, b) => a - b);
}

describe('sota2-R4 B5 绝对顶单保护', () => {
  it('① 手握火箭+对3：地主顶单 A 时不拆小王去顶，宁可过牌保火箭', () => {
    const s = snap({ top: topPlay(2, 'A'), handCounts: [4, 5, 3], viewerHand: cards('x X 3 3') });
    const a = hard(s, rng, [played(2, 'A')]);
    expect(a.type).toBe('pass');
  });

  it('② 孤张大王（无火箭）仍作为绝对顶单夺权（行为锚）', () => {
    const s = snap({ top: topPlay(2, '7'), handCounts: [3, 5, 4], viewerHand: cards('X 7 7') });
    const a = hard(s, rng, [played(2, '7')]);
    expect(playedRanks(a)).toEqual([Rank.BigJoker]);
  });
});
