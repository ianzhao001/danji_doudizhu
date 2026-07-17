/**
 * W-AI-R2 修订版：PIMC 采样器 + D4 归因钉入接线（规划者修订种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/ai/pimc-sampler.test.ts，独立 seed commit（R2a 棒）。
 *
 * ── 修订依据（缺陷 D4，规划者亲读发现）──
 *   旧接线 `pinnedA: hiddenSeats[0] === landlord ? pinned : null`：当地主是**第二**隐藏席
 *   （如 turn=1、landlord=2 时升序 hiddenSeats=[0,2]）底牌归因被静默丢弃（采样器仅支持 pinnedA）。
 *   修法：新纯函数 `orderHiddenSeats(turn, landlord)`——**地主在隐藏席时恒排 A 席（首位）**，
 *   pimcArbitrate/pimcRank 一律经它取隐藏席序。v1 全部采样契约逐字保留。
 *
 * ── 预期红（对 R2 基线 main）── orderHiddenSeats 未导出 → D4 两用例红；接线负向锚红；其余绿。
 * ── 负向变异自证（执行者实现后自查）──
 *   ① orderHiddenSeats 改回升序 → 「地主恒 A 席」用例红。
 *   ② pimc 接线绕过 orderHiddenSeats 手写席序 → 接线锚红。
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Rank, createRng, recognize } from '../../assets/scripts/rules';
import { GamePhase, type GameEvent, type GameSnapshot } from '../../assets/scripts/game';
import { deriveWorldSeed, orderHiddenSeats, sampleHiddenSplit } from '../../assets/scripts/ai/pimc';
import { toRankCounts } from '../../assets/scripts/ai/rollout';
import { cards } from '../rules/_util';

const COUNTS_LEN = Rank.BigJoker + 1;

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 1,
    landlord: 0,
    top: { seat: 0, pattern: recognize(cards('6'))! },
    handCounts: [1, 3, 3],
    winner: null,
    viewerHand: cards('A 7 7'),
    ...over,
  };
}

function playEvents(specs: Array<[0 | 1 | 2, string]>): GameEvent[] {
  return specs.map(([seat, spec]) => ({ type: 'play' as const, seat, pattern: recognize(cards(spec))! }));
}

const HISTORY = playEvents([[0, '3 3 3 3'], [1, '4 4 4 4'], [2, '5 5 5 5'], [0, '6 6 6'], [0, '6']]);

describe('W-AI-R2 PIMC 采样器（含 D4 归因钉入接线）', () => {
  it('deriveWorldSeed：uint32、同输入恒等、viewerHand 乱序不变', () => {
    const s = snap({});
    const seed = deriveWorldSeed(s, HISTORY);
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(2 ** 32);
    expect(deriveWorldSeed(s, HISTORY)).toBe(seed);
    const shuffled = snap({ viewerHand: cards('A 7 7').reverse() });
    expect(deriveWorldSeed(shuffled, HISTORY), '牌序是表现细节，不得影响世界种子').toBe(seed);
  });

  it('deriveWorldSeed 敏感性：历史多一手 / turn 改变 → 种子变化', () => {
    const s = snap({});
    const seed = deriveWorldSeed(s, HISTORY);
    const longer = [...HISTORY, ...playEvents([[1, '7']])];
    expect(deriveWorldSeed(s, longer)).not.toBe(seed);
    expect(deriveWorldSeed(snap({ turn: 2 }), HISTORY)).not.toBe(seed);
  });

  it('D4·orderHiddenSeats 契约：恒返回两隐藏席；地主在隐藏席时恒排 A 席（首位）', () => {
    for (const turn of [0, 1, 2] as const) {
      for (const landlord of [0, 1, 2] as const) {
        const ordered = orderHiddenSeats(turn, landlord);
        expect(ordered).toHaveLength(2);
        expect(ordered).not.toContain(turn);
        expect(new Set(ordered).size).toBe(2);
        if (landlord !== turn) {
          expect(ordered[0], `turn=${turn} landlord=${landlord}：地主必须是 A 席`).toBe(landlord);
        }
      }
    }
  });

  it('D4·接线锚：pimc 隐藏席序一律经 orderHiddenSeats，旧升序旁路不得残留', () => {
    const source = readFileSync(new URL('../../assets/scripts/ai/pimc.ts', import.meta.url), 'utf8');
    expect(source).toContain('orderHiddenSeats(');
    expect(source, '旧「地主恰为第一隐藏席才钉入」旁路必须废除')
      .not.toContain('hiddenSeats[0] === args.snapshot.landlord ? pinned : null');
    expect(source, '隐藏席不得再按升序 filter 直取')
      .not.toContain('([0, 1, 2] as SeatIndex[]).filter((seat) => seat !== args.snapshot.turn)');
  });

  it('sampleHiddenSplit 守恒：逐点相加还原 unseen，席位张数精确', () => {
    const unseen = toRankCounts(cards('8 9 10 J K K'));
    const { a, b } = sampleHiddenSplit({ unseen, pinnedA: null, needA: 4, needB: 2, rng: createRng(7) });
    expect(a).toHaveLength(COUNTS_LEN);
    expect(b).toHaveLength(COUNTS_LEN);
    let sumA = 0;
    let sumB = 0;
    for (let rank = 0; rank < COUNTS_LEN; rank += 1) {
      expect(a[rank]).toBeGreaterThanOrEqual(0);
      expect(b[rank]).toBeGreaterThanOrEqual(0);
      expect(a[rank] + b[rank], `rank ${rank} 守恒`).toBe(unseen[rank] ?? 0);
      sumA += a[rank];
      sumB += b[rank];
    }
    expect(sumA).toBe(4);
    expect(sumB).toBe(2);
  });

  it('pinnedA 钉入：底牌归因的张数必须全部落 A 席（地主）', () => {
    const unseen = toRankCounts(cards('8 9 K K 2'));
    const pinnedA = toRankCounts(cards('K K'));
    for (const seed of [1, 2, 3, 4, 5]) {
      const { a } = sampleHiddenSplit({ unseen, pinnedA, needA: 3, needB: 2, rng: createRng(seed) });
      expect(a[Rank.K], `seed ${seed}：两张 K 必须钉在 A 席`).toBe(2);
    }
  });

  it('确定性与不可变：同 rng 深相等；unseen/pinnedA 入参不被修改', () => {
    const unseen = toRankCounts(cards('8 9 10 J K K 2'));
    const pinnedA = toRankCounts(cards('2'));
    const unseenBefore = unseen.join(',');
    const pinnedBefore = pinnedA.join(',');
    const first = sampleHiddenSplit({ unseen, pinnedA, needA: 4, needB: 3, rng: createRng(11) });
    const second = sampleHiddenSplit({ unseen, pinnedA, needA: 4, needB: 3, rng: createRng(11) });
    expect(second).toEqual(first);
    expect(unseen.join(',')).toBe(unseenBefore);
    expect(pinnedA.join(',')).toBe(pinnedBefore);
  });

  it('不同 rng 种子允许产生不同划分（采样真的在随机化，非常量划分）', () => {
    const unseen = toRankCounts(cards('8 9 10 J Q K A 2'));
    const splits = new Set<string>();
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const { a } = sampleHiddenSplit({ unseen, pinnedA: null, needA: 4, needB: 4, rng: createRng(seed) });
      splits.add(a.join(','));
    }
    expect(splits.size, '8 个种子至少产生 2 种不同划分').toBeGreaterThanOrEqual(2);
  });
});
