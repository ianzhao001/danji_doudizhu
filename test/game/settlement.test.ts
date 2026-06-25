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

// 架构补强：覆盖非 0 地主 / 农民胜 / 反春天 / rocket / baseScore / 多炸边界。
describe('settlement 结算（加固）', () => {
  it('非 0 地主(2)赢、无炸无春 → scores 按座位定位 [-1,-1,+2]', () => {
    const events: GameEvent[] = [play(2), play(0), play(1), play(2)];
    const r = settle({ landlord: 2, winner: Side.Landlord, bidMultiplier: 1, events });
    expect(r.spring).toBe('none');
    expect(r.multiplier).toBe(1);
    expect(r.scores).toEqual([-1, -1, 2]);
  });

  it('农民胜、无炸无春（地主出过 2 手）→ scores [-2,+1,+1]', () => {
    const events: GameEvent[] = [play(0), play(1), play(0), play(2), play(1)];
    const r = settle({ landlord: 0, winner: Side.Farmer, bidMultiplier: 1, events });
    expect(r.spring).toBe('none');
    expect(r.multiplier).toBe(1);
    expect(r.scores).toEqual([-2, 1, 1]);
  });

  it('反春天：农民胜且地主仅出 1 手 → anti-spring，倍数 ×2，scores [-4,+2,+2]', () => {
    const events: GameEvent[] = [play(0), play(1), play(2), play(1)];
    const r = settle({ landlord: 0, winner: Side.Farmer, bidMultiplier: 1, events });
    expect(r.spring).toBe('anti-spring');
    expect(r.multiplier).toBe(2);
    expect(r.scores).toEqual([-4, 2, 2]);
  });

  it('rocket 计入 bombs，倍数 ×2', () => {
    const events: GameEvent[] = [play(0), { type: 'rocket', seat: 0 }, play(1), play(2)];
    const r = settle({ landlord: 0, winner: Side.Landlord, bidMultiplier: 1, events });
    expect(r.bombs).toBe(1);
    expect(r.multiplier).toBe(2);
  });

  it('baseScore=2 线性缩放 → 地主赢 scores [+4,-2,-2]', () => {
    const events: GameEvent[] = [play(0), play(1), play(2), play(0)];
    const r = settle({ landlord: 0, winner: Side.Landlord, bidMultiplier: 1, events, baseScore: 2 });
    expect(r.multiplier).toBe(1);
    expect(r.scores).toEqual([4, -2, -2]);
  });

  it('两个炸弹 → bombs=2，倍数 2^2=4', () => {
    const events: GameEvent[] = [play(0), { type: 'bomb', seat: 0 }, play(1), { type: 'bomb', seat: 1 }, play(2)];
    const r = settle({ landlord: 0, winner: Side.Landlord, bidMultiplier: 1, events });
    expect(r.bombs).toBe(2);
    expect(r.multiplier).toBe(4);
  });

  it('三家得分恒为 0 和（农民胜 + 炸弹 + 反春天组合）', () => {
    const events: GameEvent[] = [play(0), { type: 'bomb', seat: 1 }, play(2), play(1)];
    const r = settle({ landlord: 0, winner: Side.Farmer, bidMultiplier: 3, events });
    expect(r.scores[0] + r.scores[1] + r.scores[2]).toBe(0);
  });
});
