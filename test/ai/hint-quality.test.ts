/**
 * W-AI-R2 种子：提示质量榜单契约（规划者预写红种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制到 test/ai/hint-quality.test.ts（新建），独立 seed commit（R2a 棒）。
 *
 * ── 契约（固定局面上的玩家可感质量）──
 *   ① 玩家场景 B 首按 = 顺子 34567（不再推荐把 2 当翼甩出的飞机——打回证据①在提示面的镜像）；
 *   ② 单张可压时榜单首项非炸弹（与 advisor 质量钉同源，经 ranked 面再钉一次）；
 *   ③ 榜单不含「支配劣汰翼」：同链同型的翼变体在榜单中至多一个（去同型冗余——
 *      玩家连按不应看到「同一个飞机换个翼」刷屏）；
 *   ④ 榜单项全部合法且互不重复（与会话契约互为犄角）。
 *
 * ── 预期红（对 R2 基线 main）── rankHintCandidates 未落 → 全文件红。
 * ── 负向变异自证（执行者实现后自查）──
 *   ① 榜单生成去掉同型去冗 → ⑤「去冗判别」红。
 *     （v2 修订·R2a 阻断⑤：原③夹具在场景 B 手上哑火——13 张手候选量大，翼变体按新 score
 *      排位进不了 pool.slice(0,5) 截断窗，去冗有无均不可观察。v2 新增⑤用例：9 张变体淹没
 *      构造 + 双前提自检（变体 ≥3；优于次优变体的非变体候选 ≤3 ⇒ 撤除去冗时窗内必现
 *      ≥2 同链变体，数学必红）。③保留为被动回归钉，不再承诺变异红。）
 *   ② 榜单改回 hintSuggestions 原始序 → ①+⑤ 红。
 *     （v3 修订·R2a 阻断⑥：原承诺「①/②红」中②系过度承诺——hintSuggestions 旧序在
 *      ②夹具(33334+A 压 K)上本就非炸弹开头，②对该变异无判别力；实测红位=①(首项
 *      委托/质量)+⑤(原始序前六缺飞机清手线——参与性断言双向履职：既抓去冗删除又抓
 *      排序退化)。②降为被动回归钉（防「炸弹上首」的排序回归），断言不动。）
 */
import { describe, expect, it } from 'vitest';
import { rankHintCandidates } from '../../assets/scripts/ai';
import { Decomposer } from '../../assets/scripts/ai/decompose';
import { moveOutcomeScore } from '../../assets/scripts/ai/handWeight';
import { GamePhase, type GameSnapshot, type SeatIndex, type TopPlay } from '../../assets/scripts/game';
import { Category, enumerateMoves, recognize, validatePlay, type Card, type Move } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const keysOf = (list: Card[]): string => list.map((c) => `${c.rank}:${c.suit}`).sort().join(',');

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [13, 17, 17],
    winner: null,
    viewerHand: cards('3 4 5 6 7 10 8 8 8 9 9 9 2'),
    ...over,
  };
}

function topPlay(seat: SeatIndex, spec: string): TopPlay {
  return { seat, pattern: recognize(cards(spec))! };
}

