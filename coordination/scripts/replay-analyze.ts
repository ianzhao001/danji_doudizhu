#!/usr/bin/env node

import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { solveForcedWin } from '../../assets/scripts/ai/endgameSolver';
import { solveWorld, type WorldWinner } from '../../assets/scripts/ai/worldSolver';
import {
  MATCH_LOG_VERSION,
  migrateMatchLog,
  type AiDecisionDiag,
  type MatchLogEntry,
} from '../../assets/scripts/data/match-log';
import {
  GamePhase,
  Side,
  apply,
  snapshot,
  type GameEvent,
  type GameSnapshot,
  type RoundAction,
  type RoundState,
  type SeatIndex,
} from '../../assets/scripts/game';
import { RANK_LABEL, Rank, Suit, recognize, type Card } from '../../assets/scripts/rules';
import { cardKey } from '../../assets/scripts/rules/guards';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DEFAULT_REPORT_DIR = join(REPO_ROOT, 'coordination/reports/ai-analysis/replays');
const FIXTURE_DIR = join(REPO_ROOT, 'test/ai/badcase/fixtures');
const DEFAULT_GAP = 2;
const ORACLE_NODE_BUDGET = 2_000_000;

interface CliOptions {
  input: string | null;
  out: string | null;
  fixture: boolean;
  gap: number;
  selftest: boolean;
}

interface DecisionReview {
  eventIndex: number;
  seat: SeatIndex;
  action: RoundAction;
  path: string;
  voteGap: number | null;
  beforeWinner: WorldWinner | null;
  afterWinner: WorldWinner | null;
  forcedBefore: 'win' | 'unknown' | 'n/a';
  blunder: boolean;
  lowVoteGap: boolean;
  snapshot: GameSnapshot;
  history: GameEvent[];
}

interface ReplayAnalysis {
  entry: MatchLogEntry;
  corrupt: string | null;
  corruptEventIndex: number | null;
  initialWinner: WorldWinner | null;
  decisions: DecisionReview[];
  actualHeroScore: number | null;
  omniscientHeroScore: number | null;
}

interface BadcaseFixture {
  logId: string;
  eventIndex: number;
  note: string;
  snapshot: GameSnapshot;
  history: GameEvent[];
  bannedCards: Card[];
}

