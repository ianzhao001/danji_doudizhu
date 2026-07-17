/**
 * W-AI S14：竞技场判定谓词自证（规划者直落 main · 2026-07-17 · sota2）。
 * 纯函数单测：镜像汇总/强度门/自证门/弱桩门在合成数据上必须给出精确判定。
 * 预期**绿**（守护门）；负向自证内嵌（错向数据必须被各谓词拒绝）。
 */
import { describe, expect, it } from 'vitest';
import {
  judgeCrippledCaught,
  judgeSelftest,
  judgeStrength,
  summarizeMirror,
  type ArenaGame,
} from './arena-lib';

function mirroredSet(perPair: (seed: number, seat: 0 | 1 | 2) => { newScore: number; legacyScore: number }): ArenaGame[] {
  const games: ArenaGame[] = [];
  for (let seed = 1; seed <= 4; seed += 1) {
    for (const seat of [0, 1, 2] as const) {
      const { newScore, legacyScore } = perPair(seed, seat);
      games.push({ seed, targetSeat: seat, targetSide: 'new', targetScore: newScore });
      games.push({ seed, targetSeat: seat, targetSide: 'legacy', targetScore: legacyScore });
    }
  }
  return games;
}

describe('W-AI S14 竞技场判定谓词', () => {
  it('summarizeMirror：完整镜像集的胜率/差值精确（手算对照）', () => {
    // 12 对：new 赢 9 对（+2），legacy 赢 3 对（+2）——差 50pp，配对分差 (9*4-3*4)/12 = 2。
    let index = 0;
    const games = mirroredSet(() => {
      index += 1;
      return index <= 9 ? { newScore: 2, legacyScore: -2 } : { newScore: -2, legacyScore: 2 };
    });
    const summary = summarizeMirror(games);
    expect(summary.pairs).toBe(12);
    expect(summary.complete).toBe(true);
    expect(summary.newWinRate).toBe(0.75);
    expect(summary.legacyWinRate).toBe(0.25);
    expect(summary.mirrorWinRateDiffPp).toBe(50);
    expect(summary.avgPairedScoreDiff).toBe(2);
  });

  it('配对完整性：缺一向 / 重复一向 → complete=false 且强度门拒绝', () => {
    const games = mirroredSet(() => ({ newScore: 2, legacyScore: -2 }));
    const missing = games.slice(0, games.length - 1);
    const summaryMissing = summarizeMirror(missing);
    expect(summaryMissing.complete).toBe(false);
    expect(judgeStrength(summaryMissing, 8).pass).toBe(false);

    const duplicated = [...games, { ...games[0] }];
    expect(summarizeMirror(duplicated).complete).toBe(false);
  });

  it('强度门：达标通过、差值不足/分差非正给出可读理由', () => {
    const strong = summarizeMirror(mirroredSet(() => ({ newScore: 2, legacyScore: -2 })));
    expect(judgeStrength(strong, 8)).toEqual({ pass: true, reasons: [] });

    const tie = summarizeMirror(mirroredSet(() => ({ newScore: 2, legacyScore: 2 })));
    const verdict = judgeStrength(tie, 8);
    expect(verdict.pass).toBe(false);
    expect(verdict.reasons.join(' ')).toContain('镜像胜率差不足');
    expect(verdict.reasons.join(' ')).toContain('配对分差非正');
  });

  it('自证门：同引擎数据（逐对相等）通过；任何漂移拒绝', () => {
    const identical = summarizeMirror(mirroredSet((seed) => {
      const score = seed % 2 === 0 ? 2 : -2;
      return { newScore: score, legacyScore: score };
    }));
    expect(judgeSelftest(identical)).toEqual({ pass: true, reasons: [] });

    const drifted = summarizeMirror(mirroredSet((seed, seat) => {
      const score = seed % 2 === 0 ? 2 : -2;
      return { newScore: seed === 1 && seat === 0 ? score + 4 : score, legacyScore: score };
    }));
    expect(judgeSelftest(drifted).pass).toBe(false);
  });

  it('弱桩自证：明显更弱的目标必须被强度门抓住（gate 能抓弱）', () => {
    const crippled = summarizeMirror(mirroredSet(() => ({ newScore: -2, legacyScore: 2 })));
    expect(judgeCrippledCaught(crippled, 8)).toEqual({ pass: true, reasons: [] });

    const sneaky = summarizeMirror(mirroredSet(() => ({ newScore: 2, legacyScore: -2 })));
    expect(judgeCrippledCaught(sneaky, 8).pass, '弱桩若通过强度门=门自证失败').toBe(false);
  });
});
