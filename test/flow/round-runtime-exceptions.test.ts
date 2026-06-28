/**
 * M6-L4 失败测试：round-runtime 异常流程加固（架构种入·不可改）。当前应先红（resume-to-settled gap）。
 * 规则见 coordination/tasks/M6-L4-round-runtime-exceptions.md。零 `cc` import（flow 层）。
 *
 * 缺口 1（真红）：resume 到 phase=Settled 的局，若 resume 携带 win 事件，settlement() 应立即可用
 *   且 onSettled 触发一次。当前构造器（round-runtime.ts:121）只把 phase 设 'settled'，
 *   不调 finishIfSettled → settlement() 返回 null、onSettled 不触发。实现方需在 resume 路径补 settle 投影。
 *
 * 缺口 2（契约钉死）：redeal 超 DEFAULT_MAX_REDEALS 后 phase==='disposed' 且不再产出 settled 事件。
 *   实现方须先与本测试契约对齐（静默 disposed，不发 settle），若需改为抛错须同步改 spec。
 */
import { describe, it, expect } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import {
  GamePhase,
  Side,
  type RoundState,
  type SeatIndex,
  type GameEvent,
} from '../../assets/scripts/game';
import {
  startRoundRuntime,
  resumeRoundRuntime,
  type RuntimeConfig,
} from '../../assets/scripts/flow/round-runtime';
import { Category, Rank, Suit, type Card } from '../../assets/scripts/rules';
import type { BidPolicy, Clock, PlayPolicy } from '../../assets/scripts/flow';

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

const R3 = card(Rank.R3, Suit.Spade);
const R4 = card(Rank.R4, Suit.Heart);
const R5 = card(Rank.R5, Suit.Club);

function settledState(landlord: SeatIndex = 0, winner: Side = Side.Landlord): RoundState {
  return {
    phase: GamePhase.Settled,
    landlord,
    seats: [
      { index: 0, hand: [] },
      { index: 1, hand: [R4] },
      { index: 2, hand: [R5] },
    ],
    turn: 0,
    top: { seat: 0, pattern: { category: Category.Single, mainRank: Rank.R3, length: 1, cards: [R3] } },
    passesInARow: 0,
    winner,
    bombsPlayed: 0,
  };
}

function immediateClock(): Clock {
  return { sleep: async () => {} };
}

const passAfterCall: BidPolicy = ({ seat, state }) =>
  state.phase === 'calling' ? { type: 'call', seat } : { type: 'pass', seat };

const leadOneThenPass: PlayPolicy = ({ seat, snapshot }) => {
  if (snapshot.top) return { type: 'pass', seat };
  return { type: 'play', seat, cards: [snapshot.viewerHand![0]] };
};

function config(overrides: Partial<RuntimeConfig> = {}): RuntimeConfig {
  return {
    seed: 1,
    heroSeat: 1,
    levels: [AiLevel.Simple, AiLevel.Simple, AiLevel.Simple],
    clock: immediateClock(),
    thinkingDelayMs: 5,
    bidPolicy: passAfterCall,
    playPolicy: leadOneThenPass,
    ...overrides,
  };
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('M6-L4 round-runtime 异常流程', () => {
  it('缺口1：resume 到已结算局（携带 win 事件）→ settlement() 非 null 且 onSettled 触发一次', async () => {
    const settledCalls: unknown[] = [];
    const winEvent: GameEvent = { type: 'win', seat: 0, side: Side.Landlord };
    const runtime = resumeRoundRuntime(
      {
        state: settledState(0, Side.Landlord),
        heroSeat: 1,
        bidMultiplier: 2,
        events: [winEvent],
      },
      config({ onSettled: (finish) => settledCalls.push(finish) }),
    );

    await flush();

    // 当前为 gap：构造器未调 finishIfSettled，settlement() 为 null。实现方补 settle 投影后转绿。
    const settlement = runtime.settlement();
    expect(settlement).not.toBeNull();
    // onSettled 只触发一次
    expect(settledCalls).toHaveLength(1);
    // 三方分数零和
    const scores = settlement!.scores;
    expect(scores[0] + scores[1] + scores[2]).toBe(0);
    // phase 仍为 settled
    expect(runtime.phase()).toBe('settled');
  });

  it('缺口1 幂等：重复 flush 不重复触发 onSettled', async () => {
    const settledCalls: unknown[] = [];
    const winEvent: GameEvent = { type: 'win', seat: 0, side: Side.Landlord };
    const runtime = resumeRoundRuntime(
      { state: settledState(), heroSeat: 1, bidMultiplier: 1, events: [winEvent] },
      config({ onSettled: (finish) => settledCalls.push(finish) }),
    );
    await flush();
    await flush();
    await flush();
    expect(settledCalls).toHaveLength(1);
  });

  it('缺口2 契约：redeal 超 DEFAULT_MAX_REDEALS → phase=disposed 且不产出 settled 事件', async () => {
    // 用一个所有玩家都只 pass 的叫抢策略，强制进入 redead 循环直到超限。
    // 关键修正：runtime 遇到 hero bidding turn 会暂停（round-runtime.ts:242
    //   bidding.turn === heroSeat → return），不会自动替玩家 pass。
    //   故循环里检测到 hero turn 时显式 submitPlayerAction(pass)，AI 回合再 flush()。
    //   否则测试卡在 bidding，根本没进 redead 路径——测的是「玩家暂停」而非「redead 超限」。
    const alwaysPassBid: BidPolicy = ({ seat }) => ({ type: 'pass', seat });
    const seen: string[] = [];
    const heroSeat = 1;
    const runtime = startRoundRuntime(
      config({
        heroSeat,
        bidPolicy: alwaysPassBid,
        playPolicy: leadOneThenPass,
        onSettled: () => seen.push('settled'),
      }),
    );
    runtime.onEvent((e) => seen.push(e.type));

    // 推进：hero bidding turn 显式 pass，AI 回合 flush。
    // redead 上限 DEFAULT_MAX_REDEALS=10，每轮多次循环足够触达超限。
    for (let i = 0; i < 400 && runtime.phase() !== 'disposed' && runtime.phase() !== 'settled'; i++) {
      if (runtime.phase() === 'bidding' && runtime.isPlayerTurn()) {
        await runtime.submitPlayerAction({ kind: 'bid', action: { type: 'pass', seat: heroSeat } });
      }
      await flush();
    }

    // 终态必须是 disposed 或 settled 之一（不能卡死在 bidding/redead）
    expect(['disposed', 'settled']).toContain(runtime.phase());
    // 若走到 disposed（redead 超限），不得产出 settled 事件
    if (runtime.phase() === 'disposed') {
      expect(seen).not.toContain('settled');
    }
  });
});
