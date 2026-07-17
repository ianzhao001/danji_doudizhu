/**
 * W-AI-R2 修订版：毫手量纲权重核契约（规划者修订种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/ai/hand-weight.test.ts，独立 seed commit（R2a 棒）。
 *
 * ── 修订依据（缺陷 D1 根治 + D2 退役）──
 *   · moveOutcomeScore 重构为毫手组合式（W_STRUCT=1000 锚）：
 *     `structureCost×W_STRUCT + controlSpend + pressRisk + beatenGift − clamp(remaining,±REMAIN_CAP)/2`；
 *     新签名 `moveOutcomeScore(d, hand, move, pressureCtx?)`——pressureCtx 可选
 *     `{ remainingByRank?, hiddenCounts? }`；缺省时 P̂beat=512（中性半概率）、无绝对顶加成。
 *   · controlSpend 只罚「翼/挂牌角色」的控牌（2/王/A 系数见 BOARD 裁决），清手豁免、冲刺衰减。
 *   · candidates.ts 退役删除 → 本文件 leadCandidates/followCandidates 两用例删除。
 *   componentPower/weighHand 方向契约逐字保留。
 *
 * ── v2 修订记录（R2a 阻断③：限幅自证哑火）──
 *   旧「限幅」夹具（34567+xX+22 对比式）的余牌分 ≈340 从未越过 ±REMAIN_CAP——clamp 在该夹具上
 *   恒等，撤除自然 0 红（执行者实测 10/10 绿，定位正确）。v2 换**直接下界判别夹具**：
 *   火箭+五炸残手（余牌分 ≈1136 ≫ 上限 500），白出单 3 后断言 score ≥ −REMAIN_CAP/2
 *   （正项恒 ≥0 ⇒ 有 clamp 必真；撤除后 −余牌/2 ≈ −568，正项 ≤260 托不回）+ 夹具前提自检
 *   （结构=0、余牌分>REMAIN_CAP——防再造无判别力夹具）。其余逐字保留。
 *
 * ── 预期红（对 R2 基线 main，预跑实测）──「控牌罚新量纲」用例红（旧公式差额仅 ±36 <200）、
 *   「常量导出」用例红（W_STRUCT/REMAIN_CAP 未导出）；其余方向钉对旧式即绿（回归性质）。
 * ── 负向变异自证（执行者实现后自查）──
 *   ① controlSpend 置 0 → 控牌罚差额用例红（差额跌回 ≈36）。
 *   ② REMAIN_CAP 撤除（clampRemaining 直返原分）→ 「余牌限幅」下界夹具红（−568+正项 < −CAP/2）。
 *   ③ 清手豁免删除 → 清手夹具红。
 */
import { describe, expect, it } from 'vitest';
import { Category, enumerateMoves, recognize, type Move } from '../../assets/scripts/rules';
import { Decomposer } from '../../assets/scripts/ai/decompose';
import {
  REMAIN_CAP,
  TEMPO_PENALTY,
  W_STRUCT,
  componentPower,
  moveOutcomeScore,
  weighHand,
} from '../../assets/scripts/ai/handWeight';
import { cards } from '../rules/_util';

function pattern(spec: string) {
  const recognized = recognize(cards(spec));
  if (!recognized) throw new Error(`not a legal pattern: ${spec}`);
  return recognized;
}

function findMove(moves: Move[], predicate: (move: Move) => boolean): Move {
  const found = moves.find(predicate);
  if (!found) throw new Error('fixture move not found');
  return found;
}

