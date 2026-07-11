/**
 * 验证 runtime advance 循环在 pause / resume 场景下不会发生并发重入。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import { GamePhase, type RoundState, type SeatIndex } from '../../assets/scripts/game';
import { resumeRoundRuntime, type RuntimeConfig } from '../../assets/scripts/flow/round-runtime';
import { Rank, Suit, type Card } from '../../assets/scripts/rules';
import type { Clock, PlayPolicy } from '../../assets/scripts/flow';

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

const A = card(Rank.A, Suit.Spade);
const R3 = card(Rank.R3, Suit.Spade);
const R4 = card(Rank.R4, Suit.Heart);
const R6 = card(Rank.R6, Suit.Diamond);
const R9 = card(Rank.R9, Suit.Spade);

function playingState(args: { turn: SeatIndex; hands: [Card[], Card[], Card[]] }): RoundState {
  return {
    phase: GamePhase.Playing,
    landlord: 0,
    seats: args.hands.map((hand, index) => ({ index: index as SeatIndex, hand: hand.slice() })),
    turn: args.turn,
    top: null,
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

/** top 为空领出第一张，否则过牌——各座位统一、全链确定性（同 runtime-pause 种子）。 */
const leadOneThenPass: PlayPolicy = ({ seat, snapshot }) => {
  if (snapshot.top) return { type: 'pass', seat };
  return { type: 'play', seat, cards: [snapshot.viewerHand![0]] };
};

const LEVELS: [AiLevel, AiLevel, AiLevel] = [AiLevel.Simple, AiLevel.Simple, AiLevel.Simple];

function config(overrides: Partial<RuntimeConfig> = {}): RuntimeConfig {
  return {
    seed: 1,
    heroSeat: 2,
    levels: LEVELS,
    thinkingDelayMs: 5,
    playPolicy: leadOneThenPass,
    ...overrides,
  };
}

describe('T-ADVANCE-REENTRY advance 循环防重入', () => {
  it('① 防重入：resume 在旧 sleep 未醒时不得起第二循环——恰一次 sleep·恢复后停在 hero gate·不替 hero 决策', async () => {
    // 拓扑：heroSeat=2、turn=1（AI）、seat1 两张。恢复后 seat1 领出一张 → nextSeat(1)=2=hero gate。
    const clock = new PendingClock();
    const runtime = resumeRoundRuntime(
      { state: playingState({ turn: 1, hands: [[R4], [R3, R6], [A, R9]] }), heroSeat: 2, bidMultiplier: 1, events: [] },
      config({ clock }),
    );
    await flush();
    expect(runtime.isPlayerTurn()).toBe(false);
    expect(clock.sleeps.length, '前提：AI(seat1) 正在思考（恰一个 in-flight sleep）').toBe(1);

    // 暂停后立刻恢复——旧 sleep 尚未醒（生产对应：thinkDelay 窗口内 暂停→继续）
    runtime.pause();
    runtime.resume();
    await flush();
    expect(runtime.isPaused()).toBe(false);
    expect(clock.sleeps.length, '防重入：resume 不得在旧循环存活时再起新循环（不多一次 sleep）').toBe(1);

    clock.resolveAll();
    await flush();
    // 恰推进一手（seat1 领出）后停在 hero gate；双循环世界会替 hero 过牌把 turn 推到 0
    expect(runtime.currentSnapshot()!.turn, '恢复后恰一手推进·停在 hero').toBe(2);
    expect(runtime.isPlayerTurn(), 'hero gate 冻结·不得替 hero 决策').toBe(true);
    expect(runtime.currentSnapshot()!.handCounts).toEqual([1, 1, 2]);
    expect(clock.sleeps.length, '到 hero gate 全程不得再多 sleep').toBe(1);
    runtime.dispose();
  });

  it('② 无丢唤醒：旧循环因 paused 退出后 resume 必须重启新循环并推进到 hero gate', async () => {
    const clock = new PendingClock();
    const runtime = resumeRoundRuntime(
      { state: playingState({ turn: 1, hands: [[R4], [R3, R6], [A, R9]] }), heroSeat: 2, bidMultiplier: 1, events: [] },
      config({ clock }),
    );
    await flush();
    expect(clock.sleeps.length).toBe(1);

    runtime.pause();
    clock.resolveAll();
    await flush();
    // 旧循环醒见 paused → 退出未推进（T-PAUSE-GATE 既有契约）
    expect(runtime.currentSnapshot()!.turn).toBe(1);
    expect(runtime.isPaused()).toBe(true);

    runtime.resume();
    await flush();
    expect(clock.sleeps.length, '此时无活循环·resume 必须重调度（防重入不得吞掉合法重启）').toBe(2);

    clock.resolveAll();
    await flush();
    expect(runtime.currentSnapshot()!.turn).toBe(2);
    expect(runtime.isPlayerTurn()).toBe(true);
    runtime.dispose();
  });

  it('③ submit 链路不受防重入影响：player-gate 提交后 AI 照常推进·两过 reset 回 hero', async () => {
    // realClock + thinkingDelayMs 0：submit await 内部推进到下一 gate 才 resolve
    const runtime = resumeRoundRuntime(
      { state: playingState({ turn: 2, hands: [[R4, R6], [R3, card(Rank.R3, Suit.Heart)], [A, R9]] }), heroSeat: 2, bidMultiplier: 1, events: [] },
      { seed: 1, heroSeat: 2, levels: LEVELS, thinkingDelayMs: 0, playPolicy: leadOneThenPass },
    );
    await flush();
    expect(runtime.isPlayerTurn()).toBe(true);

    const res = await runtime.submitPlayerAction({ kind: 'play', action: { type: 'play', seat: 2, cards: [A] } });
    expect(res.ok).toBe(true);
    // hero 领 A → seat0 过 → seat1 过 → 连续两过 reset → 牌权回 hero 自由领出
    expect(runtime.currentSnapshot()!.turn).toBe(2);
    expect(runtime.isPlayerTurn()).toBe(true);
    expect(runtime.currentSnapshot()!.top, '两过 reset 后自由领出').toBeNull();
    expect(runtime.currentSnapshot()!.handCounts).toEqual([2, 2, 1]);
    runtime.dispose();
  });
});
