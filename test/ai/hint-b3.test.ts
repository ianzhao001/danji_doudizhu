/**
 * W-AI-R3 Sota2 B3 种子：单次 Hard 权威分析 + 全翼型榜单过滤。
 *
 * 负向变异自证（每项临时变异后本文件必须转红）：
 *   ① rankHintCandidates 绕过/忽略 capturePimcRanks，恢复第二次 adviseBestMove，
 *      或恢复 advised 后再直调 pimcRank → 单次分析源码锚或捕获排名复用种子红；
 *      pimcRank 不再发布已排序结果 → scoped capture 行为种子红。
 *   ② 删除 TripsSingle / TripsPair / AirplaneSingles / AirplanePairs /
 *      FourPlusTwoSingles / FourPlusTwoPairs 任一翼型分支 → 对应非 advised 夹具红。
 *   ③ 禁翼阈值由 >= R2 改为 > R2 或 > SmallJoker → 2 / 小王夹具红；大王亦在矩阵覆盖。
 *   ④ 删除 cardsKey(move.cards) === advisedKey 豁免 → 六类禁翼清手首选夹具红。
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { adviseBestMove, rankHintCandidates } from '../../assets/scripts/ai/hint';
import { capturePimcRanks } from '../../assets/scripts/ai/pimc';
import { GamePhase, createPlayingRound, snapshot as roundSnapshot, type GameSnapshot, type SeatIndex, type TopPlay } from '../../assets/scripts/game';
import { Category, Rank, createRng, deal, enumerateMoves, recognize, type Card, type Move } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const HINT_SOURCE = readFileSync(
  new URL('../../assets/scripts/ai/hint.ts', import.meta.url),
  'utf8',
);

function key(list: readonly Card[]): string {
  return list.map((card) => `${card.rank}:${card.suit}`).sort().join('|');
}

function snap(overrides: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [7, 17, 17],
    winner: null,
    viewerHand: cards('3 4 5 6 7 8 9'),
    ...overrides,
  };
}

function topPlay(seat: SeatIndex, spec: string): TopPlay {
  return { seat, pattern: recognize(cards(spec))! };
}

function wingCards(move: Move): Card[] {
  if (move.pattern.category !== Category.TripsSingle
    && move.pattern.category !== Category.TripsPair
    && move.pattern.category !== Category.AirplaneSingles
    && move.pattern.category !== Category.AirplanePairs
    && move.pattern.category !== Category.FourPlusTwoSingles
    && move.pattern.category !== Category.FourPlusTwoPairs) return [];
  const coreCount = move.pattern.category === Category.FourPlusTwoSingles
    || move.pattern.category === Category.FourPlusTwoPairs
    ? 4
    : 3;
  const counts = new Map<Rank, number>();
  for (const card of move.cards) counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
  return move.cards.filter((card) => (counts.get(card.rank) ?? 0) < coreCount);
}

function hasForbiddenWing(move: Move): boolean {
  return wingCards(move).some((card) => card.rank >= Rank.R2);
}

describe('W-AI-R3 B3 单次 Hard 权威分析', () => {
  it('scoped capture 取得 Hard@HINT 已完成的唯一 PIMC 排名，榜首即 adviseBestMove', () => {
    const state = createPlayingRound(deal(createRng(5)), 0);
    const fixture = roundSnapshot(state, 0);
    const analysis = capturePimcRanks(() => adviseBestMove({ snapshot: fixture, history: [] }));
    expect(analysis.value).not.toBeNull();
    expect(analysis.rankings).toHaveLength(1);
    expect(analysis.rankings[0]![0]!.move).not.toBeNull();
    expect(key(analysis.rankings[0]![0]!.move!.cards)).toBe(key(analysis.value!.cards));

    const ranked = rankHintCandidates({ snapshot: fixture, history: [] });
    expect(ranked.kind).toBe('ranked');
    if (ranked.kind !== 'ranked') return;
    const capturedPrefix = analysis.rankings[0]!
      .filter((option): option is { move: Move; score: number } => option.move !== null)
      .slice(0, 6)
      .map((option) => ({ cards: key(option.move.cards), score: option.score }));
    expect(ranked.hints.map((hint) => ({ cards: key(hint.move.cards), score: hint.score })))
      .toEqual(capturedPrefix);
  });

  it('rankHintCandidates 只捕获一次 adviseBestMove，不再直调 pimcRank 或事后强制置顶', () => {
    const ranker = HINT_SOURCE.slice(HINT_SOURCE.indexOf('export function rankHintCandidates'));
    expect(ranker).toContain('capturePimcRanks(() => adviseBestMove(');
    expect(ranker.match(/capturePimcRanks\(/g)).toHaveLength(1);
    expect(ranker.match(/adviseBestMove\(/g)).toHaveLength(1);
    expect(ranker).not.toContain('pimcRank(');
    expect(ranker).not.toContain('pool.unshift');
    expect(ranker).not.toContain('byKey');
  });
});

const filteredFixtures: readonly [string, Category, string][] = [
  ['三带一', Category.TripsSingle, '3 3 3 4 x'],
  ['三带二', Category.TripsPair, '3 3 3 4 4 2 2'],
  ['飞机带单', Category.AirplaneSingles, '3 3 3 4 4 4 5 x X'],
  ['飞机带对', Category.AirplanePairs, '3 3 3 4 4 4 5 5 2 2 7'],
  ['四带两单', Category.FourPlusTwoSingles, '3 3 3 3 4 5 X'],
  ['四带两对', Category.FourPlusTwoPairs, '3 3 3 3 4 4 5 5 2 2'],
];

describe('W-AI-R3 B3 全翼型禁用 2/王', () => {
  for (const [name, category, spec] of filteredFixtures) {
    it(`${name}：非 advised 的高翼候选不得进入榜单`, () => {
      const hand = cards(spec);
      const forbidden = enumerateMoves(hand).filter((move) => (
        move.pattern.category === category && hasForbiddenWing(move)
      ));
      expect(forbidden.length, '前提：合法枚举中必须真实存在高翼候选').toBeGreaterThan(0);
      const fixture = snap({ viewerHand: hand, handCounts: [hand.length, 17, 17] });
      const advised = adviseBestMove({ snapshot: fixture, history: [] });
      expect(advised).not.toBeNull();
      expect(hasForbiddenWing(advised!), '前提：高翼候选不是 Hard 首选').toBe(false);
      const ranked = rankHintCandidates({ snapshot: fixture, history: [] });
      expect(ranked.kind).toBe('ranked');
      if (ranked.kind !== 'ranked') return;
      expect(ranked.hints.some((hint) => hasForbiddenWing(hint.move))).toBe(false);
    });
  }
});

const advisedFixtures: readonly [string, Category, string, string][] = [
  ['三带一', Category.TripsSingle, '4 4 4 x', '3 3 3 4'],
  ['三带二', Category.TripsPair, '4 4 4 2 2', '3 3 3 4 4'],
  ['飞机带单', Category.AirplaneSingles, '4 4 4 5 5 5 6 x', '3 3 3 4 4 4 5 6'],
  ['飞机带对', Category.AirplanePairs, '4 4 4 5 5 5 6 6 2 2', '3 3 3 4 4 4 5 5 6 6'],
  ['四带两单', Category.FourPlusTwoSingles, '4 4 4 4 5 x', '3 3 3 3 4 5'],
  ['四带两对', Category.FourPlusTwoPairs, '4 4 4 4 5 5 2 2', '3 3 3 3 4 4 5 5'],
];

describe('W-AI-R3 B3 禁翼首选豁免', () => {
  for (const [name, category, handSpec, topSpec] of advisedFixtures) {
    it(`${name}：禁翼若为 Hard 清手首选仍须保留为榜首`, () => {
      const hand = cards(handSpec);
      const fixture = snap({
        viewerHand: hand,
        handCounts: [hand.length, 10, 10],
        top: topPlay(1, topSpec),
      });
      const advised = adviseBestMove({ snapshot: fixture, history: [] });
      expect(advised).not.toBeNull();
      expect(advised!.pattern.category).toBe(category);
      expect(hasForbiddenWing(advised!), '前提：Hard 首选确实使用禁翼').toBe(true);
      const ranked = rankHintCandidates({ snapshot: fixture, history: [] });
      expect(ranked.kind).toBe('ranked');
      if (ranked.kind !== 'ranked') return;
      expect(ranked.hints.length).toBeGreaterThan(0);
      expect(key(ranked.hints[0]!.move.cards)).toBe(key(advised!.cards));
    });
  }
});
