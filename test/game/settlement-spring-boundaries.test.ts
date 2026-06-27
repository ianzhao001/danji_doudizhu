import { describe, expect, it } from 'vitest';

import { settle } from '../../assets/scripts/game/settlement';
import { Side, type GameEvent } from '../../assets/scripts/game';
import { recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const pattern = recognize(cards('3'))!;
const play = (seat: 0 | 1 | 2): GameEvent => ({ type: 'play', seat, pattern });
const bomb = (seat: 0 | 1 | 2): GameEvent => ({ type: 'bomb', seat });
const rocket = (seat: 0 | 1 | 2): GameEvent => ({ type: 'rocket', seat });

describe('settlement spring and multiplier boundaries', () => {
  it('detects anti-spring only when landlord played exactly once and farmers win', () => {
    const once = settle({ landlord: 0, winner: Side.Farmer, bidMultiplier: 1, events: [play(0), play(1)] });
    const zero = settle({ landlord: 0, winner: Side.Farmer, bidMultiplier: 1, events: [play(1), play(2)] });

    expect(once.spring).toBe('anti-spring');
    expect(zero.spring).toBe('none');
  });

  it('detects spring when landlord wins before farmers play', () => {
    const result = settle({ landlord: 0, winner: Side.Landlord, bidMultiplier: 1, events: [play(0), play(0)] });

    expect(result.spring).toBe('spring');
  });

  it('combines bid multiplier, bombs, and anti-spring multiplier', () => {
    const result = settle({
      landlord: 0,
      winner: Side.Farmer,
      bidMultiplier: 3,
      events: [play(0), bomb(1), rocket(2), play(1)],
    });

    expect(result.bombs).toBe(2);
    expect(result.spring).toBe('anti-spring');
    expect(result.multiplier).toBe(24);
  });

  it('keeps multiplier equal to bidMultiplier when there are no bombs or spring', () => {
    const result = settle({
      landlord: 0,
      winner: Side.Landlord,
      bidMultiplier: 5,
      events: [play(0), play(1), play(2), play(0)],
    });

    expect(result.spring).toBe('none');
    expect(result.bombs).toBe(0);
    expect(result.multiplier).toBe(5);
  });

  it('doubles multiplier for one bomb', () => {
    const result = settle({
      landlord: 0,
      winner: Side.Landlord,
      bidMultiplier: 2,
      events: [play(0), bomb(1), play(1), play(2)],
    });

    expect(result.multiplier).toBe(4);
  });

  it('counts rocket as a bomb multiplier source', () => {
    const result = settle({
      landlord: 0,
      winner: Side.Landlord,
      bidMultiplier: 1,
      events: [play(0), rocket(0), play(1), play(2)],
    });

    expect(result.bombs).toBe(1);
    expect(result.multiplier).toBe(2);
  });

  it('multiplies by eight for three bomb-like events', () => {
    const result = settle({
      landlord: 0,
      winner: Side.Landlord,
      bidMultiplier: 1,
      events: [play(0), bomb(0), rocket(1), bomb(2), play(1), play(2)],
    });

    expect(result.bombs).toBe(3);
    expect(result.multiplier).toBe(8);
  });

  it('scores landlord wins with positive landlord score and zero sum', () => {
    const result = settle({
      landlord: 0,
      winner: Side.Landlord,
      bidMultiplier: 2,
      events: [play(0), play(1), play(2), play(0)],
    });

    expect(result.scores[0]).toBeGreaterThan(0);
    expect(result.scores[1]).toBeLessThan(0);
    expect(result.scores[2]).toBeLessThan(0);
    expect(result.scores).toEqual([4, -2, -2]);
    expect(result.scores.reduce((sum, score) => sum + score, 0)).toBe(0);
  });

  it('scores farmer wins with negative landlord score and zero sum', () => {
    const result = settle({
      landlord: 0,
      winner: Side.Farmer,
      bidMultiplier: 2,
      events: [play(0), play(1), play(0), play(2)],
    });

    expect(result.scores[0]).toBeLessThan(0);
    expect(result.scores[1]).toBeGreaterThan(0);
    expect(result.scores[2]).toBeGreaterThan(0);
    expect(result.scores).toEqual([-4, 2, 2]);
    expect(result.scores.reduce((sum, score) => sum + score, 0)).toBe(0);
  });

  it('baseScore scales scores without changing multiplier', () => {
    const result = settle({
      landlord: 0,
      winner: Side.Landlord,
      bidMultiplier: 2,
      events: [play(0), play(1), play(2), play(0)],
      baseScore: 3,
    });

    expect(result.multiplier).toBe(2);
    expect(result.scores).toEqual([12, -6, -6]);
  });
});
