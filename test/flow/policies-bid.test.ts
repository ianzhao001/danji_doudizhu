/**
 * W-AI 修订版：flow 层叫抢分层路由契约（规划者修订种子 · 2026-07-17 · sota2 · 阻断③）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/flow/policies-bid.test.ts，独立 seed commit（B2 棒）。
 *
 * ── 修订谱系（本文件已两度契约改写，均披露）──
 *   M-FLOW-04 原始种入 → W-AUDIT-AI 改写（废「1 高牌逢局必抢」）→ **W-AI 本次改写**：
 *   ① 全体上移：双控短手 `2 2 3 4 5` 由「Simple=pass」改**三档 call**（Simple≈旧 Normal 口径）。
 *   ② 统一评分修复 Normal 缺陷：双控烂形 `2 2 3 4 5 7 9 J K A`（9 手散型）由
 *      「Hard=pass、Normal=call」改**三档 pass**——旧 Normal 走高牌阈值无视手型、被烂形骗上桌，
 *      正是三档统一 bidScore（控牌+短手型溢价）要消灭的缺陷；阈值单调 Simple>Normal>Hard 下
 *      「Hard=pass 且 Normal=call」在逻辑上不可能共存，旧断言废止。
 *   ③ 「与 chooseBid 分叉」升级：烂形上 Hard **与 Normal** 都与基线 chooseBid（阈2=call）分叉
 *      ——分层证据从「Hard 特殊」升为「全档形判」。
 *   路由深相等与 playPolicy 护栏逐字保留。本矩阵并入 bidScore 校准集（B2 调参硬约束）。
 *
 * ── 预期红（对 main 旧实现，预跑实测）── 3 用例红（②③④），路由/护栏 2 绿。
 * ── 负向变异自证（执行者实现后自查）──
 *   ① bidding-eval 阈值失守（烂形 ≥ TH_Hard）→ 烂形矩阵用例红。
 *   ② bidPolicy 回退统一 chooseBid → 分叉用例红。
 */
import { describe, it, expect } from 'vitest';
import { levelPolicies } from '../../assets/scripts/flow/policies';
import { AiLevel, chooseBidByLevel, strategyFor, chooseBid } from '../../assets/scripts/ai';
import { createBidding } from '../../assets/scripts/game';
import { cards } from '../rules/_util';

const LEVELS: [AiLevel, AiLevel, AiLevel] = [AiLevel.Hard, AiLevel.Simple, AiLevel.Normal];

describe('M-FLOW-04 叫抢策略切到难度分层（W-AI 修订）', () => {
  it('bidPolicy 按 seat 路由到 chooseBidByLevel(levels[seat])（seat 0/1/2 深相等）', () => {
    const { bidPolicy } = levelPolicies(LEVELS);
    const hand = cards('2 2 3 4 5'); // 双控短手：W-AI 全体上移后三档同判 call，深相等仍证路由。
    for (const seat of [0, 1, 2] as const) {
      const state = createBidding(seat);
      expect(bidPolicy({ seat, state, hand })).toEqual(chooseBidByLevel(hand, state, LEVELS[seat]));
    }
  });

  it('W-AI 全体上移锚：双控短手 2 2 3 4 5 → 三档 call（policy 层与 bidding-levels 矩阵一致）', () => {
    const { bidPolicy } = levelPolicies(LEVELS);
    const hand = cards('2 2 3 4 5');
    expect(bidPolicy({ seat: 0, state: createBidding(0), hand }).type, 'Hard').toBe('call');
    expect(bidPolicy({ seat: 1, state: createBidding(1), hand }).type, 'Simple(≈旧 Normal)').toBe('call');
    expect(bidPolicy({ seat: 2, state: createBidding(2), hand }).type, 'Normal').toBe('call');
  });

  it('W-AI 形判锚：双控烂形 2 2 3 4 5 7 9 J K A(9 手散型) → 三档 pass（Normal 不再被烂形骗上桌）', () => {
    const { bidPolicy } = levelPolicies(LEVELS);
    const hand = cards('2 2 3 4 5 7 9 J K A');
    expect(bidPolicy({ seat: 0, state: createBidding(0), hand }).type, 'Hard').toBe('pass');
    expect(bidPolicy({ seat: 1, state: createBidding(1), hand }).type, 'Simple').toBe('pass');
    expect(bidPolicy({ seat: 2, state: createBidding(2), hand }).type, 'Normal').toBe('pass');
  });

  it('分层证据：烂形上 Hard 与 Normal 均与基线 chooseBid(阈2=call) 分叉（全档形判，非统一委派）', () => {
    const { bidPolicy } = levelPolicies(LEVELS);
    const hand = cards('2 2 3 4 5 7 9 J K A');
    const baseline = chooseBid(hand, createBidding(0));
    expect(baseline.type, '前提自证：基线双控即 call').toBe('call');
    expect(bidPolicy({ seat: 0, state: createBidding(0), hand })).not.toEqual(chooseBid(hand, createBidding(0)));
    expect(bidPolicy({ seat: 2, state: createBidding(2), hand })).not.toEqual(chooseBid(hand, createBidding(2)));
  });

  it('playPolicy 不变（仍 strategyFor(levels[turn])）— 绿护栏', () => {
    const { playPolicy } = levelPolicies(LEVELS);
    // 仅断言 playPolicy 仍是函数且不抛（详细路由由 policies.test.ts 覆盖）
    expect(typeof playPolicy).toBe('function');
    void strategyFor;
  });
});
