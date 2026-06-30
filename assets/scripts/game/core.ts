/**
 * game-core 单局状态机（出牌循环）。
 * 实现方任务：实现以下三个函数体，使 test/game/core.test.ts 转绿。
 * 规则见 coordination/tasks/M2-01-game-core.md。禁止 import `cc`，禁止改本文件签名。
 */

import { Card, Category, Deal, validatePlay } from '../rules';
import { cardKey } from '../rules/guards';
import {
  RoundState,
  RoundAction,
  ApplyResult,
  GameSnapshot,
  SeatIndex,
  GamePhase,
  Side,
  IllegalActionError,
  GameEvent,
  PlayerSeat,
} from './types';
import { nextSeat } from './seat';

function findSeat(state: RoundState, seat: SeatIndex): PlayerSeat {
  const player = state.seats.find((s) => s.index === seat);
  if (!player) throw new IllegalActionError('UNKNOWN_SEAT');
  return player;
}

function countCards(cards: Card[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const card of cards) {
    const key = cardKey(card);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function ensureOwnsCards(hand: Card[], cards: Card[]): void {
  const handCounts = countCards(hand);
  for (const card of cards) {
    const key = cardKey(card);
    const count = handCounts.get(key) ?? 0;
    if (count <= 0) throw new IllegalActionError('CARD_NOT_IN_HAND');
    handCounts.set(key, count - 1);
  }
}

function removeCards(hand: Card[], cards: Card[]): Card[] {
  const removeCounts = countCards(cards);
  return hand.filter((card) => {
    const key = cardKey(card);
    const count = removeCounts.get(key) ?? 0;
    if (count <= 0) return true;
    removeCounts.set(key, count - 1);
    return false;
  });
}

function replaceSeatHand(state: RoundState, seat: SeatIndex, hand: Card[]): PlayerSeat[] {
  return state.seats.map((player) =>
    player.index === seat ? { ...player, hand } : player,
  );
}

function sideOf(seat: SeatIndex, landlord: SeatIndex): Side {
  return seat === landlord ? Side.Landlord : Side.Farmer;
}

/** 用发牌结果与指定地主创建 Playing 局：地主获底牌(17→20)，turn=地主，top=null。 */
export function createPlayingRound(deal: Deal, landlord: SeatIndex): RoundState {
  const seats: PlayerSeat[] = deal.hands.map((hand, index) => ({
    index: index as SeatIndex,
    hand: index === landlord ? hand.concat(deal.bottom) : hand.slice(),
  }));

  return {
    phase: GamePhase.Playing,
    landlord,
    seats,
    turn: landlord,
    top: null,
    passesInARow: 0,
    winner: null,
    bombsPlayed: 0,
  };
}

/** 校验并应用动作；非法抛 IllegalActionError；返回新状态 + 事件序列（不可变更新）。 */
export function apply(state: RoundState, action: RoundAction): ApplyResult {
  if (state.phase === GamePhase.Settled) throw new IllegalActionError('ROUND_SETTLED');
  if (action.seat !== state.turn) throw new IllegalActionError('NOT_TURN');

  if (action.type === 'pass') {
    if (!state.top) throw new IllegalActionError('PASS_WITHOUT_TOP');

    const events: GameEvent[] = [{ type: 'pass', seat: action.seat }];
    const nextPasses = state.passesInARow + 1;
    const leader = state.top.seat;

    if (nextPasses >= 2) {
      events.push({ type: 'reset', leader });
      return {
        state: {
          ...state,
          turn: leader,
          top: null,
          passesInARow: 0,
        },
        events,
      };
    }

    return {
      state: {
        ...state,
        turn: nextSeat(action.seat),
        passesInARow: nextPasses,
      },
      events,
    };
  }

  const player = findSeat(state, action.seat);
  ensureOwnsCards(player.hand, action.cards);

  const result = validatePlay(action.cards, state.top?.pattern ?? null);
  if (!result.ok || !result.pattern) {
    throw new IllegalActionError(result.reason ?? 'INVALID_PATTERN');
  }

  const nextHand = removeCards(player.hand, action.cards);
  const events: GameEvent[] = [{ type: 'play', seat: action.seat, pattern: result.pattern }];
  const isBomb = result.pattern.category === Category.Bomb;
  const isRocket = result.pattern.category === Category.Rocket;
  if (isBomb) events.push({ type: 'bomb', seat: action.seat });
  if (isRocket) events.push({ type: 'rocket', seat: action.seat });

  const nextState: RoundState = {
    ...state,
    seats: replaceSeatHand(state, action.seat, nextHand),
    turn: nextSeat(action.seat),
    top: { seat: action.seat, pattern: result.pattern },
    passesInARow: 0,
    bombsPlayed: state.bombsPlayed + (isBomb || isRocket ? 1 : 0),
  };

  if (nextHand.length === 0) {
    const side = sideOf(action.seat, state.landlord);
    events.push({ type: 'win', seat: action.seat, side });
    return {
      state: {
        ...nextState,
        phase: GamePhase.Settled,
        winner: side,
      },
      events,
    };
  }

  return { state: nextState, events };
}

/** 只读快照；viewer 给定时附其手牌，不泄露他人手牌。 */
export function snapshot(state: RoundState, viewer?: SeatIndex): GameSnapshot {
  const handCounts = [0, 1, 2].map((seat) => findSeat(state, seat as SeatIndex).hand.length) as [
    number,
    number,
    number,
  ];
  const snap: GameSnapshot = {
    phase: state.phase,
    turn: state.turn,
    landlord: state.landlord,
    top: state.top,
    handCounts,
    winner: state.winner,
  };

  if (viewer !== undefined) {
    snap.viewerHand = findSeat(state, viewer).hand.slice();
  }

  return snap;
}
