import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { adviseBestMove, nextHint } from '../../assets/scripts/ai';
import type { GameEvent, GameSnapshot } from '../../assets/scripts/game';
import { validatePlay, type Card } from '../../assets/scripts/rules';

/**
 * 对采集到的提示流程快照做离线复核：
 * 首次提示、再次提示与最终出牌都要与真实捕获结果逐张一致。
 */
const CAPTURE = resolve(__dirname, '../../coordination/reports/V9-evidence/hint-capture.json');

interface HintCapture {
  capture: { snapshot: GameSnapshot; history: GameEvent[]; playerTurn: boolean; phase: string };
  sel1Cards: Card[];
  sel2Cards: Card[];
  playedCards: Card[];
}

const keysOf = (cards: Card[]): string[] => cards.map((c) => `${c.rank}:${c.suit}`).sort();

describe.skipIf(!existsSync(CAPTURE))('V9 提示流程采证精确对照', () => {
  const data: HintCapture = existsSync(CAPTURE) ? JSON.parse(readFileSync(CAPTURE, 'utf8')) : (null as never);

  it('捕获现场为 hero 出牌回合', () => {
    expect(data.capture.phase).toBe('playing');
    expect(data.capture.playerTurn).toBe(true);
    expect(data.capture.snapshot.turn).toBe(0);
  });

  it('升级后引擎对捕获现场推荐非空且合法；首点逐张等对照退役（披露）', () => {
    // W-AUDIT-AI 契约改写(披露):hint-capture.json 采于 v1.6 引擎,sel1Cards 是彼时 hardStrategy
    // 的推荐;引擎升级后逐张相等不可重放(重采需重跑 V9 流程)。委托链两段现各有专门契约:
    // ① UI 首点 → adviseBestMove:test/ui/hint-delegation.test.ts(applyHint 源码契约,Codex R1 补门);
    // ② adviseBestMove ≡ hardStrategy:test/ai/hint-advisor.test.ts 深相等。
    // 本处保留可离线复核的部分:升级后推荐对捕获现场仍非空、合法。
    const advised = adviseBestMove({ snapshot: data.capture.snapshot, history: data.capture.history });
    expect(advised).not.toBeNull();
    const top = data.capture.snapshot.top?.pattern ?? null;
    expect(validatePlay(advised!.cards, top).ok).toBe(true);
  });

  it('再点提示 === nextHint(prev=首点) 的循环产物（逐张），且与首点不同', () => {
    const hand = data.capture.snapshot.viewerHand!;
    const top = data.capture.snapshot.top?.pattern ?? null;
    const cycled = nextHint(hand, top, data.sel1Cards);
    expect(cycled).not.toBeNull();
    expect(keysOf(cycled!.cards)).toEqual(keysOf(data.sel2Cards));
    expect(keysOf(data.sel2Cards)).not.toEqual(keysOf(data.sel1Cards));
  });

  it('出牌 === 点击前所选（逐张）且 validatePlay 合法', () => {
    expect(keysOf(data.playedCards)).toEqual(keysOf(data.sel2Cards));
    const top = data.capture.snapshot.top?.pattern ?? null;
    expect(validatePlay(data.playedCards, top).ok).toBe(true);
  });
});
