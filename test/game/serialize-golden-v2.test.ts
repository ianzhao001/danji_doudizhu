/**
 * v2 存档 golden 绊线(W-AUDIT-AI B3:+bottom 公开底牌)。
 * ⚠ fixture 已冻结:由真实 serializeRound 一次性生成(2026-07-13),永不重新生成。
 * 本测试红 = 你的改动破坏了 v2 存档兼容——去 game/serialize.ts 写 MIGRATIONS[2] 迁移器,
 * 不许改 fixture;expectedState 仅允许在升版本时按迁移语义更新。
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deserializeRound } from '../../assets/scripts/game/serialize';
import { GamePhase, type RoundState } from '../../assets/scripts/game';
import { recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const fixtureText = readFileSync(new URL('./fixtures/round-save.v2.golden.json', import.meta.url), 'utf8');

function expectedState(): RoundState {
  return {
    phase: GamePhase.Playing,
    landlord: 0,
    seats: [
      { index: 0, hand: cards('3 4 X') },
      { index: 1, hand: cards('6 6') },
      { index: 2, hand: cards('x') },
    ],
    turn: 1,
    top: { seat: 0, pattern: recognize(cards('5 5'))! },
    passesInARow: 1,
    winner: null,
    bombsPlayed: 1,
    bottom: cards('7 8 2'),
  };
}

describe('v2 golden 存档绊线', () => {
  it('v2 golden 存档永远可加载且语义等价(公开底牌在档)', () => {
    expect(deserializeRound(fixtureText)).toEqual(expectedState());
  });

  it('fixture 本身仍是 version=2(防「顺手重生成」)', () => {
    expect(JSON.parse(fixtureText).version).toBe(2);
  });

  it('bottom 校验:非 null 时必须恰 3 张合法牌', () => {
    const state = JSON.parse(fixtureText).state as Record<string, unknown>;
    const twoCards = JSON.stringify({ version: 2, state: { ...state, bottom: cards('7 8') } });
    expect(() => deserializeRound(twoCards)).toThrow(/bottom length/);
    const junk = JSON.stringify({ version: 2, state: { ...state, bottom: [{ rank: 99, suit: 'S' }, ...cards('7 8')] } });
    expect(() => deserializeRound(junk)).toThrow(/bottom\[0\]/);
  });
});
