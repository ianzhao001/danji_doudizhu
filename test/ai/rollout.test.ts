/**
 * W-AI S3 种子 v4：廉价走子引擎（规划者修订 · 2026-07-17 · sota2 · W-AI-R2 棒）。
 *
 * ── v4 修订记录（三方审查②唯一吸收项=缺陷 D5）──
 *   wholePlay 清手快路不识别 飞机带单/带对翼、四带两单/两对 的整手清完——推演中持有者被迫
 *   多步走完（低估其一手清能力，与 follow 盲区方向相反的保真度缺口）。v4 补钉：
 *   wholePlay 的 counts 级识别扩展四类（trip 链核+相异翼计数匹配 / 四张+两相异翼），
 *   新增判别夹具 H/H2（整手领出 plays=1；现实现走多步红先行）。v3 其余契约逐字保留。
 *
 * ── v2 修订记录（第三方审查缺陷① 部分成立，规划者裁决后补齐契约）──
 *   v1 的 follow 契约只覆盖 单/对/三/三带/顺/连对/裸飞机 + 炸弹语义，**漏掉四类复合牌型**：
 *   飞机带单翼/飞机带双翼/四带两单/四带两对——旧实现对它们 default 过牌（仅告急才炸），
 *   使 PIMC 推演对这四类领出产生系统性高估（"虚假无敌"偏置）。
 *   严重度经镜像竞技场界定为二阶（hard +10.17pp 在案；领出评分层的保护牌过滤已把四带二
 *   挡在候选之外），但保真度缺口属实 → v2 补钉：**四类必须给出 counts 级最小同型可压**，
 *   翼构造与 rules 识别口径一致（单翼相异点、对翼相异点，不得对充双单——S9 完备门为真值域），
 *   可压时跟（含花掉四张作载体的四带二跟牌——真实 legalFollows 本就允许），不可压时维持 炸/过。
 *   v1 其余契约逐字保留。
 *
 * 落位：Codex 逐字节复制**覆盖** test/ai/rollout.test.ts，独立 seed commit。
 * 实现目标：assets/scripts/ai/rollout.ts 的 follow() 补四个 case——
 *   AirplaneSingles/AirplanePairs：更高同长 trip 链 + 链外最小相异单/对翼；
 *   FourPlusTwoSingles/FourPlusTwoPairs：更高四张 + 最小相异单/对翼。
 *
 * ── v3 修订记录（执行者阻断⑤成立：变异③④在 v2 夹具上红 0——③五张顺被贪心顺子路兜底、
 *   ④对子夹具仅一个可压选项无从判别。规划者补两枚判别夹具：F=整手三带一 3335（贪心组件路
 *   只会裸出 333，删清手快路必翻盘）；G=单牌双选项 A44 跟单 3（最小=4 被地主 K 收官、
 *   改最大=A 则农民反杀——择序直接决定胜负归属）。其余逐字保留。）──
 *
 * ── 预期红（对 R2 基线 main，预跑实测）── 夹具 H/H2（四类整手清完）红；其余全绿（R1 已合入）。
 *
 * ── 负向变异自证（执行者实现后自查，报告注明红几条）──
 *   ① 删掉 AirplaneSingles case → 夹具A 红。
 *   ② 四带二翼取同点两张（对充双单）→ recognize 复核类夹具红（materialize 不合法）。
 *   ③ 领出贪心去掉「整手可清即清」快路 → 夹具F 红（landlord/1 手翻成 farmer）。
 *   ④ 跟牌 minimal-beat 改 maximal → 夹具G 红（landlord 翻成 farmer）。
 *   ⑤ 内部直接在入参 counts 上扣牌 → 不可变用例红（v1 项保留）。
 *   ⑥ wholePlay 四类识别删除 → 夹具 H/H2 红（v4 项）。
 */
import { describe, expect, it } from 'vitest';
import { Rank, createRng, recognize } from '../../assets/scripts/rules';
import { rolloutRound, toRankCounts } from '../../assets/scripts/ai/rollout';
import { cards } from '../rules/_util';

const COUNTS_LEN = Rank.BigJoker + 1;

function counts(spec: string): number[] {
  return toRankCounts(cards(spec));
}

function snapshotOf(rows: number[][]): string {
  return JSON.stringify(rows);
}

