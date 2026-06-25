import { describe, it, expect } from 'vitest';
import { chooseAction } from '../../assets/scripts/ai';
import { createRng, recognize, validatePlay } from '../../assets/scripts/rules';
import { GamePhase, type GameSnapshot } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [5, 5, 5],
    winner: null,
    viewerHand: cards('3 4 5 6 7'),
    ...over,
  };
}

describe('ai-baseline chooseAction', () => {
  it('领出返回合法 play（cards⊆手牌、可识别、seat=turn）', () => {
    const a = chooseAction(snap({ top: null }), createRng(1));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(a.seat).toBe(0);
      expect(recognize(a.cards)).not.toBeNull();
    }
  });

  it('有可压牌时跟牌压过 top', () => {
    const top = { seat: 1 as const, pattern: recognize(cards('3'))! }; // 单张 3
    const a = chooseAction(snap({ top, viewerHand: cards('4 5 9') }), createRng(2));
    expect(a.type).toBe('play');
    if (a.type === 'play') {
      expect(validatePlay(a.cards, top.pattern).ok).toBe(true);
    }
  });

  it('无可压牌时返回 pass', () => {
    const top = { seat: 1 as const, pattern: recognize(cards('2'))! }; // 单张 2（最大非王单）
    const a = chooseAction(snap({ top, viewerHand: cards('3 4 5') }), createRng(3));
    expect(a.type).toBe('pass');
  });
});
