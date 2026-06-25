import { describe, it, expect } from 'vitest';
import { runHeadlessRound, type Clock, type BidPolicy } from '../../assets/scripts/flow';

/** 假时钟：记录每次 sleep 的 ms，但不真实等待。 */
function fakeClock(): Clock & { sleeps: number[] } {
  const sleeps: number[] = [];
  return { sleeps, sleep: async (ms: number) => void sleeps.push(ms) };
}

describe('flow runHeadlessRound', () => {
  it('固定 seed 跑到 settled，有 settlement，scores 和为 0', async () => {
    const r = await runHeadlessRound({ seed: 1, clock: fakeClock() });
    expect(r.finalState.phase).toBe('settled');
    expect(r.settlement).toBeDefined();
    const [a, b, c] = r.settlement.scores;
    expect(a + b + c).toBe(0);
    expect(r.winner).toBe(r.finalState.winner);
  });

  it('fake clock 记录每次思考 sleep（次数 = turns），不真实等待', async () => {
    const clock = fakeClock();
    const r = await runHeadlessRound({ seed: 1, thinkingDelayMs: 50, clock });
    expect(clock.sleeps.length).toBe(r.turns);
    expect(clock.sleeps.every((ms) => ms === 50)).toBe(true);
  });

  it('全 pass 的 bidPolicy → redeal；超 maxRedeals 抛错且消息含 seed', async () => {
    const allPass: BidPolicy = ({ seat }) => ({ type: 'pass', seat });
    await expect(
      runHeadlessRound({ seed: 42, bidPolicy: allPass, maxRedeals: 2, clock: fakeClock() }),
    ).rejects.toThrow('42');
  });

  it('maxTurns 很小 → 抛错且消息含 seed', async () => {
    await expect(runHeadlessRound({ seed: 42, maxTurns: 1, clock: fakeClock() })).rejects.toThrow('42');
  });

  it('同 seed 可复现', async () => {
    const r1 = await runHeadlessRound({ seed: 7, clock: fakeClock() });
    const r2 = await runHeadlessRound({ seed: 7, clock: fakeClock() });
    expect(r2.landlord).toBe(r1.landlord);
    expect(r2.winner).toBe(r1.winner);
    expect(r2.settlement.scores).toEqual(r1.settlement.scores);
    expect(r2.turns).toBe(r1.turns);
  });
});