describe('W-AI S3 rollout 廉价走子引擎', () => {
  it('toRankCounts：长度 18、逐点计数、总和守恒', () => {
    const c = toRankCounts(cards('3 3 7 K x X'));
    expect(c).toHaveLength(COUNTS_LEN);
    expect(c[Rank.R3]).toBe(2);
    expect(c[Rank.R7]).toBe(1);
    expect(c[Rank.K]).toBe(1);
    expect(c[Rank.SmallJoker]).toBe(1);
    expect(c[Rank.BigJoker]).toBe(1);
    expect(c.reduce((sum, n) => sum + n, 0)).toBe(6);
  });

  it('地主整手顺子领出一手清完：winnerSide=landlord、plays=1', () => {
    const board: [number[], number[], number[]] = [counts('3 4 5 6 7'), counts('9 9 J'), counts('10 10 Q')];
    const outcome = rolloutRound({
      counts: board, turn: 0, landlord: 0, top: null, topSeat: null, rng: createRng(1),
    });
    expect(outcome.winnerSide).toBe('landlord');
    expect(outcome.plays).toBe(1);
  });

  it('农民最小同型可压并清手：对 3 顶上对 4 清空 → farmer 胜', () => {
    const board: [number[], number[], number[]] = [counts('K K 2'), counts('4 4'), counts('9 9 9')];
    const outcome = rolloutRound({
      counts: board,
      turn: 1,
      landlord: 0,
      top: recognize(cards('3 3'))!,
      topSeat: 0,
      rng: createRng(2),
    });
    expect(outcome.winnerSide).toBe('farmer');
    expect(outcome.plays).toBe(1);
  });

  it('无人能压时过牌回权：地主领出最后一张单牌获胜（plays=2 路径）', () => {
    // seat0(地主) 先出单 K（top），seat1/2 均压不动 → 牌权重置回 seat0，领出最后一张 A 清手。
    const board: [number[], number[], number[]] = [counts('A'), counts('3'), counts('4')];
    const outcome = rolloutRound({
      counts: board,
      turn: 1,
      landlord: 0,
      top: recognize(cards('K'))!,
      topSeat: 0,
      rng: createRng(3),
    });
    expect(outcome.winnerSide).toBe('landlord');
    expect(outcome.plays).toBe(1); // 本次模拟内的出牌手数（K 已在场外）：只有 A 落下。
  });

  it('农民对队友 top 恒过：队友的对 9 不被我方压，地主压后局面继续（不 crash 且守恒）', () => {
    const board: [number[], number[], number[]] = [counts('Q Q 2 2'), counts('10 10'), counts('K K 3')];
    const outcome = rolloutRound({
      counts: board,
      turn: 2,
      landlord: 0,
      top: recognize(cards('9 9'))!,
      topSeat: 1, // 队友(农民 seat1)的 top，轮到农民 seat2 —— 恒过。
      rng: createRng(4),
    });
    expect(outcome.winnerSide === 'landlord' || outcome.winnerSide === 'farmer').toBe(true);
    expect(outcome.plays).toBeLessThanOrEqual(54);
  });

  it('入参 counts 不可变 + 同 rng 确定性 + plays 守恒上界（中等局面）', () => {
    const board: [number[], number[], number[]] = [
      counts('3 3 4 5 6 7 8 9 10 J Q K A 2'),
      counts('3 4 4 5 5 6 6 7 7 8 8 9 9'),
      counts('10 10 J J Q Q K K A A 2 2 x'),
    ];
    const before = snapshotOf(board);
    const first = rolloutRound({ counts: board, turn: 0, landlord: 0, top: null, topSeat: null, rng: createRng(42) });
    expect(snapshotOf(board), 'rolloutRound 不得改入参 counts').toBe(before);
    const second = rolloutRound({ counts: board, turn: 0, landlord: 0, top: null, topSeat: null, rng: createRng(42) });
    expect(second).toEqual(first);
    expect(first.plays).toBeGreaterThan(0);
    expect(first.plays).toBeLessThanOrEqual(54);
  });
});

