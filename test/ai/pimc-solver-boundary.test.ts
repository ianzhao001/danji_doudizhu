import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDeck, legalFollows, recognize, type Card } from '../../assets/scripts/rules';
import { GamePhase, type GameEvent, type GameSnapshot, type SeatIndex } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const captured = vi.hoisted(() => ({
  consume: 1,
  solved: [] as Array<{ total: number; counts: number[][]; nodesBefore: number; used: number; table: object }>,
  rolled: [] as Array<{ total: number; counts: number[][] }>,
}));
vi.mock('../../assets/scripts/ai/worldSolver', () => ({
  solveWorld: (args: { counts: number[][]; budget: { nodes: number }; table: object }) => {
    const used = Math.min(captured.consume, args.budget.nodes);
    captured.solved.push({
      total: args.counts.flat().reduce((a, b) => a + b, 0),
      counts: args.counts.map(row => row.slice()), nodesBefore: args.budget.nodes, used, table: args.table,
    });
    args.budget.nodes -= used;
    return 'landlord';
  },
}));
vi.mock('../../assets/scripts/ai/rollout', async importOriginal => {
  const original = await importOriginal<typeof import('../../assets/scripts/ai/rollout')>();
  return { ...original, rolloutRound: (args: { counts: number[][] }) => {
    captured.rolled.push({ total: args.counts.flat().reduce((a, b) => a + b, 0),
      counts: args.counts.map(row => row.slice()) });
    return { winnerSide: 'landlord', plays: 1 };
  } };
});
import { HARD_PIMC, pimcRank } from '../../assets/scripts/ai/pimc';

const key = (card: Card) => `${card.rank}:${card.suit}`;

// Constructed conserving public fixture, not a claimed historical replay.
// Assign every physical card exactly once to remaining hands or played history.
function fixture(total: number, topSpec = '3') {
  const hand = cards('4 4 6');
  const topCards = cards(topSpec);
  const reserved = new Set([...hand, ...topCards].map(key));
  const available = createDeck().filter(card => !reserved.has(key(card)));
  const hidden = available.slice(0, total - hand.length);
  const played = [...available.slice(hidden.length), ...topCards];
  const handCounts: [number, number, number] = [hand.length, 7, total - hand.length - 7];
  const sizes = [20 - handCounts[0], 17 - handCounts[1], 17 - handCounts[2]];
  let offset = 0;
  const history: GameEvent[] = sizes.flatMap((size, seat) => {
    const row = played.slice(offset, offset + size);
    offset += size;
    return row.map(card => ({ type: 'play' as const, seat: seat as SeatIndex, pattern: recognize([card])! }));
  });
  // The final top is seat 2's complete final move, including paired tops.
  history.splice(history.length - topCards.length, topCards.length,
    { type: 'play', seat: 2, pattern: recognize(topCards)! });
  const snapshot: GameSnapshot = { phase: GamePhase.Playing, turn: 0, landlord: 0,
    viewerHand: hand, handCounts, winner: null, top: { seat: 2, pattern: recognize(topCards)! }, passesInARow: 0 };
  const all = [...hand, ...hidden, ...history.flatMap(event => event.type === 'play' ? event.pattern.cards : [])];
  expect(all).toHaveLength(54);
  expect(new Set(all.map(key)).size).toBe(54);
  expect(sizes.map((_, seat) => history.reduce((n, event) => n + (event.type === 'play' && event.seat === seat ? event.pattern.cards.length : 0), 0))).toEqual(sizes);
  return { snapshot, history, candidates: legalFollows(hand, snapshot.top!.pattern).slice(0, 1) };
}

function rank(total: number, topSpec = '3') {
  const state = fixture(total, topSpec);
  expect(state.candidates).toHaveLength(1);
  pimcRank({ ...state, profile: HARD_PIMC, includePass: true });
}

describe('HARD PIMC successor-state exact-solver boundary', () => {
  beforeEach(() => {
    captured.consume = 1;
    captured.solved.splice(0);
    captured.rolled.splice(0);
  });

  it('solves 17→16 after a single, but rolls out the 17-card pass on the same sampled worlds', () => {
    rank(17);
    expect(captured.solved).toHaveLength(48);
    expect(captured.rolled).toHaveLength(48);
    expect(captured.solved.every(call => call.total === 16)).toBe(true);
    expect(captured.rolled.every(call => call.total === 17)).toBe(true);
    for (let sample = 0; sample < 48; sample += 1) {
      expect(captured.solved[sample].counts.slice(1)).toEqual(captured.rolled[sample].counts.slice(1));
    }
    expect(new Set(captured.solved.map(call => call.table)).size).toBe(1);
  });

  it('does not invoke exact solving for a 17-card successor or an 18-card pass', () => {
    rank(18);
    expect(captured.solved).toHaveLength(0);
    expect(captured.rolled).toHaveLength(96);
    expect(captured.rolled.slice(0, 48).every(call => call.total === 17)).toBe(true);
    expect(captured.rolled.slice(48).every(call => call.total === 18)).toBe(true);
  });

  it('counts every shed card: a pair from 18 enters at 16, while passing stays outside', () => {
    rank(18, '3 3');
    expect(captured.solved).toHaveLength(48);
    expect(captured.solved.every(call => call.total === 16)).toBe(true);
    expect(captured.rolled).toHaveLength(48);
    expect(captured.rolled.every(call => call.total === 18)).toBe(true);
  });

  it('caps combined exact work at 120k and shares proved facts across play and pass', () => {
    captured.consume = 10_000;
    rank(16);
    expect(captured.solved).toHaveLength(12);
    expect(captured.rolled).toHaveLength(84);
    expect(captured.solved.map(call => call.nodesBefore)).toEqual([
      60_000, 50_000, 40_000, 30_000, 20_000, 10_000,
      60_000, 50_000, 40_000, 30_000, 20_000, 10_000,
    ]);
    expect(captured.solved.reduce((sum, call) => sum + call.used, 0)).toBe(120_000);
    expect(new Set(captured.solved.map(call => call.table)).size).toBe(1);
    expect(captured.solved.slice(0, 6).every(call => call.total === 15)).toBe(true);
    expect(captured.solved.slice(6).every(call => call.total === 16)).toBe(true);
  });
});
