/**
 * W-AI-R2 种子：消融纯度契约（规划者预写红种子 · 2026-07-17 · sota2 · 缺陷 D3）。
 *
 * 落位：Codex 逐字节复制到 test/ai/ablation-purity.test.ts（新建），独立 seed commit（R2a 棒）。
 *
 * ── 契约（weights-only 语义重定义 =「同打分、仅跳过 pimc 仲裁」）──
 *   ① 未触达仲裁的路径上（白跟/清手/必胜看破/压制期），weights-only 与 full **逐字段同判**；
 *   ② 仲裁可达性：存在固定局面使 full 与 weights-only 分叉（证明采样路径真实存活，
 *      而非两档恒等的摆设——用 S4 竞速夹具：full 在 gray 采样下选控牌 A，weights-only
 *      纯打分亦选 A？→ 改用受控「过牌更优」夹具 B：full 采样判过牌，weights-only 纯打分跟 7）；
 *   ③ 两档各自确定性（rng 无关）。
 *
 * ── 预期红（对 R2 基线 main）── ②红（旧 Path B 打分口径不同，分叉点不受控）；①部分红
 *   （Path B 与活路径在非仲裁面就有分差）。修后全绿。
 * ── 负向变异自证（执行者实现后自查）──
 *   ① weights-only 恢复独立打分口径 → ①红。
 *   ② full 的仲裁被短路（永不采样）→ ②红（两档恒等）。
 */
import { describe, expect, it } from 'vitest';
import { hardStrategyWithProfile } from '../../assets/scripts/ai/levels/hard';
import { HARD_PIMC } from '../../assets/scripts/ai/pimc';
import { createRng, recognize } from '../../assets/scripts/rules';
import { GamePhase, type GameEvent, type GameSnapshot } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const full = hardStrategyWithProfile(HARD_PIMC);
const weightsOnly = hardStrategyWithProfile({ samples: 0, maxCandidates: HARD_PIMC.maxCandidates });

function playEvents(specs: Array<[0 | 1 | 2, string]>): GameEvent[] {
  return specs.map(([seat, spec]) => ({ type: 'play' as const, seat, pattern: recognize(cards(spec))! }));
}

// 受控夹具 B（同 S4）：未见 {2,J}，出 7 每世界必败、过牌每世界必胜（队友清手）。
const HISTORY_PASS = playEvents([
  [0, '3 3 3 3'], [1, '4 4 4 4'], [2, '5 5 5 5'], [0, '8 8 8 8'], [1, '9 9 9 9'], [2, '10 10 10 10'],
  [0, 'Q Q Q Q'], [1, 'K K K K'], [2, 'A A A A'],
  [0, '6 6 6'], [1, '7 7 7'], [2, 'J J J'], [0, '2 2'], [1, 'x X'],
  [0, '6'],
]);

const SNAP_PASS: GameSnapshot = {
  phase: GamePhase.Playing,
  turn: 1,
  landlord: 0,
  top: { seat: 0, pattern: recognize(cards('6'))! },
  handCounts: [1, 2, 1],
  winner: null,
  viewerHand: cards('2 7'),
};

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [5, 5, 5],
    winner: null,
    viewerHand: cards('6 4 4 4 4'),
    ...over,
  };
}

describe('W-AI-R2 消融纯度（weights-only=同打分仅跳仲裁）', () => {
  it('非仲裁路径同判①：保炸白跟（出单 6）两档逐字段相等', () => {
    const s = snap({ top: { seat: 1, pattern: recognize(cards('3'))! } });
    expect(weightsOnly(s, createRng(1))).toEqual(full(s, createRng(2)));
  });

  it('非仲裁路径同判②：整手清完两档逐字段相等', () => {
    const s = snap({ top: null, viewerHand: cards('3 4 5 6 7'), handCounts: [5, 5, 5] });
    expect(weightsOnly(s, createRng(3))).toEqual(full(s, createRng(4)));
  });

  it('非仲裁路径同判③：压制期领出两档逐字段相等（pressing 早退层在仲裁之前）', () => {
    const s = snap({ top: null, viewerHand: cards('5 9 9 K'), handCounts: [4, 1, 3] });
    expect(weightsOnly(s, createRng(5))).toEqual(full(s, createRng(6)));
  });

  it('仲裁可达性：受控夹具 B 上 full（采样判过牌）与 weights-only（纯打分跟 7）分叉——采样路径存活', () => {
    const viaFull = full(SNAP_PASS, createRng(7), HISTORY_PASS);
    const viaWeights = weightsOnly(SNAP_PASS, createRng(8), HISTORY_PASS);
    expect(viaFull.type, 'full：每个世界过牌→队友清手必胜，采样必判 pass').toBe('pass');
    expect(viaWeights.type, 'weights-only：纯打分面无从看见队友清手线，应跟 7').toBe('play');
  });

  it('两档各自确定性：rng 无关', () => {
    expect(full(SNAP_PASS, createRng(11), HISTORY_PASS)).toEqual(full(SNAP_PASS, createRng(99), HISTORY_PASS));
    expect(weightsOnly(SNAP_PASS, createRng(11), HISTORY_PASS)).toEqual(weightsOnly(SNAP_PASS, createRng(99), HISTORY_PASS));
  });
});