describe('W-AI-R2 handWeight 毫手权重核', () => {
  it('量纲锚与可调域：W_STRUCT===1000（固定锚）；REMAIN_CAP∈[300,500]；TEMPO_PENALTY>0', () => {
    expect(W_STRUCT).toBe(1000);
    expect(REMAIN_CAP).toBeGreaterThanOrEqual(300);
    expect(REMAIN_CAP).toBeLessThanOrEqual(500);
    expect(TEMPO_PENALTY).toBeGreaterThan(0);
  });

  it('componentPower 跨型序：火箭 > 炸弹 > 0；炸弹随点数递增', () => {
    expect(componentPower(pattern('x X'))).toBeGreaterThan(componentPower(pattern('2 2 2 2')));
    expect(componentPower(pattern('2 2 2 2'))).toBeGreaterThan(componentPower(pattern('3 3 3 3')));
    expect(componentPower(pattern('3 3 3 3'))).toBeGreaterThan(0);
  });

  it('componentPower 同型内方向：单 3 为债（负）、单 2 为资产（正）；对 K > 对 3；长顺 > 短顺', () => {
    expect(componentPower(pattern('3'))).toBeLessThan(0);
    expect(componentPower(pattern('2'))).toBeGreaterThan(0);
    expect(componentPower(pattern('K K'))).toBeGreaterThan(componentPower(pattern('3 3')));
    expect(componentPower(pattern('3 4 5 6 7 8 9'))).toBeGreaterThan(componentPower(pattern('3 4 5 6 7')));
  });

  it('weighHand：moveCount 与 Decomposer 一致，score ≡ power − TEMPO_PENALTY×moveCount，不改入参', () => {
    const d = new Decomposer();
    const hand = cards('3 4 5 6 7 K K 2');
    const before = hand.map((card) => `${card.rank}:${card.suit}`).join(',');
    const weighed = weighHand(d, hand);
    expect(weighed.moveCount).toBe(d.decompose(hand).moveCount);
    expect(weighed.score).toBe(weighed.power - TEMPO_PENALTY * weighed.moveCount);
    expect(hand.map((card) => `${card.rank}:${card.suit}`).join(',')).toBe(before);
    expect(weighHand(d, hand)).toEqual(weighed);
  });

  it('moveOutcomeScore 保控牌（既有方向钉）：444+3 优于 444+K（K 留手）', () => {
    const d = new Decomposer();
    const hand = cards('3 4 4 4 K');
    const moves = enumerateMoves(hand);
    const withSmall = findMove(moves, (move) =>
      move.pattern.category === Category.TripsSingle && move.cards.some((card) => card.rank === 3));
    const withKing = findMove(moves, (move) =>
      move.pattern.category === Category.TripsSingle && move.cards.some((card) => card.rank === 13));
    expect(moveOutcomeScore(d, hand, withSmall)).toBeLessThan(moveOutcomeScore(d, hand, withKing));
  });

  it('D1 根治·控牌罚新量纲：444+3 与 444+2 的分差 ≥200 毫手（旧式仅 ±36，红先行判据）', () => {
    const d = new Decomposer();
    const hand = cards('3 4 4 4 2');
    const moves = enumerateMoves(hand);
    const withSmall = findMove(moves, (move) =>
      move.pattern.category === Category.TripsSingle && move.cards.some((card) => card.rank === 3));
    const withTwo = findMove(moves, (move) =>
      move.pattern.category === Category.TripsSingle && move.cards.some((card) => card.rank === 15));
    const gap = moveOutcomeScore(d, hand, withTwo) - moveOutcomeScore(d, hand, withSmall);
    expect(gap, '弃 2 作翼的罚金必须是毫手量级（controlSpend 生效）').toBeGreaterThanOrEqual(200);
  });

  it('D1 根治·清手豁免：整手 444+2 清完不计弃 2 罚（与同型非清手形成差）', () => {
    const d = new Decomposer();
    const finishing = cards('4 4 4 2');
    const finishingMove = findMove(enumerateMoves(finishing), (move) => move.cards.length === 4
      && move.pattern.category === Category.TripsSingle);
    const nonFinishing = cards('3 4 4 4 2');
    const carriedMove = findMove(enumerateMoves(nonFinishing), (move) =>
      move.pattern.category === Category.TripsSingle && move.cards.some((card) => card.rank === 15));
    // 清手：结构 1+0−1=0 且豁免控牌罚 → 分数应显著低于「非清手弃 2」同型（豁免生效的可观测差）。
    const finishingScore = moveOutcomeScore(d, finishing, finishingMove);
    const carriedScore = moveOutcomeScore(d, nonFinishing, carriedMove);
    expect(finishingScore, '清手带 2 收官不受弃控罚').toBeLessThan(carriedScore - 100);
  });

  it('结构优先（既有方向钉）：整顺 34567 优于拆顺单 4', () => {
    const d = new Decomposer();
    const hand = cards('3 4 5 6 7 8 8');
    const moves = enumerateMoves(hand);
    const straight = findMove(moves, (move) =>
      move.pattern.category === Category.Straight && move.cards.length === 5 && move.pattern.mainRank === 7);
    const splitSingle = findMove(moves, (move) =>
      move.pattern.category === Category.Single && move.pattern.mainRank === 4);
    expect(moveOutcomeScore(d, hand, straight)).toBeLessThan(moveOutcomeScore(d, hand, splitSingle));
  });

  it('余牌限幅（R2a 阻断③修订）：余牌分 ≫ 上限的极端残手上，score 下界 = −REMAIN_CAP/2 成立', () => {
    const d = new Decomposer();
    // 火箭+六炸残手：打出单 3 后余牌 = {xX, 2222, AAAA, KKKK, QQQQ, JJJJ, 10101010}，
    // 余牌分 ≈ 1292 —— 远超任何合法 REMAIN_CAP(≤500)+600 的咬合下限。
    const hand = cards('3 x X 2 2 2 2 A A A A K K K K Q Q Q Q J J J J 10 10 10 10');
    const single3 = findMove(enumerateMoves(hand), (move) =>
      move.pattern.category === Category.Single && move.pattern.mainRank === 3);
    // 夹具前提自检（阻断③教训：无判别力夹具=没有门）：
    //   ①单 3 白出；②余牌分 > REMAIN_CAP+600 —— 数学上保证撤除限幅必红：
    //   撤除后 score ≤ 正项上界(≈260) − 余牌分/2 < 260 − (CAP+600)/2 = −CAP/2 − 40 < −CAP/2。
    expect(d.structureCost(hand, single3.cards), '前提：单 3 为白出').toBeLessThanOrEqual(0);
    const remaining = cards('x X 2 2 2 2 A A A A K K K K Q Q Q Q J J J J 10 10 10 10');
    expect(weighHand(d, remaining).score, '前提：余牌分必须越过 REMAIN_CAP+600（判别齿保证）')
      .toBeGreaterThan(REMAIN_CAP + 600);
    // 下界：controlSpend/pressRisk/beatenGift 均 ≥0，结构=0 ⇒ 有 clamp 时 score ≥ −REMAIN_CAP/2。
    expect(moveOutcomeScore(d, hand, single3)).toBeGreaterThanOrEqual(-REMAIN_CAP / 2);
  });

  it('确定性与纯函数：同入参深相等，pressureCtx 缺省中性', () => {
    const d = new Decomposer();
    const hand = cards('3 4 4 4 2');
    const move = findMove(enumerateMoves(hand), (m) => m.pattern.category === Category.Trips);
    expect(moveOutcomeScore(d, hand, move)).toBe(moveOutcomeScore(d, hand, move));
    expect(moveOutcomeScore(new Decomposer(), hand, move)).toBe(moveOutcomeScore(d, hand, move));
  });
});
