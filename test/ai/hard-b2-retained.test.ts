/**
 * W-AI-R3 Sota2 B2 保留集种子：I（序列不可压中继）与 follow 三代表。
 *
 * 负向变异自证（每项临时变异后本文件必须转红）：
 *   ① isUnbeatableMove 删除 Straight / ConsecutivePairs / Airplane 任一分支
 *      → 对应的固定记牌收官夹具改出更长低核，行为断言红。
 *   ② 删除 AirplaneSingles / AirplanePairs 中任一翼型映射，或把 sequence 判定移到 size===0 之后
 *      → 五族源码接线锚红。
 *   ③ follow 代表删除 grayScored 或 lowControlCheap，恢复 250 带，去掉去重/上限或 mustInclude
 *      → 候选捕获与 hard-pipeline 三代表锚红。
 */
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GamePhase, type GameEvent, type GameSnapshot } from '../../assets/scripts/game';
import type { PimcRankArgs } from '../../assets/scripts/ai/pimc';
import type { Move } from '../../assets/scripts/rules';
import { Category, Rank, createRng, recognize } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const pimcCapture = vi.hoisted(() => ({ calls: [] as PimcRankArgs[] }));

vi.mock('../../assets/scripts/ai/pimc', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../assets/scripts/ai/pimc')>();
  return {
    ...actual,
    pimcArbitrate: (args: PimcRankArgs): Move | null => {
      pimcCapture.calls.push(args);
      return args.mustInclude ?? args.candidates[0] ?? null;
    },
  };
});

import { hardStrategyWithProfile } from '../../assets/scripts/ai/levels/hard';

const HARD_SOURCE = readFileSync(
  new URL('../../assets/scripts/ai/levels/hard.ts', import.meta.url),
  'utf8',
);
const weightsOnly = hardStrategyWithProfile({ samples: 0, maxCandidates: 8 });

function snapshot(overrides: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [17, 19, 18],
    winner: null,
    viewerHand: cards('3'),
    ...overrides,
  };
}

function publicRankHistory(): GameEvent[] {
  const events: GameEvent[] = '3 4 5 6 7 8 9 10 J Q K A 2 x'.split(' ').map((token, index) => ({
    type: 'play' as const,
    seat: (index % 2 === 0 ? 1 : 2) as 1 | 2,
    pattern: recognize(cards(token))!,
  }));
  events.push({ type: 'reset', leader: 0 });
  return events;
}

function expectPlayRanks(action: ReturnType<ReturnType<typeof hardStrategyWithProfile>>, expected: readonly Rank[]): void {
  expect(action.type).toBe('play');
  if (action.type !== 'play') return;
  expect(action.cards.map((card) => card.rank).sort((left, right) => left - right)).toEqual(expected);
}

function sliceBetween(source: string, startAnchor: string, endAnchor: string): string {
  const start = source.indexOf(startAnchor);
  const end = source.indexOf(endAnchor, start);
  expect(start, `missing slice start ${startAnchor}`).toBeGreaterThanOrEqual(0);
  expect(end, `missing slice end ${endAnchor}`).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('W-AI-R3 B2 I 保留集', () => {
  beforeEach(() => {
    pimcCapture.calls.length = 0;
  });

  it('I-Straight：固定记牌下先出 4-A 不可压中继，留单3清手', () => {
    const action = weightsOnly(snapshot({
      viewerHand: cards('3 3 4 5 6 7 8 9 10 J Q K A'),
      handCounts: [13, 21, 20],
    }), createRng(2), publicRankHistory());
    expectPlayRanks(action, [
      Rank.R4, Rank.R5, Rank.R6, Rank.R7, Rank.R8, Rank.R9,
      Rank.R10, Rank.J, Rank.Q, Rank.K, Rank.A,
    ]);
  });

  it('I-ConsecutivePairs：先出 QQ-KK-AA 不可压中继，留 JJJ 清手', () => {
    const action = weightsOnly(snapshot({
      viewerHand: cards('J J J Q Q K K A A'),
      handCounts: [9, 23, 22],
    }), createRng(3), publicRankHistory());
    expectPlayRanks(action, [Rank.Q, Rank.Q, Rank.K, Rank.K, Rank.A, Rank.A]);
  });

  it('I-Airplane：先出 JJJ-QQQ 不可压中继，保留后续整手', () => {
    const action = weightsOnly(snapshot({
      viewerHand: cards('3 J J J Q Q Q K K K A A A'),
      handCounts: [13, 21, 20],
    }), createRng(4), publicRankHistory());
    expectPlayRanks(action, [Rank.J, Rank.J, Rank.J, Rank.Q, Rank.Q, Rank.Q]);
  });

  it('I 五族接线：带翼飞机与裸序列共用高核威胁判定', () => {
    const unbeatable = sliceBetween(HARD_SOURCE, 'function isUnbeatableMove', 'function guaranteeKey');
    for (const category of [
      'Category.Straight',
      'Category.ConsecutivePairs',
      'Category.Airplane',
      'Category.AirplaneSingles',
      'Category.AirplanePairs',
    ]) expect(unbeatable).toContain(category);
    expect(unbeatable).toMatch(
      /category === Category\.AirplaneSingles\s*\? \{ groupSize: 3, ranks: move\.pattern\.length \/ 4 \}/,
    );
    expect(unbeatable).toMatch(
      /category === Category\.AirplanePairs\s*\? \{ groupSize: 3, ranks: move\.pattern\.length \/ 5 \}/,
    );
    expect(unbeatable.indexOf('if (sequence')).toBeLessThan(unbeatable.indexOf('size === 0) return false'));
  });
});

describe('W-AI-R3 B2 follow 有界代表', () => {
  beforeEach(() => {
    pimcCapture.calls.length = 0;
  });

  it('可采样紧急跟牌优先保留最低结构代价 2 对，pass 独立入仲裁', () => {
    const hard = hardStrategyWithProfile({ samples: 2, maxCandidates: 8 });
    hard(snapshot({
      turn: 2,
      landlord: 1,
      top: { seat: 1, pattern: recognize(cards('7 7'))! },
      // 合成快照只用于捕获候选：hidden=37 守恒，地主 8 张触发结构代价优先 fallback。
      handCounts: [29, 8, 17],
      viewerHand: cards('3 3 4 4 7 8 9 10 Q Q Q K K K 2 2 2'),
    }), createRng(5), []);

    expect(pimcCapture.calls).toHaveLength(1);
    const call = pimcCapture.calls[0]!;
    expect(call.includePass).toBe(true);
    expect(call.candidates.length).toBeLessThanOrEqual(3);
    expect(new Set(call.candidates.map((move) => move.cards.map((card) => `${card.rank}:${card.suit}`).sort().join('|'))).size)
      .toBe(call.candidates.length);
    expect(call.candidates.map((move) => [move.pattern.category, move.pattern.mainRank])).toEqual([
      [Category.Pair, Rank.R2],
    ]);
    expect(call.mustInclude?.pattern.category).toBe(Category.Pair);
    expect(call.mustInclude?.pattern.mainRank).toBe(Rank.R2);
  });
});
