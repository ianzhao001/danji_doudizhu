/**
 * W-AI-R2 修订版：hard 管线接线契约（规划者修订种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/ai/hard-pipeline.test.ts，独立 seed commit（R2a 棒）。
 *
 * ── 修订依据（缺陷 D1/D3 根治）──
 *   · **Path B 删除**：`profile.samples === 0 || !canSampleWorld` 的第二打分路径废除——
 *     活路径统一打分；weights-only 重定义 =「同打分、仅跳过 pimc 仲裁」（消融对照变纯）；
 *     canSampleWorld 降级为仲裁可行性守卫（合成/非守恒态跳过采样，打分不变）。
 *   · **单一打分路径负向锚**：chooseLeadMove 只经 moveOutcomeScore 打分，不得直调
 *     structureCost（消灭双打分口径复辟面）。
 *   · **带宽重标定**：领出保留 PIMC_LEAD_BAND = 200；B2 将跟牌的 250 单档带换成
 *     结构保底/综合分最优/最小控牌消耗三类有界代表，并保留 mustInclude 结构保底。
 *   决策序（finishing → 旧 prover → solveForcedWin → 队友让牌 → 压制期 → 喂牌/领出 → 结构跟牌）
 *   与白跟直通锚逐字保留。
 *
 * ── 预期红（对 R2 基线 main，预跑实测）── Path B 删除锚/带宽锚/gray 软带锚 红；
 *   工厂/决策序/白跟直通/行为抽查 绿。
 * ── 负向变异自证（执行者实现后自查）──
 *   ① 恢复 samples===0 的第二打分分支 → 「无第二打分路径」锚红。
 *   ② PIMC_LEAD_BAND 回 4 → 带宽锚红。
 *   ③ 跟牌恢复 PIMC_FOLLOW_BAND 或删除 selectDiverseCandidates → 有界代表锚红。
 *   ④ gray 去 mustInclude 保底 → 保底锚红。
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createRng, recognize, Rank } from '../../assets/scripts/rules';
import { GamePhase, type GameSnapshot, type TopPlay } from '../../assets/scripts/game';
import { strategyFor, AiLevel } from '../../assets/scripts/ai';
import { hardStrategyWithProfile } from '../../assets/scripts/ai/levels/hard';
import { cards } from '../rules/_util';

const HARD_SOURCE = readFileSync(
  new URL('../../assets/scripts/ai/levels/hard.ts', import.meta.url),
  'utf8',
);

function expectOrder(source: string, first: string, second: string, message: string): void {
  const left = source.indexOf(first);
  const right = source.indexOf(second);
  expect(left, `${message}: missing ${first}`).toBeGreaterThanOrEqual(0);
  expect(right, `${message}: missing ${second}`).toBeGreaterThan(left);
}

function sliceBetween(source: string, startAnchor: string, endAnchor: string): string {
  const start = source.indexOf(startAnchor);
  const end = source.indexOf(endAnchor, start);
  expect(start, `missing slice start ${startAnchor}`).toBeGreaterThanOrEqual(0);
  expect(end, `missing slice end ${endAnchor}`).toBeGreaterThan(start);
  return source.slice(start, end);
}

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

const oppSingle = (token: string): TopPlay => ({ seat: 1, pattern: recognize(cards(token))! });

describe('W-AI-R2 hard 管线接线契约', () => {
  it('工厂与档位：hardStrategyWithProfile 存在，hardStrategy 即 HARD_PIMC 档', () => {
    expect(HARD_SOURCE).toContain('export function hardStrategyWithProfile(');
    expect(HARD_SOURCE).toContain('export const hardStrategy: AiStrategy = hardStrategyWithProfile(HARD_PIMC)');
  });

  it('D1/D3 根治锚：Path B 已删、单一打分路径、weights-only=同打分仅跳仲裁', () => {
    const lead = sliceBetween(HARD_SOURCE, 'function chooseLeadMove', 'function chooseFeedTeammateLead');
    expect(lead, '打分只经 moveOutcomeScore').toContain('moveOutcomeScore(');
    expect(lead, '无第二打分路径：chooseLeadMove 不得直调 structureCost').not.toContain('structureCost(');
    expect(lead, '仲裁触发=samples>0（weights-only 同打分仅跳仲裁）').toContain('profile.samples > 0');
    expect(lead, 'canSampleWorld 仅作仲裁可行性守卫').toContain('canSampleWorld(');
    expect(lead, '旧 Path B 的双路径开关不得复辟').not.toContain('samples === 0');
  });

  it('B2 跟牌有界代表锚：领出保留 200 带，跟牌取代 250 单档并保留 mustInclude', () => {
    expect(HARD_SOURCE).toContain('PIMC_LEAD_BAND = 200');
    expect(HARD_SOURCE).not.toContain('PIMC_FOLLOW_BAND');
    const follow = sliceBetween(HARD_SOURCE, 'function chooseStructuredFollow', 'export function hardStrategyWithProfile(');
    expect(follow).toContain('selectDiverseCandidates(');
    expect(follow).toContain("structuredFallback === 'pass' ? null : structuredFallback");
    expect(follow).toContain('grayScored[0]?.move');
    expect(follow).toContain('lowControlCheap');
    expect(follow).toContain('Math.min(profile.maxCandidates, 3)');
    expect(follow, 'gray 送仲裁必须带结构化保底').toContain('mustInclude');
    const selector = sliceBetween(HARD_SOURCE, 'function selectDiverseCandidates', 'function canSampleWorld');
    expect(selector).toContain('const seen = new Set<string>()');
    expect(selector).toContain('if (seen.has(key)) continue');
    expect(selector).toContain('selected.length >= maxCandidates');
  });

  it('决策序锚：finishing → 旧 prover → solveForcedWin → 队友让牌 → 压制期 → 喂队友', () => {
    const body = HARD_SOURCE.slice(HARD_SOURCE.indexOf('export function hardStrategyWithProfile('));
    expectOrder(body, 'chooseFinishingMove(', 'chooseGuaranteedLead(', 'finishing 必须先于必胜看破');
    expectOrder(body, 'chooseGuaranteedTakeover(', 'solveForcedWin(', '旧 prover 必须先于残局精确解（包裹不替换）');
    expectOrder(body, 'solveForcedWin(', 'isTeammateTop(', '残局解必须先于队友让牌');
    expectOrder(body, 'isTeammateTop(', 'isPressing(', '队友让牌必须先于压制期');
    expectOrder(body, 'isPressing(', 'chooseFeedTeammateLead(', '压制期必须先于喂队友领出');
  });

  it('白跟直通锚：cost≤0 分支必须在 pimcArbitrate 之前返回（保既有行为钉扎）', () => {
    const follow = sliceBetween(HARD_SOURCE, 'function chooseStructuredFollow', 'export function hardStrategyWithProfile(');
    expect(follow).toContain('pimcArbitrate(');
    expectOrder(follow, 'free.length > 0', 'pimcArbitrate(', '白跟(cost≤0)不得进 PIMC');
  });

  it('行为抽查：保炸白跟仍出单 6；weights-only 与 full 在白跟路径同判且 rng 无关', () => {
    const top = oppSingle('3');
    const weightsOnly = hardStrategyWithProfile({ samples: 0, maxCandidates: 8 });
    const s = snap({ top, viewerHand: cards('6 4 4 4 4'), handCounts: [5, 5, 5] });
    const action = weightsOnly(s, createRng(1));
    expect(action.type).toBe('play');
    if (action.type === 'play') {
      expect(action.cards).toHaveLength(1);
      expect(action.cards[0].rank).toBe(Rank.R6);
    }
    expect(weightsOnly(s, createRng(9))).toEqual(action);
    expect(strategyFor(AiLevel.Hard)(s, createRng(2))).toEqual(action);
  });
});
