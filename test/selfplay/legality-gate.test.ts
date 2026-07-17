/**
 * W-AI S10：合法性零违规常驻门（规划者直落 main · 2026-07-17 · sota2）。
 * 三档同质三席整局自对弈，包装 playPolicy/bidPolicy：每个动作 pre-apply 校验——
 * 出牌必过 validatePlay + 牌权归属（多重集 ⊆ viewerHand）+ 领出不得 pass + seat 对位。
 * 预期**绿**（守护门，护航 W-AI 新引擎接线后的每一步）；
 * 门自证：对注入的非法动作，校验器必须抛错（见「门自证」用例）。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel, chooseBidByLevel, strategyFor } from '../../assets/scripts/ai';
import { runHeadlessRound, type BidPolicy, type PlayPolicy } from '../../assets/scripts/flow';
import { recognize, validatePlay } from '../../assets/scripts/rules';
import { GamePhase, type GameSnapshot, type RoundAction } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

function assertLegalAction(snapshot: GameSnapshot, action: RoundAction): void {
  if (action.seat !== snapshot.turn) {
    throw new Error(`LEGALITY: seat mismatch turn=${snapshot.turn} action=${JSON.stringify(action)}`);
  }
  if (action.type === 'pass') {
    if (snapshot.top === null) throw new Error('LEGALITY: leader must play, pass on empty top');
    return;
  }
  const verdict = validatePlay(action.cards, snapshot.top?.pattern ?? null);
  if (!verdict.ok) {
    throw new Error(`LEGALITY: invalid play ${JSON.stringify(action.cards.map((c) => c.rank))} reason=${verdict.reason}`);
  }
  const pool = new Map<string, number>();
  for (const card of snapshot.viewerHand ?? []) {
    const key = `${card.rank}:${card.suit}`;
    pool.set(key, (pool.get(key) ?? 0) + 1);
  }
  for (const card of action.cards) {
    const key = `${card.rank}:${card.suit}`;
    const left = pool.get(key) ?? 0;
    if (left <= 0) throw new Error(`LEGALITY: card not owned ${key}`);
    pool.set(key, left - 1);
  }
}

function auditedPolicies(level: AiLevel): { playPolicy: PlayPolicy; bidPolicy: BidPolicy } {
  return {
    playPolicy: ({ snapshot, rng, history }) => {
      const action = strategyFor(level)(snapshot, rng, history ?? []);
      assertLegalAction(snapshot, action);
      return action;
    },
    bidPolicy: ({ seat, state, hand }) => {
      const action = chooseBidByLevel(hand, state, level);
      if (action.seat !== state.turn || action.seat !== seat) {
        throw new Error(`LEGALITY: bid seat mismatch turn=${state.turn} seat=${seat} action=${JSON.stringify(action)}`);
      }
      return action;
    },
  };
}

describe('W-AI S10 合法性零违规门（三档 × 20 seed 整局审计）', () => {
  it('门自证：校验器抓得住非法动作（错席/凭空牌/不可压/领出 pass）', () => {
    const snapshot: GameSnapshot = {
      phase: GamePhase.Playing,
      turn: 0,
      landlord: 0,
      top: null,
      handCounts: [3, 5, 5],
      winner: null,
      viewerHand: cards('3 4 5'),
    };
    expect(() => assertLegalAction(snapshot, { type: 'play', seat: 1, cards: cards('3') })).toThrow('seat mismatch');
    expect(() => assertLegalAction(snapshot, { type: 'play', seat: 0, cards: cards('9') })).toThrow('not owned');
    expect(() => assertLegalAction(snapshot, { type: 'pass', seat: 0 })).toThrow('leader must play');
    expect(() => assertLegalAction(snapshot, { type: 'play', seat: 0, cards: cards('3 4') })).toThrow('invalid play');
    expect(() => assertLegalAction(snapshot, { type: 'play', seat: 0, cards: cards('3') })).not.toThrow();
    const following: GameSnapshot = { ...snapshot, top: { seat: 1, pattern: recognize(cards('6'))! } };
    expect(() => assertLegalAction(following, { type: 'play', seat: 0, cards: cards('3') })).toThrow('invalid play');
    expect(() => assertLegalAction(following, { type: 'pass', seat: 0 })).not.toThrow();
  });

  for (const level of [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard]) {
    it(`${level}：20 seed 整局零违规（每步 validatePlay + 牌权 + 席位）`, async () => {
      const { playPolicy, bidPolicy } = auditedPolicies(level);
      for (const seed of SEEDS) {
        const result = await runHeadlessRound({ seed, playPolicy, bidPolicy });
        expect(result.settlement.scores[0] + result.settlement.scores[1] + result.settlement.scores[2]).toBe(0);
      }
    }, 180_000);
  }
});
