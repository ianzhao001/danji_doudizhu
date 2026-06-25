import { describe, it, expect } from 'vitest';
import { settle } from '../../assets/scripts/game/settlement';
import { Side, type GameEvent } from '../../assets/scripts/game';
import { recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const pat = recognize(cards('3'))!;
const play = (seat: 0 | 1 | 2): GameEvent => ({ type: 'play', seat, pattern: pat });

describe('settlement 结算', () => {
  it('无炸无春、bidMultiplier=1、地主(0)赢 → scores [+2,-1,-1]', () => {
    const events: GameEvent[] = [play(0), play(1), play(2), play(0)];
    const r = settle({ landlord: 0, winner: Side.Landlord, bidMultiplier: 1, events });
    expect(r.multiplier).toBe(1);
    expect(r.spring).toBe('none');
    expect(r.scores).toEqual([2, -1, -1]);
  });

  it('1 个炸弹 + bidMultiplier=2 → bombs=1，multiplier=4', () => {
    const events: GameEvent[] = [play(0), { type: 'bomb', seat: 0 }, play(1), play(2)];
    const r = settle({ landlord: 0, winner: Side.Landlord, bidMultiplier: 2, events });
    expect(r.bombs).toBe(1);
    expect(r.multiplier).toBe(4);
  });

  it('地主赢且农民全程未出 → spring，倍数额外 ×2', () => {
    const events: GameEvent[] = [play(0), play(0)]; // 仅地主出过
    const r = settle({ landlord: 0, winner: Side.Landlord, bidMultiplier: 1, events });
    expect(r.spring).toBe('spring');
    expect(r.multiplier).toBe(2);
  });
});
