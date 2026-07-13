import { describe, it, expect } from 'vitest';
import { createRng, deal as dealCards, recognize } from '../../assets/scripts/rules';
import {
  createPlayingRound,
  apply,
  snapshot,
  GamePhase,
  Side,
  IllegalActionError,
  type RoundState,
} from '../../assets/scripts/game';
import { cards } from '../rules/_util';

/** 用已知手牌直接构造 Playing 局（RoundState 为纯数据），便于精确断言。 */
function playing(hands: [string, string, string], opts: Partial<RoundState> = {}): RoundState {
  return {
    phase: GamePhase.Playing,
    landlord: 0,
    seats: [
      { index: 0, hand: cards(hands[0]) },
      { index: 1, hand: cards(hands[1]) },
      { index: 2, hand: cards(hands[2]) },
    ],
    turn: 0,
    top: null,
    passesInARow: 0,
    winner: null,
    bombsPlayed: 0,
    bottom: null,
    ...opts,
  };
}

describe('game-core: createPlayingRound', () => {
  it('地主获 20 张、其余 17，phase=Playing、turn=地主、top=null', () => {
    const r = createPlayingRound(dealCards(createRng(1)), 1);
    expect(r.seats[1].hand.length).toBe(20);
    expect(r.seats[0].hand.length).toBe(17);
    expect(r.seats[2].hand.length).toBe(17);
    expect(r.phase).toBe(GamePhase.Playing);
    expect(r.turn).toBe(1);
    expect(r.top).toBeNull();
  });
});

describe('game-core: apply 出牌与校验', () => {
  it('领出更新 top、轮转到下家、减少手牌、产 play 事件', () => {
    const s = playing(['3 4 5', '6 7', '8'], { turn: 0, top: null });
    const { state, events } = apply(s, { type: 'play', seat: 0, cards: cards('3') });
    expect(state.top?.seat).toBe(0);
    expect(state.turn).toBe(1);
    expect(state.seats[0].hand.length).toBe(2);
    expect(events.some((e) => e.type === 'play')).toBe(true);
  });

  it('出非手牌（归属违规）抛 IllegalActionError', () => {
    const s = playing(['3 4 5', '6 7', '8'], { turn: 0 });
    expect(() => apply(s, { type: 'play', seat: 0, cards: cards('9') })).toThrow(IllegalActionError);
  });

  it('非当前轮座位行动抛错', () => {
    const s = playing(['3 4 5', '6 7', '8'], { turn: 0 });
    expect(() => apply(s, { type: 'play', seat: 1, cards: cards('6') })).toThrow(IllegalActionError);
  });

  it('领出时 pass 非法', () => {
    const s = playing(['3 4 5', '6 7', '8'], { turn: 0, top: null });
    expect(() => apply(s, { type: 'pass', seat: 0 })).toThrow(IllegalActionError);
  });

  it('跟牌压不过抛错、压得过通过', () => {
    const top = { seat: 0 as const, pattern: recognize(cards('5 5'))! };
    const s = playing(['K', '4 4 6 6', 'A'], { turn: 1, top });
    expect(() => apply(s, { type: 'play', seat: 1, cards: cards('4 4') })).toThrow(IllegalActionError);
    const ok = apply(s, { type: 'play', seat: 1, cards: cards('6 6') });
    expect(ok.state.top?.seat).toBe(1);
  });
});

describe('game-core: 过牌归位与胜负', () => {
  it('连续两过 → top 重置、leader 自由领出、产 reset 事件', () => {
    const top = { seat: 0 as const, pattern: recognize(cards('9'))! };
    const s = playing(['9', '4', '5'], { turn: 1, top });
    const r1 = apply(s, { type: 'pass', seat: 1 });
    const r2 = apply(r1.state, { type: 'pass', seat: 2 });
    expect(r2.state.top).toBeNull();
    expect(r2.state.turn).toBe(0);
    expect(r2.events.some((e) => e.type === 'reset')).toBe(true);
  });

  it('出完最后一手 → Settled + winner + win 事件', () => {
    const s = playing(['3', '6 7', '8'], { turn: 0, top: null });
    const r = apply(s, { type: 'play', seat: 0, cards: cards('3') });
    expect(r.state.phase).toBe(GamePhase.Settled);
    expect(r.state.winner).toBe(Side.Landlord); // 座位 0 = 地主
    expect(r.events.some((e) => e.type === 'win')).toBe(true);
  });
});

describe('game-core: snapshot', () => {
  it('暴露剩牌数、隐藏他人手牌、viewer 附自身手牌', () => {
    const s = playing(['3 4 5', '6 7', '8'], { turn: 0 });
    const snap = snapshot(s, 0);
    expect(snap.handCounts).toEqual([3, 2, 1]);
    expect(snap.viewerHand?.length).toBe(3);
  });
});