describe('W-AI S3v2 四类复合牌型跟牌（修复 PIMC「虚假无敌」盲区）', () => {
  it('夹具A 飞机带单翼可压：555666+7+8 顶 333444+5+6 并清手 → farmer、plays=1', () => {
    const board: [number[], number[], number[]] = [counts('2 2 2'), counts('5 5 5 6 6 6 7 8'), counts('3')];
    const outcome = rolloutRound({
      counts: board,
      turn: 1,
      landlord: 0,
      top: recognize(cards('3 3 3 4 4 4 5 6'))!,
      topSeat: 0,
      rng: createRng(11),
    });
    expect(outcome.winnerSide).toBe('farmer');
    expect(outcome.plays).toBe(1);
  });

  it('夹具B 飞机带双翼可压：777888+99+1010 顶 333444+55+66 并清手 → farmer、plays=1', () => {
    const board: [number[], number[], number[]] = [counts('2 2 2'), counts('7 7 7 8 8 8 9 9 10 10'), counts('3')];
    const outcome = rolloutRound({
      counts: board,
      turn: 1,
      landlord: 0,
      top: recognize(cards('3 3 3 4 4 4 5 5 6 6'))!,
      topSeat: 0,
      rng: createRng(12),
    });
    expect(outcome.winnerSide).toBe('farmer');
    expect(outcome.plays).toBe(1);
  });

  it('夹具C 四带两单可压：9999+6+7 顶 5555+3+4 并清手 → farmer、plays=1', () => {
    const board: [number[], number[], number[]] = [counts('2 2 2'), counts('9 9 9 9 6 7'), counts('3')];
    const outcome = rolloutRound({
      counts: board,
      turn: 1,
      landlord: 0,
      top: recognize(cards('5 5 5 5 3 4'))!,
      topSeat: 0,
      rng: createRng(13),
    });
    expect(outcome.winnerSide).toBe('farmer');
    expect(outcome.plays).toBe(1);
  });

  it('夹具D 四带两对可压：10101010+JJ+QQ 顶 5555+33+44 并清手 → farmer、plays=1', () => {
    const board: [number[], number[], number[]] = [counts('2 2 2'), counts('10 10 10 10 J J Q Q'), counts('3')];
    const outcome = rolloutRound({
      counts: board,
      turn: 1,
      landlord: 0,
      top: recognize(cards('5 5 5 5 3 3 4 4'))!,
      topSeat: 0,
      rng: createRng(14),
    });
    expect(outcome.winnerSide).toBe('farmer');
    expect(outcome.plays).toBe(1);
  });

  it('夹具F 清手快路自证：整手三带一 3 3 3 5 一手清完（贪心组件路只会裸 333，快路缺失必翻盘）', () => {
    const board: [number[], number[], number[]] = [counts('3 3 3 5'), counts('4'), counts('6')];
    const outcome = rolloutRound({
      counts: board, turn: 0, landlord: 0, top: null, topSeat: null, rng: createRng(16),
    });
    // 快路在：3335 整手 TripsSingle 一手清。快路删除：333 裸出→回权领 5→seat2 的 6 反杀成 farmer。
    expect(outcome.winnerSide).toBe('landlord');
    expect(outcome.plays).toBe(1);
  });

  it('夹具G 最小可压择序自证：A 4 4 跟单 3 必出最小 4（地主 K 收官）；改最大 A 则农民反杀', () => {
    const board: [number[], number[], number[]] = [counts('K'), counts('A 4 4'), counts('9')];
    const outcome = rolloutRound({
      counts: board,
      turn: 1,
      landlord: 0,
      top: recognize(cards('3'))!,
      topSeat: 0,
      rng: createRng(17),
    });
    // minimal：4 → 地主 K 压并清手（landlord, plays=2）。maximal 变异：A 赢墩 → 领对 44 清手（farmer）。
    expect(outcome.winnerSide).toBe('landlord');
    expect(outcome.plays).toBe(2);
  });

  it('夹具H（D5）：整手飞机带单翼 5 5 5 6 6 6 7 8 领出一手清完 → landlord、plays=1', () => {
    const board: [number[], number[], number[]] = [counts('5 5 5 6 6 6 7 8'), counts('K'), counts('A')];
    const outcome = rolloutRound({
      counts: board, turn: 0, landlord: 0, top: null, topSeat: null, rng: createRng(18),
    });
    expect(outcome.winnerSide).toBe('landlord');
    expect(outcome.plays).toBe(1);
  });

  it('夹具H2（D5）：整手四带两单 9 9 9 9 6 7 领出一手清完（清手优先于炸弹保护）→ landlord、plays=1', () => {
    const board: [number[], number[], number[]] = [counts('9 9 9 9 6 7'), counts('K'), counts('A')];
    const outcome = rolloutRound({
      counts: board, turn: 0, landlord: 0, top: null, topSeat: null, rng: createRng(19),
    });
    expect(outcome.winnerSide).toBe('landlord');
    expect(outcome.plays).toBe(1);
  });

  it('夹具E 压不上仍过牌（回归）：无同长飞机链且地主不告急 → 地主回权领出取胜', () => {
    const board: [number[], number[], number[]] = [counts('2 2 2'), counts('K K A'), counts('3')];
    const outcome = rolloutRound({
      counts: board,
      turn: 1,
      landlord: 0,
      top: recognize(cards('3 3 3 4 4 4 5 6'))!,
      topSeat: 0,
      rng: createRng(15),
    });
    expect(outcome.winnerSide).toBe('landlord');
    expect(outcome.plays).toBe(1); // 双过回权后地主 222 一手清。
  });
});
