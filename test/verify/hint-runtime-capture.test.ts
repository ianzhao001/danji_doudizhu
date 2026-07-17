/**
 * W-AI-R2 修订版：提示链路运行时闭合门（规划者修订种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/verify/hint-runtime-capture.test.ts，独立 seed commit（R2a 棒）。
 *
 * ── 修订依据 ──
 *   提示会话重构后，第二按语义从 nextHint 轮圈改为「榜单会话轮换」——离线复算改用
 *   pickHint 会话链（首按建会话 → 第二按对照 sel2）。探针扩容（R2a 任务书）：
 *   capture 增 `sel3Cards?`（第三按）与 `passAdvice?: { snapshot; history; toastText }`
 *   （AI 建议过牌场景截图+toast 文本）——两块为可选，存在即校验。
 *   凡改提示链路必须冷构建后重跑探针刷新本证据（KNOWN_LIMITATIONS 常驻规矩）。
 *
 * ── 预期红（对 R2 基线 main）── pickHint 三态签名未落 → 会话复算用例红；
 *   探针未扩容前 sel3/passAdvice 块缺省跳过（不红）。
 * ── 负向变异自证：探针刷新后把 capture 里 sel2 篡改为任一其他合法着法 → 会话复算红。
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { adviseBestMove, rankHintCandidates } from '../../assets/scripts/ai';
import { pickHint } from '../../assets/scripts/ui/hint-flow';
import type { GameEvent, GameSnapshot } from '../../assets/scripts/game';
import { validatePlay, type Card } from '../../assets/scripts/rules';

const CAPTURE = new URL('../../coordination/reports/W-AUDIT-AI-evidence/hint-capture.json', import.meta.url);

interface HintCapture {
  capturedAt: string;
  difficulty: string;
  capture: { phase: string; playerTurn: boolean; snapshot: GameSnapshot; history: GameEvent[] };
  sel1Cards: Card[];
  sel2Cards: Card[];
  sel3Cards?: Card[];
  playedCards: Card[];
  passAdvice?: { snapshot: GameSnapshot; history: GameEvent[]; toastText: string };
  pageErrors: string[];
}

const data = JSON.parse(readFileSync(CAPTURE, 'utf8')) as HintCapture;
const keysOf = (list: Card[]): string[] => list.map((c) => `${c.rank}:${c.suit}`).sort();

describe('提示链路运行时闭合(真机 CDP 点击采证 · W-AI-R2 会话语义)', () => {
  it('采证现场:困难档、hero 出牌回合、零 pageErrors', () => {
    expect(data.difficulty).toBe('hard');
    expect(data.capture.phase).toBe('playing');
    expect(data.capture.playerTurn).toBe(true);
    expect(data.pageErrors).toEqual([]);
  });

  it('真实首按选中 === adviseBestMove(捕获快照+历史) 逐张(端到端闭合)', () => {
    const advised = adviseBestMove({
      snapshot: data.capture.snapshot,
      history: data.capture.history,
    });
    expect(advised, '推荐不应为空').not.toBeNull();
    expect(keysOf(data.sel1Cards)).toEqual(keysOf(advised!.cards));
  });

  it('真实首按 === 纯岛 pickHint(空会话首按)——UI 走的确是被契约把守的入口', () => {
    const first = pickHint({
      snapshot: data.capture.snapshot,
      history: data.capture.history,
      selected: [],
      session: null,
    });
    expect(first.kind).toBe('move');
    if (first.kind === 'move') expect(keysOf(data.sel1Cards)).toEqual(keysOf(first.move.cards));
  });

  it('第二按 === 会话轮换产物(榜单第 2 项)，且与首按不同', () => {
    const first = pickHint({
      snapshot: data.capture.snapshot,
      history: data.capture.history,
      selected: [],
      session: null,
    });
    expect(first.kind).toBe('move');
    if (first.kind !== 'move') return;
    const second = pickHint({
      snapshot: data.capture.snapshot,
      history: data.capture.history,
      selected: first.move.cards,
      session: first.session,
    });
    expect(second.kind).toBe('move');
    if (second.kind !== 'move') return;
    expect(keysOf(data.sel2Cards)).toEqual(keysOf(second.move.cards));
    expect(keysOf(data.sel2Cards)).not.toEqual(keysOf(data.sel1Cards));

    if (data.sel3Cards) {
      const third = pickHint({
        snapshot: data.capture.snapshot,
        history: data.capture.history,
        selected: second.move.cards,
        session: second.session,
      });
      expect(third.kind).toBe('move');
      if (third.kind === 'move') expect(keysOf(data.sel3Cards)).toEqual(keysOf(third.move.cards));
    }
  });

  it('出牌 === 点击前所选,且 validatePlay 合法', () => {
    const finalSel = data.sel3Cards ?? data.sel2Cards;
    expect(keysOf(data.playedCards)).toEqual(keysOf(finalSel));
    const top = data.capture.snapshot.top?.pattern ?? null;
    expect(validatePlay(data.playedCards, top).ok).toBe(true);
  });

  it('passAdvice 采证(探针扩容后)：离线复算同判且 toast 文案正确', () => {
    if (!data.passAdvice) return; // 扩容前缺省——探针刷新后必须存在(任务书出口条件)
    const ranked = rankHintCandidates({
      snapshot: data.passAdvice.snapshot,
      history: data.passAdvice.history,
    });
    expect(ranked.kind).toBe('passAdvice');
    expect(data.passAdvice.toastText).toBe('建议不出，保留手牌');
  });

  it('公开底牌通道在真机生效(RoundState v2:快照带 3 张明牌底牌)', () => {
    expect(data.capture.snapshot.bottom).toHaveLength(3);
  });
});
