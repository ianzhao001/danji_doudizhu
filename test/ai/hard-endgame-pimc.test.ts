import { describe, expect, it } from 'vitest';
import { hardStrategy, hardStrategyWithProfile } from '../../assets/scripts/ai/levels/hard';
import { installDecisionSink, uninstallDecisionSink } from '../../assets/scripts/ai/decision-log';
import { HARD_PIMC, HINT_PIMC, capturePimcRanks } from '../../assets/scripts/ai/pimc';
import { certainLandlordByRank } from '../../assets/scripts/ai/cardMemory';
import { solveWorld } from '../../assets/scripts/ai/worldSolver';
import { toRankCounts } from '../../assets/scripts/ai/rollout';
import { Rank, createDeck, createRng, deal, legalFollows, recognize, type Card } from '../../assets/scripts/rules';
import { GamePhase, apply, createPlayingRound, snapshot as publicSnapshot, type GameEvent, type GameSnapshot } from '../../assets/scripts/game';
import { runHeadlessRound } from '../../assets/scripts/flow';
import { v19BidByName, v19StrategyByName } from '../fixtures/ai-v19/v19';
import { cards } from '../rules/_util';

const rng = { next: () => 0 };
const key = (card: Card) => `${card.rank}:${card.suit}`;

// Constructed public-information fixture, not a claimed replay: the full deck
// is accounted for without duplicate cards. The unplayed bottom J fixes the
// landlord's one remaining card, leaving the pair 33 with our teammate.
function teammatePairFixture(): { snapshot: GameSnapshot; history: GameEvent[] } {
  const hand = cards('4 6 K');
  const hidden = cards('3 3 J');
  const top = cards('Q');
  const held = new Set([...hand, ...hidden, ...top].map(key));
  const played = createDeck().filter(card => !held.has(key(card)));
  // Initial seat sizes are 17/20/17. Reserve the already-played bottom A/2
  // for the landlord, but put every other J in farmers' histories: rank-based
  // bottom inference must retain the unplayed J rather than subtract another suit.
  const landlordPlayed = cards('A 2');
  const landlordKeys = new Set(landlordPlayed.map(key));
  for (const card of played) {
    if (landlordPlayed.length === 19) break;
    if (card.rank === Rank.J || landlordKeys.has(key(card))) continue;
    landlordPlayed.push(card);
    landlordKeys.add(key(card));
  }
  const farmerPlayed = played.filter(card => !landlordKeys.has(key(card)));
  const seats = [farmerPlayed.slice(0, 14), landlordPlayed, farmerPlayed.slice(14)] as const;
  const history: GameEvent[] = seats.flatMap((seatCards, seat) => seatCards.map(card => ({
    type: 'play' as const, seat: seat as 0 | 1 | 2, pattern: recognize([card])!,
  })));
  history.push({ type: 'play', seat: 0, pattern: recognize(top)! }, { type: 'pass', seat: 1 });
  return {
    snapshot: {
      phase: GamePhase.Playing, turn: 2, landlord: 1,
      top: { seat: 0, pattern: recognize(top)! }, passesInARow: 1,
      handCounts: [2, 1, 3], viewerHand: hand, winner: null,
      bottom: cards('J A 2'),
    },
    history,
  };
}

