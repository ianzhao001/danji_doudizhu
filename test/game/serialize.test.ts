import { describe, it, expect } from 'vitest';
import { serializeRound, deserializeRound } from '../../assets/scripts/game/serialize';
import { GamePhase, type RoundState } from '../../assets/scripts/game';
import { recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

function sample(): RoundState {
  return {
    phase: GamePhase.Playing,
    landlord: 0,
    seats: [
      { index: 0, hand: cards('3 4 5') },
      { index: 1, hand: cards('6 6') },
      { index: 2, hand: cards('8') },
    ],
    turn: 1,
    top: { seat: 0, pattern: recognize(cards('5 5'))! },
    passesInARow: 0,
    winner: null,
    bombsPlayed: 0,
    bottom: null,
  };
}

describe('serialize 往返', () => {
  it('deserialize(serialize(s)) 与 s 深相等', () => {
    const s = sample();
    expect(deserializeRound(serializeRound(s))).toEqual(s);
  });

  it('非法 JSON 抛错', () => {
    expect(() => deserializeRound('{not json')).toThrow();
  });
});
