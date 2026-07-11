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

  it('首点提示 === adviseBestMove(捕获快照+历史) 的推荐（逐张）', () => {
    const advised = adviseBestMove({ snapshot: data.capture.snapshot, history: data.capture.history });
    expect(advised).not.toBeNull();
    expect(keysOf(advised!.cards)).toEqual(keysOf(data.sel1Cards));
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
