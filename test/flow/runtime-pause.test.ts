/**
 * 验证 runtime 的 pause / resume 只冻结自动推进，不影响主动玩家输入。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import { GamePhase, Side, type RoundState, type SeatIndex } from '../../assets/scripts/game';
import { startRoundRuntime, resumeRoundRuntime, type RuntimeConfig } from '../../assets/scripts/flow/round-runtime';
import { Category, Rank, Suit, type Card, type HandPattern } from '../../assets/scripts/rules';
import type { Clock, PlayPolicy } from '../../assets/scripts/flow';

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

const R3 = card(Rank.R3, Suit.Spade);
const R4 = card(Rank.R4, Suit.Heart);
const A = card(Rank.A, Suit.Spade);

function singlePattern(c: Card): HandPattern {
  return { category: Category.Single, mainRank: c.rank, length: 1, cards: [c] };
}

function state(args: {
  landlord?: SeatIndex;
  turn: SeatIndex;
  hands: [Card[], Card[], Card[]];
  top?: { seat: SeatIndex; pattern: HandPattern } | null;
}): RoundState {
  const landlord = args.landlord ?? 0;
  return {
    phase: GamePhase.Playing,
    landlord,
    seats: args.hands.map((hand, index) => ({ index: index as SeatIndex, hand: hand.slice() })),
    turn: args.turn,
    top: args.top ?? null,
    passesInARow: 0,
    winner: null,
    bombsPlayed: 0,
  };
}

class PendingClock implements Clock {
  readonly sleeps: number[] = [];
  private resolvers: (() => void)[] = [];

  sleep(_ms: number): Promise<void> {
    this.sleeps.push(_ms);
    return new Promise((resolve) => this.resolvers.push(resolve));
  }

  resolveAll(): void {
    const resolvers = this.resolvers;
    this.resolvers = [];
    for (const resolve of resolvers) resolve();
  }
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

const leadOneThenPass: PlayPolicy = ({ seat, snapshot }) => {
  if (snapshot.top) return { type: 'pass', seat };
  return { type: 'play', seat, cards: [snapshot.viewerHand![0]] };
};

function config(overrides: Partial<RuntimeConfig> = {}): RuntimeConfig {
  return {
    seed: 1,
    heroSeat: 1,
    levels: [AiLevel.Simple, AiLevel.Simple, AiLevel.Simple],
    clock: new PendingClock(),
    thinkingDelayMs: 5,
    playPolicy: leadOneThenPass,
    ...overrides,
  };
}

describe('T-PAUSE-GATE runtime 暂停门（对局冻结）', () => {
  it('回归锚：hero turn resume 后既有行为不变（不引入 pause 接口·证明未触既有路径）', async () => {
    const clock = new PendingClock();
    const runtime = resumeRoundRuntime(
      { state: state({ turn: 1, hands: [[A], [R3], [R4]] }), heroSeat: 1, bidMultiplier: 1, events: [] },
      config({ clock, thinkingDelayMs: 9 }),
    );
    await flush();
    // hero turn：既有行为——AI 不推进（turn===heroSeat 即 return），无 sleep
    expect(runtime.isPlayerTurn()).toBe(true);
    expect(runtime.phase()).toBe('playing');
    expect(clock.sleeps).toEqual([]);
  });

  it('真暂停门：pause() 后 AI sleep 醒来不推进，state 不变；resume() 后继续到 hero gate', async () => {
    // 构造：heroSeat=0、turn=2、seat2 有 2 张牌、top=null。
    // resume 后 seat2 领首张（top=null 分支·leadOneThenPass 出首张·手牌剩 1 不 settled）
    // → nextSeat(2)=0=heroSeat → playing 分支顶部 `turn===heroSeat` 即 return → hero gate。
    // 关键：resume 后恰好一手 AI 推进即达 hero gate，不 settled、不替 hero 决策。
    const clock = new PendingClock();
    const runtime = resumeRoundRuntime(
      { state: state({ landlord: 0, turn: 2, hands: [[A], [R3], [R4, R4]] }), heroSeat: 0, bidMultiplier: 1, events: [] },
      config({ clock, thinkingDelayMs: 9 }),
    );
    await flush();
    expect(runtime.isPlayerTurn()).toBe(false);
    expect(clock.sleeps).toEqual([9]);

    // 暂停：AI 正在 sleep 中
    runtime.pause();
    expect(runtime.isPaused()).toBe(true);

    // 释放 sleep——pause 态下 AI 醒来不得推进
    clock.resolveAll();
    await flush();
    expect(runtime.isPlayerTurn()).toBe(false);
    expect(runtime.currentSnapshot()!.turn).toBe(2);

    // resume：重新调度，AI 继续
    runtime.resume();
    expect(runtime.isPaused()).toBe(false);
    await flush();
    // resume 后会再次 sleep（重新调度推进）
    expect(clock.sleeps.length).toBeGreaterThanOrEqual(2);

    clock.resolveAll();
    await flush();
    // seat2 领首张后流转到 seat0=hero gate（不 settled）
    expect(runtime.isPlayerTurn()).toBe(true);
    expect(runtime.phase()).toBe('playing');
  });

  it('守卫：暂停态 submitPlayerAction 照常接受（暂停只冻 AI·不拒玩家）', async () => {
    const clock = new PendingClock();
    const runtime = resumeRoundRuntime(
      { state: state({ turn: 1, hands: [[A], [R3], [R4]] }), heroSeat: 1, bidMultiplier: 1, events: [] },
      config({ clock, thinkingDelayMs: 9 }),
    );
    await flush();
    expect(runtime.isPlayerTurn()).toBe(true);

    runtime.pause();
    expect(runtime.isPaused()).toBe(true);

    // 玩家主动出牌——暂停态仍接受
    const result = await runtime.submitPlayerAction({ kind: 'play', action: { type: 'play', seat: 1, cards: [R3] } });
    expect(result.ok).toBe(true);
    // 玩家出牌后轮到 AI（seat 2），但 pause 态 AI 不推进
    expect(runtime.currentSnapshot()!.turn).toBe(2);
    expect(runtime.isPaused()).toBe(true);
  });

  it('幂等：disposed 后 pause/resume 不抛错、不复活', async () => {
    const clock = new PendingClock();
    const runtime = resumeRoundRuntime(
      { state: state({ turn: 2, hands: [[A], [R3], [R4]] }), heroSeat: 1, bidMultiplier: 1, events: [] },
      config({ clock, thinkingDelayMs: 9 }),
    );
    await flush();

    runtime.dispose();
    expect(runtime.phase()).toBe('disposed');

    // disposed 后 pause/resume 幂等
    expect(() => runtime.pause()).not.toThrow();
    expect(() => runtime.resume()).not.toThrow();
    expect(runtime.phase()).toBe('disposed');
  });
});
