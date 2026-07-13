/**
 * v1 存档 golden 绊线(v1.6 审计裁决 P1-3)。
 * ⚠ fixture 已冻结:由真实 serializeRound 一次性生成(2026-07-13),永不重新生成。
 * 本测试红 = 你的改动破坏了 v1 存档兼容——去 game/serialize.ts 写 MIGRATIONS 迁移器,
 * 不许改 fixture;expectedState 仅允许在升版本时按迁移语义更新(如补新字段默认值)。
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deserializeRound, serializeRound } from '../../assets/scripts/game/serialize';
import { GamePhase, type RoundState } from '../../assets/scripts/game';
import { recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const fixtureText = readFileSync(new URL('./fixtures/round-save.v1.golden.json', import.meta.url), 'utf8');

// v1 存档迁移到当前版后的期望语义(生成时与冻结态逐字段一致)。
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
    bottom: null,
  };
}

describe('v1 golden 存档绊线', () => {
  it('v1 golden 存档永远可加载且语义等价', () => {
    expect(deserializeRound(fixtureText)).toEqual(expectedState());
  });

  it('fixture 本身仍是 version=1(防「顺手重生成」)', () => {
    expect(JSON.parse(fixtureText).version).toBe(1);
  });

  it('高于当前版本仍硬拒(只升不降)', () => {
    const current = JSON.parse(serializeRound(expectedState())).version as number;
    const future = JSON.stringify({ version: current + 1, state: JSON.parse(fixtureText).state });
    expect(() => deserializeRound(future)).toThrow(/unsupported version/);
  });

  it('缺失迁移器的旧版本明确报错(迁移链 miss 分支)', () => {
    const v0 = JSON.stringify({ version: 0, state: JSON.parse(fixtureText).state });
    expect(() => deserializeRound(v0)).toThrow(/no migration from version 0/);
  });
});
