import { describe, it, expect } from 'vitest';
import { serializeRound, deserializeRound } from '../../assets/scripts/game/serialize';
import { GamePhase, type RoundState } from '../../assets/scripts/game';
import { recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const CURRENT_VERSION = 1;

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
  };
}

describe('M5-01 存档版本化', () => {
  it('serialize 输出顶层含 version === 1', () => {
    const obj = JSON.parse(serializeRound(sample()));
    expect(obj.version).toBe(CURRENT_VERSION);
  });

  it('带版本往返仍深相等（version 不污染 RoundState）', () => {
    const s = sample();
    expect(deserializeRound(serializeRound(s))).toEqual(s);
  });

  it('缺 version 的裸 RoundState JSON → 反序列化抛错', () => {
    const bare = JSON.stringify(sample());
    expect(() => deserializeRound(bare)).toThrow();
  });

  it('未知 / 过高 version → 抛错', () => {
    const future = JSON.stringify({ version: 999, state: sample() });
    expect(() => deserializeRound(future)).toThrow();
  });

  it('损坏数据（缺 state）→ 抛错', () => {
    const broken = JSON.stringify({ version: CURRENT_VERSION });
    expect(() => deserializeRound(broken)).toThrow();
  });
});
