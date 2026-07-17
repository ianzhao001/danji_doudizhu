/**
 * W-AI 口径①种子：连打累计纯岛（规划者预写红种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制到 test/ui/session-score.test.ts（新建），独立 seed commit。
 * 实现目标：assets/scripts/ui/session-score.ts（新建纯岛，禁 import cc/禁时基/禁随机）。
 *
 * ── 契约（用户裁决 2026-07-17：连打累计·内存态）──
 *   emptySessionTotals(): SessionTotals               —— [0,0,0]
 *   addRoundScores(totals, scores): SessionTotals     —— 逐席相加，**不可变**（不改入参，返回新数组）
 *   composeSessionRows(scores, totals): SessionScoreRow[]
 *     · scores 行序原样保留（不得按席位重排）；
 *     · row.total = totals[row.seat]（按席位取，不是按下标）；row.delta = score；isLandlord 透传；
 *     · 滚动起点恒等式：row.total − row.delta ≡ 本局开始前累计。
 *   类型：SessionTotals = readonly [number, number, number]；
 *         SessionScoreRow = { seat; delta; total; isLandlord }。
 *
 * ── 预期红（实现前）── 模块不存在 → 全文件红（6 用例）。
 *
 * ── 负向变异自证（执行者实现后自查，报告注明红几条）──
 *   ① addRoundScores 改原地累加（mutate 入参）→「不可变」用例红 ≥1。
 *   ② composeSessionRows 的 total 改按下标 totals[index] 取 →「乱序行」用例红。
 *   ③ emptySessionTotals 返回共享单例且被外部改动可见 → 不可变用例红。
 */
import { describe, expect, it } from 'vitest';
import {
  addRoundScores,
  composeSessionRows,
  emptySessionTotals,
  type SessionTotals,
} from '../../assets/scripts/ui/session-score';

describe('W-AI 口径① session-score 纯岛（连打累计）', () => {
  it('emptySessionTotals 恒为 [0,0,0] 且每次调用互不共享可变状态', () => {
    expect(emptySessionTotals()).toEqual([0, 0, 0]);
    const a = emptySessionTotals();
    const b = addRoundScores(a, [4, -2, -2]);
    expect(a).toEqual([0, 0, 0]);
    expect(b).toEqual([4, -2, -2]);
    expect(emptySessionTotals()).toEqual([0, 0, 0]);
  });

  it('addRoundScores 逐席相加且不可变（连打两局零和链）', () => {
    const start: SessionTotals = emptySessionTotals();
    const after1 = addRoundScores(start, [4, -2, -2]);
    const after2 = addRoundScores(after1, [-2, 1, 1]);
    expect(after1).toEqual([4, -2, -2]);
    expect(after2).toEqual([2, -1, -1]);
    expect(start, 'addRoundScores 不得改入参').toEqual([0, 0, 0]);
    expect(after1, 'addRoundScores 不得改上局累计').toEqual([4, -2, -2]);
    expect(after2[0] + after2[1] + after2[2], '零和局链 → 累计恒零和').toBe(0);
  });

  it('composeSessionRows：行序原样、delta/isLandlord 透传、total 按席位取', () => {
    const totals = addRoundScores([2, -1, -1], [4, -2, -2]); // → [6,-3,-3]
    const rows = composeSessionRows(
      [
        { seat: 0, score: 4, isLandlord: true },
        { seat: 1, score: -2, isLandlord: false },
        { seat: 2, score: -2, isLandlord: false },
      ],
      totals,
    );
    expect(rows).toEqual([
      { seat: 0, delta: 4, total: 6, isLandlord: true },
      { seat: 1, delta: -2, total: -3, isLandlord: false },
      { seat: 2, delta: -2, total: -3, isLandlord: false },
    ]);
  });

  it('乱序行：scores 行序 ≠ 席位序时 total 仍按 row.seat 对位（防按下标取错）', () => {
    const totals: SessionTotals = [6, -3, -3];
    const rows = composeSessionRows(
      [
        { seat: 2, score: -2, isLandlord: false },
        { seat: 0, score: 4, isLandlord: true },
        { seat: 1, score: -2, isLandlord: false },
      ],
      totals,
    );
    expect(rows.map((row) => row.seat)).toEqual([2, 0, 1]);
    expect(rows.map((row) => row.total)).toEqual([-3, 6, -3]);
    expect(rows.map((row) => row.delta)).toEqual([-2, 4, -2]);
  });

  it('滚动起点恒等式：total − delta ≡ 本局开始前累计（跨零滚动样例）', () => {
    const before: SessionTotals = [2, -1, -1];
    const scores: [number, number, number] = [-4, 2, 2];
    const totals = addRoundScores(before, scores); // → [-2,1,1]
    const rows = composeSessionRows(
      [
        { seat: 0, score: scores[0], isLandlord: true },
        { seat: 1, score: scores[1], isLandlord: false },
        { seat: 2, score: scores[2], isLandlord: false },
      ],
      totals,
    );
    for (const row of rows) {
      expect(row.total - row.delta, `席 ${row.seat} 滚动起点`).toBe(before[row.seat]);
    }
  });

  it('确定性：同入参两次调用深相等', () => {
    const scores = [
      { seat: 0, score: 4, isLandlord: true },
      { seat: 1, score: -2, isLandlord: false },
      { seat: 2, score: -2, isLandlord: false },
    ];
    const totals: SessionTotals = [4, -2, -2];
    expect(composeSessionRows(scores, totals)).toEqual(composeSessionRows(scores, totals));
    expect(addRoundScores(totals, [2, -1, -1])).toEqual(addRoundScores(totals, [2, -1, -1]));
  });
});
