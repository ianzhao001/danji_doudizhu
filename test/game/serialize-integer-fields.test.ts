/**
 * M5-12a 失败测试：序列化整数化（架构种入·不可改）。
 * 当前 passesInARow/bombsPlayed 用 assertNonNegativeNumber 接受小数 → 下列「应抛错」断言应先红。
 * 实现方改用 assertNonNegativeInteger 后转绿。
 */
import { describe, it, expect } from 'vitest';
import { serializeRound, deserializeRound } from '../../assets/scripts/game/serialize';
import { GamePhase, Side, type RoundState } from '../../assets/scripts/game';
import { Rank, Suit } from '../../assets/scripts/rules';

function validRound(): RoundState {
  return {
    phase: GamePhase.Playing,
    landlord: 0,
    seats: [
      { index: 0, hand: [{ rank: Rank.R3, suit: Suit.Spade }] },
      { index: 1, hand: [{ rank: Rank.R4, suit: Suit.Heart }] },
      { index: 2, hand: [{ rank: Rank.R5, suit: Suit.Club }] },
    ],
    turn: 0,
    top: null,
    passesInARow: 0,
    winner: null,
    bombsPlayed: 0,
    bottom: null,
  };
}

// 必须产出 deserializeRound 期望的版本化 wire（{version,state}），否则会先因「missing version」
// 抛错而到不了字段校验——那样「应抛错」断言会因错误原因变绿、永远逼不出整数化收紧（本任务初版种子之误）。
function roundWith(over: Partial<RoundState>): string {
  const wire = JSON.parse(serializeRound(validRound())) as { version: number; state: Record<string, unknown> };
  return JSON.stringify({ ...wire, state: { ...wire.state, ...over } });
}

describe('M5-12a 序列化数值整数化', () => {
  it('passesInARow 非整数 → 抛错', () => {
    expect(() => deserializeRound(roundWith({ passesInARow: 2.5 }))).toThrow();
  });
  it('passesInARow 负数 → 抛错', () => {
    expect(() => deserializeRound(roundWith({ passesInARow: -1 }))).toThrow();
  });
  it('bombsPlayed 非整数 → 抛错', () => {
    expect(() => deserializeRound(roundWith({ bombsPlayed: 1.5 }))).toThrow();
  });
  it('bombsPlayed 负数 → 抛错（与 passesInARow 对称）', () => {
    expect(() => deserializeRound(roundWith({ bombsPlayed: -1 }))).toThrow();
  });
  it('整数 0 边界 → 不抛（收紧后仍接受合法值）', () => {
    expect(() => deserializeRound(roundWith({ passesInARow: 0, bombsPlayed: 0 }))).not.toThrow();
  });
  it('非数值类型（字符串）→ 抛错（收紧前后均拒，类型护栏）', () => {
    expect(() => deserializeRound(roundWith({ passesInARow: '0' as unknown as number }))).toThrow();
  });
});
