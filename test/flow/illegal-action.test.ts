/**
 * M-FLOW-02 失败测试：出牌循环 policy/apply 抛错应包成 HeadlessRoundError。
 * 架构种入，不可改。当前 driver 只包 maxTurns / 缺 win → 非法动作会抛原始错误 → 应先红。
 */
import { describe, it, expect } from 'vitest';
import {
  runHeadlessRound,
  HeadlessRoundError,
  type PlayPolicy,
} from '../../assets/scripts/flow';
import { Rank, Suit } from '../../assets/scripts/rules';

// 恒非法：两张大王（整副牌仅一张大王）→ 任何手牌都不含 → apply 抛 IllegalActionError。
const illegalPolicy: PlayPolicy = ({ seat }) => ({
  type: 'play',
  seat,
  cards: [
    { rank: Rank.BigJoker, suit: Suit.Joker },
    { rank: Rank.BigJoker, suit: Suit.Joker },
  ],
});

describe('M-FLOW-02 出牌循环非法动作诊断', () => {
  it('playPolicy 返回非法 play → rejects 为 HeadlessRoundError', async () => {
    await expect(runHeadlessRound({ seed: 42, playPolicy: illegalPolicy })).rejects.toBeInstanceOf(
      HeadlessRoundError,
    );
  });

  it('HeadlessRoundError 携带诊断与 cause', async () => {
    let caught: unknown;
    try {
      await runHeadlessRound({ seed: 42, playPolicy: illegalPolicy });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(HeadlessRoundError);
    const err = caught as HeadlessRoundError;
    expect(err.seed).toBe(42);
    expect(err.message).toContain('42');
    expect(err.turns).toBeGreaterThanOrEqual(0);
    expect(err.lastEvents.length).toBeGreaterThan(0);
    expect(err.cause).toBeInstanceOf(Error); // 原始 IllegalActionError 被保留
  });
});
