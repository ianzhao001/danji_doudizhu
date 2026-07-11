/**
 * 验证 GameSnapshot 暴露实时倍数与炸弹计数，并区分 game 层与 flow 层的数据来源。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import { GamePhase, apply, snapshot, type RoundState, type SeatIndex } from '../../assets/scripts/game';
import { startRoundRuntime, resumeRoundRuntime, type RuntimeConfig } from '../../assets/scripts/flow/round-runtime';
import type { FlowEvent } from '../../assets/scripts/flow';
import { Rank, Suit, type Card } from '../../assets/scripts/rules';

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

const A = card(Rank.A, Suit.Spade);
const R3 = card(Rank.R3, Suit.Spade);
const R4 = card(Rank.R4, Suit.Heart);
const R9 = card(Rank.R9, Suit.Spade);

function playingState(args: {
  landlord?: SeatIndex;
  turn: SeatIndex;
  hands: [Card[], Card[], Card[]];
  bombsPlayed?: number;
}): RoundState {
  return {
    phase: GamePhase.Playing,
    landlord: args.landlord ?? 0,
    seats: args.hands.map((hand, index) => ({ index: index as SeatIndex, hand: hand.slice() })),
    turn: args.turn,
    top: null,
    passesInARow: 0,
    winner: null,
    bombsPlayed: args.bombsPlayed ?? 0,
  };
}

const LEVELS: [AiLevel, AiLevel, AiLevel] = [AiLevel.Simple, AiLevel.Simple, AiLevel.Simple];

function runtimeConfig(overrides: Partial<RuntimeConfig> = {}): RuntimeConfig {
  return { seed: 1, heroSeat: 0, levels: LEVELS, thinkingDelayMs: 0, ...overrides };
}

describe('T-LIVE-MULT GameSnapshot 实时倍数/炸弹数数据口', () => {
  it('① game 层：出炸弹经 apply 真路径后 snapshot.bombsPlayed 0→1（无 viewer / 有 viewer 同值）', () => {
    const bomb = [
      card(Rank.R6, Suit.Spade),
      card(Rank.R6, Suit.Heart),
      card(Rank.R6, Suit.Diamond),
      card(Rank.R6, Suit.Club),
    ];
    const state = playingState({ landlord: 0, turn: 1, hands: [[A], [...bomb, R9], [R4]] });

    expect(snapshot(state).bombsPlayed, '开局零炸弹应上快照口').toBe(0);

    const result = apply(state, { type: 'play', seat: 1, cards: bomb });
    // 既有 game 行为前提（今日已绿）：炸弹使 state.bombsPlayed 递增并发 bomb 事件
    expect(result.state.bombsPlayed).toBe(1);
    expect(result.events.some((e) => e.type === 'bomb')).toBe(true);

    expect(snapshot(result.state).bombsPlayed, '炸弹后快照应见 1').toBe(1);
    expect(snapshot(result.state, 1).bombsPlayed, 'viewer 态同值').toBe(1);
  });

  it('② flow 层：runtimeSnapshot enrich bidMultiplier——live 叫抢后 = landlordDecided.bidMultiplier；resume 后 = 存档回填值', async () => {
    // —— live 路径：真实叫抢驱动到 playing ——
    const events: FlowEvent[] = [];
    const runtime = startRoundRuntime({ seed: 11, heroSeat: 0, levels: LEVELS, thinkingDelayMs: 0 });
    runtime.onEvent((e) => events.push(e));
    while (runtime.phase() === 'bidding' && runtime.isPlayerTurn()) {
      const inputs = runtime.legalInputs();
      expect(inputs && inputs.length >= 2).toBe(true);
      const res = await runtime.submitPlayerAction(inputs![0]); // [0]=call/grab（positive）
      expect(res.ok).toBe(true);
    }
    expect(runtime.phase()).toBe('playing');

    const ld = events.find(
      (e): e is Extract<FlowEvent, { type: 'landlordDecided' }> => e.type === 'landlordDecided',
    );
    expect(ld, '前提：叫抢已决出地主').toBeDefined();
    expect(ld!.landlord, '前提（同 bidding-visibility SEED=11）：地主=hero(0)，领出即冻结').toBe(0);

    const live = runtime.currentSnapshot();
    expect(live).not.toBeNull();
    expect(live!.bidMultiplier, 'playing 相快照应携带叫抢终值').toBe(ld!.bidMultiplier);
    expect(live!.bombsPlayed, '开局零炸弹').toBe(0);
    runtime.dispose();

    // —— resume 路径：无 bidding 态，enrich 源必须是 runtime.bidMultiplier（存档回填）——
    const resumed = resumeRoundRuntime(
      { state: playingState({ landlord: 0, turn: 0, hands: [[A, R9], [R3], [R4]], bombsPlayed: 2 }), heroSeat: 0, bidMultiplier: 4, events: [] },
      runtimeConfig(),
    );
    const snap = resumed.currentSnapshot();
    expect(snap).not.toBeNull();
    expect(snap!.bidMultiplier, '恢复局快照应携带存档回填倍数').toBe(4);
    expect(snap!.bombsPlayed, '恢复局快照应携带存档炸弹数').toBe(2);
    resumed.dispose();
  });

  it('③ 绿锚：snapshot 两参签名与既有字段零改动；纯 game snapshot 永不填 bidMultiplier（依赖方向钉）', () => {
    const state = playingState({ landlord: 2, turn: 1, hands: [[A], [R3, R4], [R9]] });

    const noViewer = snapshot(state);
    expect(noViewer.phase).toBe(GamePhase.Playing);
    expect(noViewer.turn).toBe(1);
    expect(noViewer.landlord).toBe(2);
    expect(noViewer.top).toBeNull();
    expect(noViewer.handCounts).toEqual([1, 2, 1]);
    expect(noViewer.winner).toBeNull();
    expect(noViewer.viewerHand, '无 viewer 不附手牌').toBeUndefined();

    const withViewer = snapshot(state, 1);
    expect(withViewer.viewerHand).toEqual([R3, R4]);

    // 依赖方向钉：倍数在 flow 层（runtime.bidMultiplier），game 层不知——纯 game snapshot()
    // 在实现前后都不得填 bidMultiplier；它只能由 flow runtimeSnapshot enrich。
    expect(noViewer.bidMultiplier).toBeUndefined();
    expect(withViewer.bidMultiplier).toBeUndefined();
  });
});
