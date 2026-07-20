/**
 * W-AI-R3（B0 立度量）：提示单一权威闭合门 + 确定性。
 * 三方审查 #20 / R1 提示合流：提示按钮着法（adviseBestMove）必须 == 候选榜首名
 * （rankHintCandidates.hints[0]）——「点击=困难档最优」单一权威。当前靠强制置顶成立，
 * B3 合流后靠「同一次决策分析」成立；此门跨 B3 稳定，若二次排序更优却未纠正首选即红。
 * 用真实自对弈帧（牌数守恒）驱动，非手构快照。
 *
 * ── 负向变异自证 ──
 *   ① 提示首选与榜首解耦（去置顶又不合流）→ 闭合用例红；
 *   ② adviseBestMove 引入非确定性 → 确定性用例红。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel, chooseBidByLevel, strategyFor } from '../../assets/scripts/ai';
import { adviseBestMove, rankHintCandidates } from '../../assets/scripts/ai/hint';
import { runHeadlessRound, type BidPolicy, type PlayPolicy } from '../../assets/scripts/flow';
import type { GameEvent, GameSnapshot } from '../../assets/scripts/game';
import type { Card } from '../../assets/scripts/rules';

const FRAME_CAP = 18;
const SEEDS = [1, 2, 3, 4, 5];

function key(cs: Card[]): string {
  return cs.map((c) => `${c.rank}:${c.suit}`).sort().join('|');
}

interface Frame { snapshot: GameSnapshot; history: GameEvent[]; }

describe('W-AI-R3 提示单一权威闭合 + 确定性', () => {
  it('提示首选 == 候选榜首名（真实帧，牌数守恒时走 PIMC）', async () => {
    const frames: Frame[] = [];
    const levels: [AiLevel, AiLevel, AiLevel] = [AiLevel.Hard, AiLevel.Hard, AiLevel.Hard];
    const bidPolicy: BidPolicy = ({ seat, state, hand }) => chooseBidByLevel(hand, state, levels[seat]);
    const playPolicy: PlayPolicy = ({ snapshot, rng, history }) => {
      const events = history ?? [];
      if (frames.length < FRAME_CAP && (snapshot.viewerHand?.length ?? 0) > 0) {
        frames.push(JSON.parse(JSON.stringify({ snapshot, history: events })) as Frame);
      }
      return strategyFor(levels[snapshot.turn])(snapshot, rng, events);
    };
    for (const seed of SEEDS) {
      if (frames.length >= FRAME_CAP) break;
      await runHeadlessRound({ seed, playPolicy, bidPolicy });
    }
    expect(frames.length, '捕获帧 sanity').toBeGreaterThan(6);

    let closure = 0;
    let ranked = 0;
    for (const fx of frames) {
      const viewerSeat = fx.snapshot.turn;
      const advised = adviseBestMove({ snapshot: fx.snapshot, history: fx.history, viewerSeat });
      const result = rankHintCandidates({ snapshot: fx.snapshot, history: fx.history, viewerSeat });
      if (result.kind === 'ranked') {
        ranked += 1;
        expect(advised, '有候选榜时提示首选不应为空').not.toBeNull();
        expect(key(result.hints[0].move.cards), '提示首选必须==候选榜首名').toBe(key(advised!.cards));
        closure += 1;
      } else if (result.kind === 'passAdvice') {
        expect(advised, '建议过牌时 adviseBestMove 应为 null').toBeNull();
      }
    }
    console.log('[hint-regret]', JSON.stringify({ frames: frames.length, ranked, closure }));
    expect(ranked, '至少若干帧走到候选榜').toBeGreaterThan(0);
  }, 120_000);

  it('adviseBestMove 确定性：同帧两次调用逐张相等', async () => {
    const frames: Frame[] = [];
    const levels: [AiLevel, AiLevel, AiLevel] = [AiLevel.Hard, AiLevel.Hard, AiLevel.Hard];
    const bidPolicy: BidPolicy = ({ seat, state, hand }) => chooseBidByLevel(hand, state, levels[seat]);
    const playPolicy: PlayPolicy = ({ snapshot, rng, history }) => {
      const events = history ?? [];
      if (frames.length < 6 && (snapshot.viewerHand?.length ?? 0) > 0) {
        frames.push(JSON.parse(JSON.stringify({ snapshot, history: events })) as Frame);
      }
      return strategyFor(levels[snapshot.turn])(snapshot, rng, events);
    };
    await runHeadlessRound({ seed: 7, playPolicy, bidPolicy });
    for (const fx of frames) {
      const a = adviseBestMove({ snapshot: fx.snapshot, history: fx.history, viewerSeat: fx.snapshot.turn });
      const b = adviseBestMove({ snapshot: fx.snapshot, history: fx.history, viewerSeat: fx.snapshot.turn });
      expect(a === null ? null : key(a.cards)).toBe(b === null ? null : key(b.cards));
    }
  }, 60_000);
});