describe('W-AI-R2 提示质量榜单', () => {
  it('玩家场景 B：首按推荐 = 顺子 34567，绝不推荐飞机带 2（打回证据①提示面镜像）', () => {
    const ranked = rankHintCandidates({ snapshot: snap({}), history: [] });
    expect(ranked.kind).toBe('ranked');
    if (ranked.kind !== 'ranked') return;
    const first = ranked.hints[0].move;
    const pattern = recognize(first.cards)!;
    expect(pattern.category, '首按应为顺子').toBe(Category.Straight);
    expect(first.cards).toHaveLength(5);
    expect(pattern.mainRank).toBe(7);
    for (const hint of ranked.hints) {
      const p = recognize(hint.move.cards)!;
      if (p.category === Category.AirplaneSingles) {
        expect(hint.move.cards.some((c) => c.rank === 15), '榜单内飞机变体不得带 2 作翼').toBe(false);
      }
    }
  });

  it('单张可压时榜单首项非炸弹（ranked 面质量钉）', () => {
    const s = snap({ top: topPlay(1, 'K'), viewerHand: cards('3 3 3 3 A'), handCounts: [5, 8, 8] });
    const ranked = rankHintCandidates({ snapshot: s, history: [] });
    expect(ranked.kind).toBe('ranked');
    if (ranked.kind !== 'ranked') return;
    expect(recognize(ranked.hints[0].move.cards)!.category).toBe(Category.Single);
  });

  it('榜单同型去冗：同链飞机的翼变体至多一个上榜（连按不刷屏）', () => {
    // （阻断⑤裁决：本用例为被动回归钉——场景 B 窗口不含变体；判别齿在⑤「去冗判别」。）
    const ranked = rankHintCandidates({ snapshot: snap({}), history: [] });
    expect(ranked.kind).toBe('ranked');
    if (ranked.kind !== 'ranked') return;
    const airplaneChains = ranked.hints
      .map((h) => recognize(h.move.cards)!)
      .filter((p) => p.category === Category.Airplane || p.category === Category.AirplaneSingles || p.category === Category.AirplanePairs)
      .map((p) => `${p.category}:${p.mainRank}:${p.length}`);
    expect(new Set(airplaneChains).size, '同链同型飞机在榜单至多一个翼变体').toBe(airplaneChains.length);
  });

  it('去冗判别（阻断⑤修订）：变体淹没窗口下同链翼变体至多一个、且清手线必上榜', () => {
    const hand = cards('8 8 8 9 9 9 3 4 5');
    const d = new Decomposer();
    const all = enumerateMoves(hand);
    const isVariant = (move: Move): boolean =>
      move.pattern.category === Category.AirplaneSingles && move.pattern.mainRank === 9;
    const variants = all.filter(isVariant);
    // 夹具前提自检（阻断③⑤纪律：机制必须真实进入可观察窗口，防再造无判别力夹具）：
    //   ①翼变体 ≥3（手牌性质，与实现无关）；②优于「次优变体」(含并列)的非变体候选 ≤3
    //   ⇒ 撤除去冗时 pool.slice(0,5) 截断窗内必现 ≥2 同链变体（advised 剔除后仍成立），数学必红。
    expect(variants.length, '前提：翼变体不少于 3').toBeGreaterThanOrEqual(3);
    const score = (move: Move): number => moveOutcomeScore(d, hand, move);
    const secondBestVariant = variants.map(score).sort((a, b) => a - b)[1];
    const strongerOthers = all.filter((move) => !isVariant(move) && score(move) <= secondBestVariant);
    expect(strongerOthers.length, '前提：优于次优变体的非变体候选不得超过 3').toBeLessThanOrEqual(3);
    const ranked = rankHintCandidates({ snapshot: snap({ viewerHand: hand, handCounts: [9, 17, 17] }), history: [] });
    expect(ranked.kind).toBe('ranked');
    if (ranked.kind !== 'ranked') return;
    const chains = ranked.hints
      .map((h) => recognize(h.move.cards)!)
      .filter((p) => p.category === Category.AirplaneSingles)
      .map((p) => `${p.category}:${p.mainRank}:${p.length}`);
    expect(chains.length, '清手线变体必须进入可观察榜单（机制参与性）').toBeGreaterThanOrEqual(1);
    expect(new Set(chains).size, '同链同型翼变体至多一个').toBe(chains.length);
  });

  it('榜单全法且互异（与会话契约互为犄角）', () => {
    for (const fixture of [snap({}), snap({ top: topPlay(1, '4 4'), viewerHand: cards('5 5 7 9 J J A'), handCounts: [7, 9, 9] })]) {
      const ranked = rankHintCandidates({ snapshot: fixture, history: [] });
      expect(ranked.kind).toBe('ranked');
      if (ranked.kind !== 'ranked') continue;
      const legal = new Set(
        (fixture.top
          ? enumerateMoves(fixture.viewerHand!).filter((m) => validatePlay(m.cards, fixture.top!.pattern).ok)
          : enumerateMoves(fixture.viewerHand!)
        ).map((m) => keysOf(m.cards)),
      );
      const seen = new Set<string>();
      for (const hint of ranked.hints) {
        const key = keysOf(hint.move.cards);
        expect(legal.has(key), '榜单项必须合法').toBe(true);
        expect(seen.has(key), '榜单项必须互异').toBe(false);
        seen.add(key);
      }
    }
  });
});
