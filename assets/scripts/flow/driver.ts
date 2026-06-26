/**
 * M2-06 headless 回合驱动器。实现方：实现 runHeadlessRound 函数体，
 * 使 test/flow/driver.test.ts 转绿。编排步骤见 coordination/tasks/M2-06-flow.md。
 * 只做编排（发牌→叫抢→地主拿底牌→出牌循环→结算），不重判规则、不内联 AI 进 game；
 * 思考时延必须走 config.clock.sleep；禁止 import `cc`、禁止改签名。
 */

import { chooseAction } from '../ai';
import { createRng, deal as dealCards } from '../rules';
import {
  apply,
  applyBid,
  createBidding,
  createPlayingRound,
  GamePhase,
  settle,
  snapshot,
} from '../game';
import type { GameEvent, SeatIndex } from '../game';
import { realClock } from './clock';
import {
  HeadlessRoundError,
  defaultBidPolicy,
  type FlowConfig,
  type FlowEvent,
  type FlowResult,
  type PlayPolicy,
} from './types';

const DIAGNOSTIC_EVENT_COUNT = 10;

const defaultPlayPolicy: PlayPolicy = ({ snapshot, rng }) => chooseAction(snapshot, rng);

function roundError(
  message: string,
  info: { seed: number; turns: number; landlord: SeatIndex | null; events: FlowEvent[] },
): HeadlessRoundError {
  return new HeadlessRoundError(message, {
    seed: info.seed,
    turns: info.turns,
    landlord: info.landlord,
    lastEvents: info.events.slice(-DIAGNOSTIC_EVENT_COUNT),
  });
}

export async function runHeadlessRound(config: FlowConfig): Promise<FlowResult> {
  const rng = createRng(config.seed);
  const startSeat = config.startSeat ?? 0;
  const baseScore = config.baseScore ?? 1;
  const thinkingDelayMs = config.thinkingDelayMs ?? 0;
  const clock = config.clock ?? realClock;
  const bidPolicy = config.bidPolicy ?? defaultBidPolicy;
  const playPolicy = config.playPolicy ?? defaultPlayPolicy;
  const maxTurns = config.maxTurns ?? 300;
  const maxRedeals = config.maxRedeals ?? 10;

  const events: FlowEvent[] = [];
  let redeals = 0;
  let currentDeal = dealCards(rng);

  while (true) {
    events.push({ type: 'deal' });
    let bidding = createBidding(startSeat);

    while (bidding.phase !== 'done' && bidding.phase !== 'redeal') {
      const action = bidPolicy({
        seat: bidding.turn,
        state: bidding,
        hand: currentDeal.hands[bidding.turn].slice(),
      });
      bidding = applyBid(bidding, action);
      events.push({ type: 'bid', action, multiplier: bidding.multiplier });
    }

    if (bidding.phase === 'done') {
      if (bidding.landlord === null) {
        throw new Error(`Bidding finished without landlord seed=${config.seed}`);
      }
      events.push({ type: 'landlordDecided', landlord: bidding.landlord, bidMultiplier: bidding.multiplier });

      let state = createPlayingRound(currentDeal, bidding.landlord);
      const gameEvents: GameEvent[] = [];
      let turns = 0;

      while (state.phase !== GamePhase.Settled) {
        if (turns >= maxTurns) {
          throw roundError(`Headless round exceeded maxTurns seed=${config.seed} turn=${turns}`, {
            seed: config.seed,
            turns,
            landlord: bidding.landlord,
            events,
          });
        }

        const snap = snapshot(state, state.turn);
        const action = playPolicy({ seat: state.turn, snapshot: snap, rng });
        await clock.sleep(thinkingDelayMs);
        const result = apply(state, action);
        state = result.state;
        gameEvents.push(...result.events);
        for (const event of result.events) events.push({ type: 'round', event });
        turns++;
      }

      const win = gameEvents.find((event): event is Extract<GameEvent, { type: 'win' }> => event.type === 'win');
      if (!win) {
        throw roundError(`Settled round missing win event seed=${config.seed} turn=${turns}`, {
          seed: config.seed,
          turns,
          landlord: bidding.landlord,
          events,
        });
      }

      const settlement = settle({
        landlord: bidding.landlord,
        winner: win.side,
        bidMultiplier: bidding.multiplier,
        events: gameEvents,
        baseScore,
      });
      events.push({ type: 'settled', settlement });

      return {
        landlord: bidding.landlord,
        winner: win.side,
        settlement,
        events,
        turns,
        redeals,
        finalState: state,
      };
    }

    redeals++;
    events.push({ type: 'redeal', attempt: redeals });
    if (redeals > maxRedeals) {
      throw new Error(`Headless round exceeded maxRedeals seed=${config.seed} redeals=${redeals}`);
    }
    currentDeal = dealCards(rng);
  }
}