describe('hard public-world team-aware arbitration', () => {
  it('passes a safe teammate top to preserve its winning pair instead of stealing the lead', () => {
    const { snapshot, history } = teammatePairFixture();
    const plays = history.filter((event): event is Extract<GameEvent, { type: 'play' }> => event.type === 'play');
    expect([0, 1, 2].map(seat => plays.filter(event => event.seat === seat)
      .reduce((sum, event) => sum + event.pattern.cards.length, 0))).toEqual([15, 19, 14]);
    expect(plays.filter(event => event.seat === 1).every(event =>
      event.pattern.cards.every(card => card.rank !== Rank.J))).toBe(true);
    expect(certainLandlordByRank(snapshot, history)![Rank.J]).toBe(1);
    const allCards = [...snapshot.viewerHand!, ...cards('3 3 J'), ...plays.flatMap(event => event.pattern.cards)];
    expect(allCards).toHaveLength(54);
    expect(new Set(allCards.map(key)).size).toBe(54);
    const captured = capturePimcRanks(() => hardStrategy(snapshot, rng, history));
    expect(captured.value).toEqual({ type: 'pass', seat: 2 });
    expect(captured.rankings).toHaveLength(1);
    const [best, takeover] = captured.rankings[0]!;
    expect(best!.move).toBeNull();
    expect(best!.score).toBeGreaterThan(0);
    expect(takeover!.score).toBeLessThan(0);
    expect(takeover!.move!.cards.map(card => card.rank)).toEqual([13]);

    // Independent complete-world comparison of the two successor states.
    const counts = [cards('3 3'), cards('J'), cards('4 6 K')].map(toRankCounts) as [number[], number[], number[]];
    expect(solveWorld({ counts, turn: 0, landlord: 1, top: null, topSeat: null, passes: 0,
      budget: { nodes: 10_000 } })).toBe('farmer');
    const afterTakeover = [cards('3 3'), cards('J'), cards('4 6')].map(toRankCounts) as [number[], number[], number[]];
    expect(solveWorld({ counts: afterTakeover, turn: 0, landlord: 1,
      top: recognize(cards('K'))!, topSeat: 2, passes: 0, budget: { nodes: 10_000 } })).toBe('landlord');
  });

  it('preserves zero-sample ablation and does not sample non-conserving snapshots', () => {
    const { snapshot, history } = teammatePairFixture();
    const oldPolicy = hardStrategyWithProfile({ samples: 0, maxCandidates: 8 });
    const ablation = capturePimcRanks(() => oldPolicy(snapshot, rng, history));
    expect(ablation.rankings).toHaveLength(0);
    expect(ablation.value).toEqual({ type: 'play', seat: 2, cards: cards('K') });
    const incomplete = capturePimcRanks(() => hardStrategy(snapshot, rng, []));
    expect(incomplete.rankings).toHaveLength(0);
    expect(incomplete.value).toEqual(ablation.value);
  });

  it('arbitrates both 16-card and 17-card positions in a real public replay', async () => {
    const paths: Array<{ total: number; path: string }> = [];
    let turn = 0;
    const frozen = v19StrategyByName('hard');
    await runHeadlessRound({
      seed: 14,
      bidPolicy: ({ state, hand }) => v19BidByName(hand, state, 'hard'),
      playPolicy: ({ snapshot, history, rng: roundRng }) => {
        if (turn === 43 || turn === 44) {
          let path = '';
          installDecisionSink({ publish: decision => { path = decision.path; } });
          try {
            hardStrategy(snapshot, rng, history);
          } finally {
            uninstallDecisionSink();
          }
          paths.push({ total: snapshot.handCounts.reduce((sum, count) => sum + count, 0), path });
        }
        turn += 1;
        return frozen(snapshot, roundRng, history);
      },
    });
    expect(paths).toEqual([
      { total: 17, path: 'world-pimc' },
      { total: 16, path: 'world-pimc' },
    ]);
  });

  it('keeps opening lead search at 54 cards and switches to world arbitration after the first single', () => {
    const initial = createPlayingRound(deal(createRng(14)), 0);
    const originalDeck = initial.seats.flatMap(seat => seat.hand);
    expect(originalDeck).toHaveLength(54);
    expect(new Set(originalDeck.map(key)).size).toBe(54);
    const opening = publicSnapshot(initial, initial.turn);
    const leadCard = initial.seats[initial.turn]!.hand.slice().sort((a, b) => a.rank - b.rank)[0]!;
    // Apply a legal single through the production state machine, rather than
    // synthesizing a lower handCount or inventing a public-history event.
    const next = apply(initial, { type: 'play', seat: initial.turn, cards: [leadCard] });
    const following = publicSnapshot(next.state, next.state.turn);
    const played = next.events.flatMap(event => event.type === 'play' ? event.pattern.cards : []);
    const accounted = [...next.state.seats.flatMap(seat => seat.hand), ...played];
    expect(accounted.map(key).sort()).toEqual(originalDeck.map(key).sort());
    expect(new Set(accounted.map(key)).size).toBe(54);
    expect(opening.handCounts.reduce((a, b) => a + b, 0)).toBe(54);
    expect(following.handCounts.reduce((a, b) => a + b, 0)).toBe(53);
    const frames = [
      { state: initial, snapshot: opening, history: [] as GameEvent[], path: 'lead-pimc' },
      { state: next.state, snapshot: following, history: next.events, path: 'world-pimc' },
    ];
    for (const frame of frames) {
      const before = JSON.stringify(frame);
      const paths: string[] = [];
      installDecisionSink({ publish: decision => { paths.push(decision.path); } });
      let loggedAction: ReturnType<typeof hardStrategy>;
      try { loggedAction = hardStrategy(frame.snapshot, rng, frame.history); }
      finally { uninstallDecisionSink(); }
      const result = capturePimcRanks(() => hardStrategy(frame.snapshot, rng, frame.history));
      expect(result.value).toEqual(loggedAction);
      expect(paths).toEqual([frame.path]);
      expect(result.rankings).toHaveLength(1);
      const ranked = result.rankings[0]!;
      expect(ranked.filter(option => option.move !== null).length).toBeLessThanOrEqual(HARD_PIMC.maxCandidates);
      expect(ranked.some(option => option.move === null)).toBe(frame.snapshot.top !== null);
      expect(result.value).toEqual(ranked[0]!.move === null
        ? { type: 'pass', seat: frame.snapshot.turn }
        : { type: 'play', seat: frame.snapshot.turn, cards: ranked[0]!.move!.cards });
      // Production apply validates ownership, card shape, beating the top,
      // turn ownership, and the prohibition on passing an empty trick.
      expect(() => apply(frame.state, result.value)).not.toThrow();
      expect(hardStrategy(frame.snapshot, { next: () => { throw new Error('external RNG consumed'); } }, frame.history))
        .toEqual(result.value);
      expect(JSON.stringify(frame)).toBe(before);
    }
  });

  it('arbitrates public middle-game frames with legal actions matching its ranking', async () => {
    const frames: Array<{ snapshot: GameSnapshot; history: GameEvent[] }> = [];
    let turn = 0;
    const frozen = v19StrategyByName('hard');
    await runHeadlessRound({
      seed: 14,
      bidPolicy: ({ state, hand }) => v19BidByName(hand, state, 'hard'),
      playPolicy: ({ snapshot, history, rng: roundRng }) => {
        if ([10, 20].includes(turn)) frames.push(JSON.parse(JSON.stringify({ snapshot, history })));
        turn += 1;
        return frozen(snapshot, roundRng, history);
      },
    });
    expect(frames).toHaveLength(2);
    for (const frame of frames) {
      const { snapshot, history } = frame;
      expect(snapshot.handCounts.reduce((sum, count) => sum + count, 0)).toBeGreaterThan(16);
      const before = JSON.stringify(frame);
      const decisions: string[] = [];
      installDecisionSink({ publish: decision => { decisions.push(decision.path); } });
      try { hardStrategy(snapshot, rng, history); }
      finally { uninstallDecisionSink(); }
      const result = capturePimcRanks(() => hardStrategy(snapshot, rng, history));
      expect(decisions).toEqual(['world-pimc']);
      expect(result.rankings).toHaveLength(1);
      const ranked = result.rankings[0]!;
      expect(ranked.filter(option => option.move !== null).length).toBeLessThanOrEqual(HARD_PIMC.maxCandidates);
      expect(ranked.some(option => option.move === null)).toBe(snapshot.top !== null);
      const best = ranked[0]!;
      const action = result.value;
      expect(action).toEqual(best.move === null
        ? { type: 'pass', seat: snapshot.turn }
        : { type: 'play', seat: snapshot.turn, cards: best.move.cards });
      if (action.type === 'pass') {
        expect(snapshot.top).not.toBeNull();
      } else if (action.type === 'play') {
        expect(recognize(action.cards)).not.toBeNull();
        const held = new Set(snapshot.viewerHand!.map(key));
        expect(action.cards.every(card => held.has(key(card)))).toBe(true);
        if (snapshot.top) expect(legalFollows(snapshot.viewerHand!, snapshot.top.pattern)
          .some(move => move.cards.map(key).sort().join('|') === action.cards.map(key).sort().join('|'))).toBe(true);
      }
      expect(hardStrategy(snapshot, { next: () => { throw new Error('external RNG consumed'); } }, history)).toEqual(action);
      const zeroSample = hardStrategyWithProfile({ samples: 0, maxCandidates: 8 });
      expect(capturePimcRanks(() => zeroSample(snapshot, rng, history)).rankings).toHaveLength(0);
      if (history.some(event => event.type === 'play')) {
        expect(capturePimcRanks(() => hardStrategy(snapshot, rng, [])).rankings).toHaveLength(0);
      }
      expect(JSON.stringify(frame)).toBe(before);
    }
  });

  it('extends exact-world coverage without raising sampling, candidate or node budgets', () => {
    expect(HARD_PIMC).toEqual({ samples: 48, maxCandidates: 8 });
    expect(HARD_PIMC.solverCardMax).toBe(16);
    expect(HARD_PIMC.solverNodes).toBe(120_000);
    expect(HINT_PIMC).toEqual({ samples: 160, maxCandidates: 12 });
    expect(HINT_PIMC.solverNodes).toBe(300_000);
  });

  it('keeps real frozen-policy replay decisions legal, deterministic and within the candidate cap', async () => {
    let frame: { snapshot: GameSnapshot; history: GameEvent[] } | undefined;
    let turn = 0;
    const frozen = v19StrategyByName('hard');
    await runHeadlessRound({
      seed: 6,
      bidPolicy: ({ state, hand }) => v19BidByName(hand, state, 'hard'),
      playPolicy: ({ snapshot, history, rng: roundRng }) => {
        if (turn === 40) frame = JSON.parse(JSON.stringify({ snapshot, history }));
        turn += 1;
        return frozen(snapshot, roundRng, history);
      },
    });
    expect(frame).toBeDefined();
    const { snapshot, history } = frame!;
    expect(snapshot.handCounts).toEqual([1, 8, 1]);
    const before = JSON.stringify(frame);
    const limited = hardStrategyWithProfile({ samples: 8, maxCandidates: 2, solverCardMax: 12, solverNodes: 120_000 });
    const first = capturePimcRanks(() => limited(snapshot, rng, history));
    expect(first.rankings).toHaveLength(1);
    expect(first.rankings[0]!.filter(option => option.move !== null)).toHaveLength(2);
    expect(first.rankings[0]!.every(option => option.move !== null)).toBe(true);
    expect(first.value.type).toBe('play');
    if (first.value.type === 'play') {
      const remaining = new Set(snapshot.viewerHand!.map(key));
      expect(first.value.cards.every(card => remaining.has(key(card)))).toBe(true);
      expect(recognize(first.value.cards)).not.toBeNull();
      if (snapshot.top) expect(legalFollows(snapshot.viewerHand!, snapshot.top.pattern)
        .some(move => JSON.stringify(move.cards) === JSON.stringify(first.value.type === 'play' ? first.value.cards : []))).toBe(true);
    }
    expect(limited(snapshot, { next: () => { throw new Error('external RNG consumed'); } }, history)).toEqual(first.value);
    expect(JSON.stringify(frame)).toBe(before);
  });
});
