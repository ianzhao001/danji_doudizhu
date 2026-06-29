import { describe, expect, it } from 'vitest';

import { AiLevel } from '../../assets/scripts/ai';
import type { BidAdvice } from '../../assets/scripts/ai/bidding-advisor';
import type { CardMemory } from '../../assets/scripts/ai/cardMemory';
import type { HandStrength } from '../../assets/scripts/ai/handStrength';
import type { ActionInsight } from '../../assets/scripts/ai/insight';
import type { MatchStats } from '../../assets/scripts/data/stats';
import type { StatsDigest } from '../../assets/scripts/data/statsDigest';
import type { RecordQuery } from '../../assets/scripts/data/recordsQuery';
import type { RecordsState } from '../../assets/scripts/data/records';
import { defaultSettings, type Settings } from '../../assets/scripts/data/settings';
import { createBidding, GamePhase, Side, type GameSnapshot, type Settlement, type TopPlay } from '../../assets/scripts/game';
import type { ReplayTrick } from '../../assets/scripts/game/trick-replay';
import { Category, Rank, Suit, recognize } from '../../assets/scripts/rules';
import type { FlowEvent } from '../../assets/scripts/flow';
import { deriveActionButtons } from '../../assets/scripts/ui/action-buttons';
import { deriveBiddingView } from '../../assets/scripts/ui/bidding-view';
import { deriveResultView } from '../../assets/scripts/ui/result-view';
import { deriveStatsView } from '../../assets/scripts/ui/stats-view';
import { deriveRecordsView } from '../../assets/scripts/ui/records-view';
import { deriveLobbyView } from '../../assets/scripts/ui/lobby-view';
import { deriveSettingsView, setDifficulty, toggleSetting } from '../../assets/scripts/ui/settings-view';
import { deriveScreenVM } from '../../assets/scripts/ui/screen-view';
import { deriveStrengthMeter } from '../../assets/scripts/ui/strength-meter-view';
import { deriveCardMemoryView } from '../../assets/scripts/ui/card-memory-view';
import { deriveRecordsDetailView } from '../../assets/scripts/ui/records-detail-view';
import { deriveStatsDetailView } from '../../assets/scripts/ui/stats-detail-view';
import { deriveBiddingAdviceView } from '../../assets/scripts/ui/bidding-advice-view';
import { deriveReplayView } from '../../assets/scripts/ui/replay-view';
import { deriveLastActions } from '../../assets/scripts/ui/last-action-view';
import { deriveAiThinking } from '../../assets/scripts/ui/ai-thinking-view';
import { deriveInsightView } from '../../assets/scripts/ui/insight-view';
import { cards } from '../rules/_util';

const layoutOpts = { containerWidth: 390, cardWidth: 40, liftOffset: 16 };

function expectUnchanged<T>(value: T, act: (value: T) => unknown): void {
  const before = structuredClone(value);
  act(value);
  expect(value).toEqual(before);
}

function top(spec: string): TopPlay {
  return { seat: 1, pattern: recognize(cards(spec))! };
}

function snapshot(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 2,
    top: top('3'),
    handCounts: [3, 3, 3],
    winner: null,
    viewerHand: cards('5 K 2'),
    ...overrides,
  };
}

function settlement(overrides: Partial<Settlement> = {}): Settlement {
  return { multiplier: 4, bombs: 1, spring: 'none', scores: [-2, -2, 4], ...overrides };
}

function stats(overrides: Partial<MatchStats> = {}): MatchStats {
  return {
    rounds: 3,
    asLandlord: 1,
    landlordWins: 1,
    asFarmer: 2,
    farmerWins: 1,
    netScore: 6,
    ...overrides,
  };
}

function records(): RecordsState {
  return {
    version: 1,
    entries: [
      {
        heroSeat: 0,
        landlord: 0,
        winner: Side.Landlord,
        multiplier: 4,
        bombs: 1,
        spring: 'spring',
        heroScore: 8,
        playedAt: 100,
      },
      {
        heroSeat: 0,
        landlord: 2,
        winner: Side.Landlord,
        multiplier: 2,
        bombs: 0,
        spring: 'none',
        heroScore: -2,
        playedAt: 200,
      },
    ],
  };
}

