/**
 * M4-08 AI 合法性不变量审计（测试护栏）。架构种入·不可改：下列不变量断言不可改；
 * 实现方可新增 helper 于 test/ai/_*.ts 或新增快照，不得削弱既有断言。
 * 当前三档应已满足——若发现非法动作，记入报告。
 */
import { describe, it, expect } from 'vitest';
import { AiLevel, strategyFor } from '../../assets/scripts/ai';
import { validatePlay } from '../../assets/scripts/rules';
import { GamePhase, type GameSnapshot, type TopPlay } from '../../assets/scripts/game';
import { createRng, recognize, Rank, Suit, type Card } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const LEVELS = [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard] as const;
const RNGS = [createRng(1), createRng(2), createRng(3)];

function snap(turn: 0 | 1 | 2, top: TopPlay | null, viewerHand: Card[]): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn,
    landlord: 0,
    top,
    handCounts: [viewerHand.length, 10, 10],
    winner: null,
    viewerHand,
  };
}

// 覆盖性快照：自由领出、跟单张、跟对子、含炸弹/火箭手牌、少手牌
const SNAPSHOTS: { name: string; turn: 0 | 1 | 2; top: TopPlay | null; hand: Card[] }[] = [
  { name: 'free-lead', turn: 0, top: null, hand: cards('3 4 5 6 7 8 9 10 J Q K A 2 x X') },
  { name: 'follow-single-3', turn: 0, top: { seat: 1, pattern: recognize(cards('3'))! }, hand: cards('5 9 K A 2 x X') },
  { name: 'follow-pair-7', turn: 0, top: { seat: 1, pattern: recognize(cards('7 7'))! }, hand: cards('5 5 9 9 K K 2 2 x X') },
  { name: 'follow-straight', turn: 0, top: { seat: 1, pattern: recognize(cards('3 4 5 6 7'))! }, hand: cards('4 5 6 7 8 9 10 J Q K A 2 x X') },
  { name: 'hand-with-bomb', turn: 0, top: { seat: 1, pattern: recognize(cards('J'))! }, hand: cards('5 5 5 5 K 2 x X') },
  { name: 'small-hand', turn: 0, top: { seat: 1, pattern: recognize(cards('3'))! }, hand: cards('5') },
];

describe('M4-08 AI 合法性不变量', () => {
  for (const s of SNAPSHOTS) {
    for (const level of LEVELS) {
      for (let r = 0; r < RNGS.length; r++) {
        it(`${s.name} / ${level} / rng${r + 1}：产出合法动作`, () => {
          const snapshot = snap(s.turn, s.top, s.hand);
          const action = strategyFor(level)(snapshot, RNGS[r]);
          expect(['play', 'pass']).toContain(action.type);

          if (action.type === 'pass') {
            // 自由领出不得 pass
            expect(snapshot.top).not.toBeNull();
            return;
          }

          // play：validatePlay 通过 + 牌都在手
          const result = validatePlay(action.cards, snapshot.top?.pattern ?? null);
          expect(result.ok).toBe(true);
          for (const card of action.cards) {
            expect(s.hand.some((h) => h.rank === card.rank && h.suit === card.suit)).toBe(true);
          }
        });
      }
    }
  }
});