class ReplayFailure extends Error {
  constructor(
    readonly eventIndex: number | null,
    message: string,
  ) {
    super(message);
    this.name = 'ReplayFailure';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseCli(argv: readonly string[]): CliOptions {
  let input: string | null = null;
  let out: string | null = null;
  let fixture = false;
  let gap = DEFAULT_GAP;
  let selftest = false;

  for (const arg of argv) {
    if (arg === '--fixture') fixture = true;
    else if (arg === '--selftest') selftest = true;
    else if (arg.startsWith('--out=')) out = arg.slice('--out='.length);
    else if (arg.startsWith('--gap=')) {
      gap = Number(arg.slice('--gap='.length));
      if (!Number.isFinite(gap) || gap < 0) throw new Error(`invalid --gap: ${arg}`);
    } else if (arg.startsWith('--')) throw new Error(`unknown option: ${arg}`);
    else if (input === null) input = arg;
    else throw new Error(`unexpected positional argument: ${arg}`);
  }
  return { input, out, fixture, gap, selftest };
}

function decodeCandidate(value: unknown, label: string): MatchLogEntry {
  const migrated = migrateMatchLog({ version: MATCH_LOG_VERSION, entries: [value] });
  if (migrated.entries.length !== 1) throw new Error(`${label}: invalid MatchLogEntry schema`);
  return migrated.entries[0]!;
}

function decodeDocument(value: unknown, label: string): MatchLogEntry[] {
  if (Array.isArray(value)) return value.map((candidate, index) => decodeCandidate(candidate, `${label}[${index}]`));
  if (isRecord(value) && Array.isArray(value.entries)) {
    return value.entries.map((candidate, index) => decodeCandidate(candidate, `${label}.entries[${index}]`));
  }
  return [decodeCandidate(value, label)];
}

function loadEntries(inputPath: string): MatchLogEntry[] {
  const absolute = resolve(process.cwd(), inputPath);
  const paths = statSync(absolute).isDirectory()
    ? readdirSync(absolute)
      .filter((name) => extname(name).toLowerCase() === '.json')
      .sort()
      .map((name) => join(absolute, name))
    : [absolute];
  if (paths.length === 0) throw new Error(`${absolute}: no JSON files`);

  const entries: MatchLogEntry[] = [];
  for (const path of paths) {
    let value: unknown;
    try {
      value = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    } catch (error) {
      throw new Error(`${path}: invalid JSON: ${errorMessage(error)}`);
    }
    entries.push(...decodeDocument(value, basename(path)));
  }
  return entries;
}

function initialState(entry: MatchLogEntry): RoundState {
  return {
    phase: GamePhase.Playing,
    landlord: entry.landlord,
    seats: entry.initialHands.map((hand, index) => ({
      index: index as SeatIndex,
      hand: hand.slice(),
    })),
    turn: entry.landlord,
    top: null,
    passesInARow: 0,
    winner: null,
    bombsPlayed: 0,
    bottom: entry.bottom.slice(),
  };
}

function validateInitialCards(entry: MatchLogEntry): void {
  const seen = new Set<string>();
  for (const hand of entry.initialHands) {
    for (const card of hand) {
      const key = cardKey(card);
      if (seen.has(key)) throw new ReplayFailure(null, `duplicate initial card ${key}`);
      seen.add(key);
    }
  }
  const landlordCards = new Set(entry.initialHands[entry.landlord].map(cardKey));
  for (const card of entry.bottom) {
    if (!landlordCards.has(cardKey(card))) {
      throw new ReplayFailure(null, `bottom card ${cardKey(card)} is absent from landlord initial hand`);
    }
  }
}

function handTotal(state: RoundState): number {
  return state.seats.reduce((total, seat) => total + seat.hand.length, 0);
}

function countsOf(state: RoundState): [number[], number[], number[]] {
  return state.seats.map((seat) => {
    const counts = new Array<number>(Rank.BigJoker + 1).fill(0);
    for (const card of seat.hand) counts[card.rank] += 1;
    return counts;
  }) as [number[], number[], number[]];
}

function winnerFromSide(side: Side): WorldWinner {
  return side === Side.Landlord ? 'landlord' : 'farmer';
}

function sideForSeat(seat: SeatIndex, landlord: SeatIndex): WorldWinner {
  return seat === landlord ? 'landlord' : 'farmer';
}

function oracleKey(state: RoundState): string {
  const top = state.top === null
    ? '-'
    : `${state.top.seat}:${state.top.pattern.category}:${state.top.pattern.mainRank}:${state.top.pattern.length}`;
  return `${countsOf(state).map((row) => row.join(',')).join('|')}|${state.turn}|${state.landlord}|${top}|${state.passesInARow}`;
}

class OmniscientOracle {
  private readonly table = new Map<string, WorldWinner>();
  private readonly results = new Map<string, WorldWinner | null>();

  winner(state: RoundState): WorldWinner | null {
    if (state.phase === GamePhase.Settled && state.winner !== null) return winnerFromSide(state.winner);
    const key = oracleKey(state);
    if (this.results.has(key)) return this.results.get(key)!;
    const verdict = solveWorld({
      counts: countsOf(state),
      turn: state.turn,
      landlord: state.landlord,
      top: state.top?.pattern ?? null,
      topSeat: state.top?.seat ?? null,
      passes: state.passesInARow,
      budget: { nodes: ORACLE_NODE_BUDGET },
      table: this.table,
    });
    this.results.set(key, verdict);
    return verdict;
  }
}

function forcedWinBefore(state: RoundState, seat: SeatIndex): 'win' | 'unknown' | 'n/a' {
  const hand = state.seats[seat]!.hand;
  if (hand.length > 17) return 'n/a';
  const unseenByRank = new Array<number>(Rank.BigJoker + 1).fill(0);
  const opponentCounts: number[] = [];
  for (const player of state.seats) {
    if (player.index === seat) continue;
    opponentCounts.push(player.hand.length);
    for (const card of player.hand) unseenByRank[card.rank] += 1;
  }
  return solveForcedWin({
    hand: hand.slice(),
    unseenByRank,
    minOpponentHandCount: Math.min(...opponentCounts),
    top: state.top?.pattern ?? null,
    nodeBudget: ORACLE_NODE_BUDGET,
  }).result;
}

function diagnosticsAt(entry: MatchLogEntry, eventIndex: number, seat: SeatIndex): AiDecisionDiag | undefined {
  return entry.ai.find((diag) => diag.eventIndex === eventIndex && diag.seat === seat);
}

function eventsEqual(left: GameEvent, right: GameEvent): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function replay(entry: MatchLogEntry, gap: number): ReplayAnalysis {
  const decisions: DecisionReview[] = [];
  const oracle = new OmniscientOracle();
  let state = initialState(entry);
  let initialWinner: WorldWinner | null = null;
  let corrupt: string | null = null;
  let corruptEventIndex: number | null = null;
  let eventIndex = 0;
  let playedCards = 0;
  const initialCards = handTotal(state);

  try {
    validateInitialCards(entry);
    initialWinner = oracle.winner(state);
    while (eventIndex < entry.events.length) {
      const logged = entry.events[eventIndex]!;
      if (logged.type !== 'play' && logged.type !== 'pass') {
        throw new ReplayFailure(eventIndex, `unexpected derived event ${logged.type}; preceding action did not emit it`);
      }

      const action: RoundAction = logged.type === 'play'
        ? { type: 'play', seat: logged.seat, cards: logged.pattern.cards.slice() }
        : { type: 'pass', seat: logged.seat };
      const beforeState = state;
      const beforeWinner = oracle.winner(beforeState);
      const forcedBefore = forcedWinBefore(beforeState, logged.seat);
      const view = { ...snapshot(beforeState, logged.seat), bidMultiplier: entry.bidMultiplier };
      const history = entry.events.slice(0, eventIndex);

      let result: ReturnType<typeof apply>;
      try {
        result = apply(beforeState, action);
      } catch (error) {
        throw new ReplayFailure(eventIndex, `illegal ${logged.type}: ${errorMessage(error)}`);
      }

      for (let emittedIndex = 0; emittedIndex < result.events.length; emittedIndex += 1) {
        const expected = entry.events[eventIndex + emittedIndex];
        if (expected === undefined) {
          throw new ReplayFailure(eventIndex, `missing emitted event ${result.events[emittedIndex]!.type}`);
        }
        if (!eventsEqual(result.events[emittedIndex]!, expected)) {
          throw new ReplayFailure(
            eventIndex + emittedIndex,
            `event mismatch: expected ${JSON.stringify(result.events[emittedIndex])}, got ${JSON.stringify(expected)}`,
          );
        }
      }

      playedCards += action.type === 'play' ? action.cards.length : 0;
      if (handTotal(result.state) + playedCards !== initialCards) {
        throw new ReplayFailure(eventIndex, 'card conservation failed after action');
      }
      const afterWinner = oracle.winner(result.state);
      const actingSide = sideForSeat(logged.seat, entry.landlord);
      const diag = diagnosticsAt(entry, eventIndex, logged.seat);
      const voteGap = diag?.voteGap ?? null;
      decisions.push({
        eventIndex,
        seat: logged.seat,
        action,
        path: diag?.path ?? '—',
        voteGap,
        beforeWinner,
        afterWinner,
        forcedBefore,
        blunder: beforeWinner === actingSide && afterWinner !== null && afterWinner !== actingSide,
        lowVoteGap: voteGap !== null && voteGap <= gap,
        snapshot: view,
        history,
      });

      state = result.state;
      eventIndex += result.events.length;
    }

    if (entry.settlement !== null && state.phase !== GamePhase.Settled) {
      throw new ReplayFailure(entry.events.length, 'settlement exists but replay did not settle');
    }
  } catch (error) {
    const failure = error instanceof ReplayFailure
      ? error
      : new ReplayFailure(eventIndex, errorMessage(error));
    corrupt = failure.message;
    corruptEventIndex = failure.eventIndex;
  }

  const actualHeroScore = entry.settlement?.scores[entry.heroSeat] ?? null;
  const omniscientHeroScore = expectedHeroScore(entry, initialWinner);
  return {
    entry,
    corrupt,
    corruptEventIndex,
    initialWinner,
    decisions,
    actualHeroScore,
    omniscientHeroScore,
  };
}

function expectedHeroScore(entry: MatchLogEntry, winner: WorldWinner | null): number | null {
  if (winner === null || entry.settlement === null) return null;
  const heroSide = sideForSeat(entry.heroSeat, entry.landlord);
  const unit = entry.settlement.multiplier * (entry.heroSeat === entry.landlord ? 2 : 1);
  return winner === heroSide ? unit : -unit;
}

function rankText(card: Card): string {
  return `${RANK_LABEL[card.rank]}${card.suit}`;
}

function actionText(action: RoundAction): string {
  return action.type === 'pass' ? 'pass' : action.cards.map(rankText).join(' ');
}

function verdictText(winner: WorldWinner | null): string {
  return winner ?? 'unknown';
}

function escapeCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

function renderMarkdown(analysis: ReplayAnalysis, gap: number): string {
  const { entry } = analysis;
  const lines = [
    `# 对局复盘：${entry.logId}`,
    '',
    `- 重放状态：${analysis.corrupt === null ? 'VALID' : 'CORRUPT'}`,
    `- 难度 / 地主 / hero：${entry.difficulty} / ${entry.landlord} / ${entry.heroSeat}`,
    `- 初始全知胜方：${verdictText(analysis.initialWinner)}`,
    `- 低票距阈值：voteGap <= ${gap}`,
  ];

  if (analysis.corrupt !== null) {
    lines.push(
      `- 损坏位置：${analysis.corruptEventIndex === null ? 'initial' : `event ${analysis.corruptEventIndex}`}`,
      `- 损坏原因：${analysis.corrupt}`,
    );
  }

  const scoreDelta = analysis.actualHeroScore === null || analysis.omniscientHeroScore === null
    ? 'unknown'
    : String(analysis.omniscientHeroScore - analysis.actualHeroScore);
  lines.push(
    '',
    '## 亏分对照',
    '',
    `- hero 实际结算分：${analysis.actualHeroScore ?? 'unknown'}`,
    `- 按实际终局 multiplier 折算的全知可得分：${analysis.omniscientHeroScore ?? 'unknown'}`,
    `- 可归因差额：${scoreDelta}`,
    '',
    '## 决策点',
    '',
    '| event | seat | path | action | voteGap | 全知 before -> after | forcedWin | 标记 |',
    '| ---: | ---: | --- | --- | ---: | --- | --- | --- |',
  );

  for (const review of analysis.decisions) {
    const marks = [review.blunder ? 'BLUNDER' : '', review.lowVoteGap ? 'REVIEW_LOW_GAP' : '']
      .filter(Boolean)
      .join(', ') || '—';
    lines.push(
      `| ${review.eventIndex} | ${review.seat} | ${escapeCell(review.path)} | ${escapeCell(actionText(review.action))} | ${review.voteGap ?? '—'} | ${verdictText(review.beforeWinner)} -> ${verdictText(review.afterWinner)} | ${review.forcedBefore} | ${marks} |`,
    );
  }
  if (analysis.decisions.length === 0) lines.push('| — | — | — | — | — | — | — | — |');

  lines.push(
    '',
    '> 全知裁定使用三家真实手牌和 2,000,000 node 预算；预算内未解出记为 unknown，不判 blunder。forcedWin 仅作 <=17 张时的交叉核对。',
    '',
  );
  return lines.join('\n');
}

function fixtureFor(analysis: ReplayAnalysis, review: DecisionReview): BadcaseFixture {
  return {
    logId: analysis.entry.logId,
    eventIndex: review.eventIndex,
    note: `全知求解：行动前 ${verdictText(review.beforeWinner)} 可胜，行动后转为 ${verdictText(review.afterWinner)}`,
    snapshot: review.snapshot,
    history: review.history.slice(),
    bannedCards: review.action.type === 'play' ? review.action.cards.slice() : [],
  };
}

function fixturesOf(analysis: ReplayAnalysis): BadcaseFixture[] {
  return analysis.decisions.filter((review) => review.blunder).map((review) => fixtureFor(analysis, review));
}

function safeName(value: string): string {
  const normalized = value.replace(/[^a-zA-Z0-9._-]+/g, '_');
  return normalized.length > 0 ? normalized : 'match-log';
}

function writeFixtures(analysis: ReplayAnalysis): string[] {
  const fixtures = fixturesOf(analysis);
  if (fixtures.length === 0) return [];
  mkdirSync(FIXTURE_DIR, { recursive: true });
  return fixtures.map((fixture) => {
    const path = join(FIXTURE_DIR, `${safeName(fixture.logId)}-${fixture.eventIndex}.json`);
    writeFileSync(path, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
    return path;
  });
}

function writeReport(path: string, markdown: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, markdown, 'utf8');
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function single(rank: Rank, suit: Card['suit']): Card {
  return { rank, suit };
}

function makeSelftestEntry(): MatchLogEntry {
  const hands: [Card[], Card[], Card[]] = [
    [single(Rank.R3, Suit.Spade), single(Rank.A, Suit.Heart)],
    [single(Rank.K, Suit.Club)],
    [single(Rank.R4, Suit.Diamond)],
  ];
  let state: RoundState = {
    phase: GamePhase.Playing,
    landlord: 0,
    seats: hands.map((hand, index) => ({ index: index as SeatIndex, hand: hand.slice() })),
    turn: 0,
    top: null,
    passesInARow: 0,
    winner: null,
    bombsPlayed: 0,
    bottom: [],
  };
  const first = hands[0][0]!;
  const firstResult = apply(state, { type: 'play', seat: 0, cards: [first] });
  state = firstResult.state;
  const secondResult = apply(state, { type: 'play', seat: 1, cards: [hands[1][0]!] });
  const events = [...firstResult.events, ...secondResult.events];
  return {
    version: MATCH_LOG_VERSION,
    logId: 'selftest-known-blunder',
    startedAt: 1,
    finishedAt: 2,
    seed: 1,
    resumed: false,
    difficulty: 'hard',
    heroSeat: 0,
    landlord: 0,
    bidMultiplier: 1,
    initialHands: hands,
    bottom: [],
    events,
    settlement: { multiplier: 1, spring: 'none', bombs: 0, scores: [-2, 1, 1] },
    pinned: false,
    ai: [{ seat: 0, eventIndex: 0, path: 'selftest-bad-lead', voteGap: 1 }],
  };
}

function runSelftest(): void {
  const raw = JSON.parse(JSON.stringify(makeSelftestEntry())) as unknown;
  const entry = decodeCandidate(raw, 'selftest');
  const analysis = replay(entry, DEFAULT_GAP);
  const blunders = analysis.decisions.filter((review) => review.blunder);
  const markdown = renderMarkdown(analysis, DEFAULT_GAP);
  const fixtures = fixturesOf(analysis);
  if (analysis.corrupt !== null) throw new Error(`selftest replay corrupt: ${analysis.corrupt}`);
  if (blunders.length !== 1 || blunders[0]!.eventIndex !== 0) {
    throw new Error(`selftest expected event 0 blunder, got ${blunders.map((item) => item.eventIndex).join(',')}`);
  }
  if (!markdown.includes('BLUNDER') || fixtures.length !== 1 || fixtures[0]!.bannedCards[0]?.rank !== Rank.R3) {
    throw new Error('selftest markdown/fixture pipeline did not preserve the known blunder');
  }
  if (recognize(fixtures[0]!.bannedCards)?.mainRank !== Rank.R3) {
    throw new Error('selftest fixture bannedCards is not a legal single 3');
  }

  const corruptSource = makeSelftestEntry();
  const firstEvent = corruptSource.events[0];
  if (firstEvent?.type !== 'play') throw new Error('selftest setup lost its first play event');
  corruptSource.events[0] = { ...firstEvent, seat: 2 };
  const corruptEntry = decodeCandidate(JSON.parse(JSON.stringify(corruptSource)) as unknown, 'selftest-corrupt');
  const corrupt = replay(corruptEntry, DEFAULT_GAP);
  if (corrupt.corruptEventIndex !== 0 || corrupt.corrupt === null) {
    throw new Error('selftest corrupt replay did not identify event 0');
  }
  console.log('[replay-analyze] selftest PASS: known blunder + low-gap + corrupt event index + fixture payload');
}

function main(): void {
  const options = parseCli(process.argv.slice(2));
  if (options.selftest) {
    runSelftest();
    return;
  }
  if (options.input === null) {
    throw new Error('usage: replay-analyze.ts <JSON|directory> [--out=<md>] [--fixture] [--gap=2] [--selftest]');
  }

  const analyses = loadEntries(options.input).map((entry) => replay(entry, options.gap));
  const explicitOut = options.out === null ? null : resolve(process.cwd(), options.out);
  if (explicitOut !== null) {
    writeReport(explicitOut, analyses.map((analysis) => renderMarkdown(analysis, options.gap)).join('\n---\n\n'));
    console.log(`[replay-analyze] report ${explicitOut}`);
  } else {
    for (const analysis of analyses) {
      const path = join(DEFAULT_REPORT_DIR, `${safeName(analysis.entry.logId)}.md`);
      writeReport(path, renderMarkdown(analysis, options.gap));
      console.log(`[replay-analyze] report ${path}`);
    }
  }

  if (options.fixture) {
    const paths = analyses.flatMap(writeFixtures);
    console.log(`[replay-analyze] fixtures ${paths.length}`);
    for (const path of paths) console.log(`  - ${path}`);
  }
  if (analyses.some((analysis) => analysis.corrupt !== null)) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.error(`[replay-analyze] FAIL: ${errorMessage(error)}`);
  process.exitCode = 1;
}