function digest(): StatsDigest {
  return {
    total: 2,
    wins: 1,
    losses: 1,
    winRatePct: 50,
    currentStreak: -1,
    bestWinStreak: 1,
    bestScore: 8,
    worstScore: -2,
    totalBombs: 1,
    springCount: 1,
    landlordRounds: 1,
    landlordWins: 1,
    farmerRounds: 1,
    farmerWins: 0,
  };
}

function cardMemory(): CardMemory {
  const remainingByRank: Record<number, number> = {};
  for (let rank = Rank.R3; rank <= Rank.BigJoker; rank += 1) {
    remainingByRank[rank] = rank >= Rank.SmallJoker ? 1 : 4;
  }
  remainingByRank[Rank.K] = 0;
  return { remainingByRank, playedCount: 4 };
}

describe('view-model input immutability', () => {
  it('keeps representative legacy VM inputs unchanged', () => {
    const selectedCards = cards('K');
    const recentEvents: FlowEvent[] = [
      { type: 'round', event: { type: 'play', seat: 0, pattern: top('K').pattern } },
    ];

    expectUnchanged({ snapshot: snapshot(), selectedCards, viewerSeat: 0 as const }, (args) =>
      deriveActionButtons(args),
    );
    expectUnchanged(createBidding(0), (value) => deriveBiddingView(value, 0));
    expectUnchanged({ settlement: settlement(), landlord: 2 as const, heroSeat: 2 as const }, deriveResultView);
    expectUnchanged(stats(), deriveStatsView);
    expectUnchanged(records(), (value) => deriveRecordsView(value, 2));
    expectUnchanged({ savedSlot: null, stats: stats() }, deriveLobbyView);
    expectUnchanged(defaultSettings(), deriveSettingsView);
    expectUnchanged(defaultSettings(), (value) => toggleSetting(value, 'sound'));
    expectUnchanged(defaultSettings(), (value) => setDifficulty(value, AiLevel.Hard));
    expectUnchanged(
      { snapshot: snapshot(), heroSeat: 0 as const, selectedCards, recentEvents, layoutOpts },
      deriveScreenVM,
    );
  });

  it('keeps newly added detail and advisor VM inputs unchanged', () => {
    const query: RecordQuery = { outcome: 'win', role: 'landlord', spring: 'spring', order: 'newest', limit: 1 };
    const handStrength: HandStrength = { score: 67, bombs: 1, rockets: 0, highCards: 2, longestStraight: 5 };
    const bidAdvice: BidAdvice = { suggestion: 'call', strong: true };
    const replay: ReplayTrick[] = [
      { index: 0, leader: 0, plays: [{ seat: 0, kind: 'play' }], winnerSeat: 0 },
    ];
    const insight: ActionInsight = {
      recommended: {
        cards: [{ rank: Rank.R3, suit: Suit.Spade }],
        pattern: {
          category: Category.Single,
          mainRank: Rank.R3,
          length: 1,
          cards: [{ rank: Rank.R3, suit: Suit.Spade }],
        },
      },
      shouldPass: false,
      rationale: '先出小牌，尽量保留炸弹',
      strengthScore: 70,
    };

    expectUnchanged({ records: records(), query }, (args) => deriveRecordsDetailView(args.records, args.query));
    expectUnchanged(digest(), deriveStatsDetailView);
    expectUnchanged(handStrength, deriveStrengthMeter);
    expectUnchanged(cardMemory(), deriveCardMemoryView);
    expectUnchanged(bidAdvice, deriveBiddingAdviceView);
    expectUnchanged(replay, (value) => deriveReplayView(value, 0));
    expectUnchanged(recentRoundEvents(), deriveLastActions);
    expectUnchanged(insight, deriveInsightView);
    expectUnchanged({ turn: 1 as const, heroSeat: 0 as const, phase: 'playing' as const, tickMs: 900 }, (args) =>
      deriveAiThinking(args.turn, args.heroSeat, args.phase, args.tickMs),
    );
  });
});

function recentRoundEvents() {
  return [
    { type: 'pass' as const, seat: 1 as const },
    { type: 'play' as const, seat: 0 as const, pattern: top('K').pattern },
  ];
}
