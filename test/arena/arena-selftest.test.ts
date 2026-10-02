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
  judgeStrengthCI,
  roleOf,
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
  it('self 逐对漂移不能以正负抵消掩盖，缺失逐对证据也拒绝', () => {
    const summary = summarizeMirror(mirroredSet((seed) => (
      seed % 2 === 0 ? { newScore: 6, legacyScore: 2 } : { newScore: 2, legacyScore: 6 }
    )));
    expect(summary.avgPairedScoreDiff).toBe(0);
    expect(summary.mirrorWinRateDiffPp).toBe(0);
    expect(summary.selfMismatchPairs).toBe(12);
    expect(judgeSelftest(summary).pass).toBe(false);
    const identical = summarizeMirror(mirroredSet(() => ({ newScore: 2, legacyScore: 2 })));
    delete identical.selfMismatchPairs;
    expect(judgeSelftest(identical).pass).toBe(false);
  });

  it.each([
    { seed: NaN }, { seed: 0x1_0000_0000 }, { targetSeat: 3 }, { targetSide: 'other' },
    { targetScore: NaN }, { targetScore: Infinity }, { targetScore: 0 }, { landlord: 3 },
  ])('拒绝非法样本 %j', (overrides) => {
    const games = mirroredSet(() => ({ newScore: 2, legacyScore: -2 }));
    Object.assign(games[0]!, overrides);
    expect(() => summarizeMirror(games)).toThrow('Invalid arena game');
  });

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

/**
 * W-AI-R3（B0 立度量）新增判据自证：角色分层 + 配对 CI 门。
 * 预期**绿**（守护门）。── 负向变异自证 ──
 *   ① roleOf 把 (地主+1)%3 误判为 upper → 角色用例红；
 *   ② summarizeMirror 漏记 landlordSplitPairs 或按 split 对仍分层 → 分层用例红；
 *   ③ judgeStrengthCI 退化为只看点估（丢 CI 下界检查）→「点估过但 CI 挡住」用例红。
 */
function mirroredWithLandlord(
  perPair: (seed: number, seat: 0 | 1 | 2) => { newScore: number; legacyScore: number; landlord: 0 | 1 | 2; oldLandlord?: 0 | 1 | 2 },
): ArenaGame[] {
  const games: ArenaGame[] = [];
  for (let seed = 1; seed <= 4; seed += 1) {
    for (const seat of [0, 1, 2] as const) {
      const { newScore, legacyScore, landlord, oldLandlord } = perPair(seed, seat);
      games.push({ seed, targetSeat: seat, targetSide: 'new', targetScore: newScore, landlord });
      games.push({ seed, targetSeat: seat, targetSide: 'legacy', targetScore: legacyScore, landlord: oldLandlord ?? landlord });
    }
  }
  return games;
}

describe('W-AI-R3 竞技场角色分层 + 配对 CI 门', () => {
  it('按 seed 整组 bootstrap：同发牌增加完全相关席位不能缩窄 CI', () => {
    const allSeats = mirroredSet((seed) => seed <= 3
      ? { newScore: 2, legacyScore: -2 } : { newScore: -2, legacyScore: 2 });
    const oneSeat = summarizeMirror(allSeats.filter((game) => game.targetSeat === 0));
    const threeSeats = summarizeMirror(allSeats);
    expect(threeSeats.seedClusters).toBe(4);
    expect(threeSeats.ciMethod).toBe('seed-cluster-bootstrap');
    expect(threeSeats.avgPairedScoreDiffCI).toEqual(oneSeat.avgPairedScoreDiffCI);
    expect(threeSeats.mirrorWinRateDiffPpCI).toEqual(oneSeat.mirrorWinRateDiffPpCI);
    expect(summarizeMirror(allSeats.slice().reverse())).toEqual(threeSeats);
  });

  it('单 seed 无法给出发牌间 CI，不能因三席同胜而宣称显著增益', () => {
    const summary = summarizeMirror(mirroredSet(() => ({ newScore: 2, legacyScore: -2 }))
      .filter((game) => game.seed === 1));
    expect(summary.seedClusters).toBe(1);
    expect(summary.avgPairedScoreDiffCI).toBeUndefined();
    expect(judgeStrengthCI(summary, 0).pass).toBe(false);
  });

  it.each(['avgPairedScoreDiffCI', 'mirrorWinRateDiffPpCI'] as const)('CI 门拒绝缺失或非法 %s', (key) => {
    for (const ci of [undefined, { lo: NaN, hi: 4 }, { lo: 1, hi: Infinity }, { lo: 4, hi: 1 }]) {
      const summary = summarizeMirror(mirroredSet(() => ({ newScore: 2, legacyScore: -2 })));
      summary[key] = ci;
      expect(judgeStrengthCI(summary, 0).pass).toBe(false);
    }
  });

  it('仅一向有 landlord 不计入干净角色层', () => {
    const games = mirroredWithLandlord(() => ({ newScore: 2, legacyScore: -2, landlord: 0 }));
    for (const game of games) if (game.targetSide === 'legacy') delete game.landlord;
    expect(summarizeMirror(games).byRole).toBeUndefined();
  });

  it('roleOf：地主/下家((L+1)%3)/上家((L+2)%3) 精确', () => {
    expect(roleOf(0, 0)).toBe('landlord');
    expect(roleOf(1, 0)).toBe('lower');
    expect(roleOf(2, 0)).toBe('upper');
    expect(roleOf(0, 1)).toBe('upper');
    expect(roleOf(2, 1)).toBe('lower');
    expect(roleOf(1, 2)).toBe('upper');
  });

  it('byRole：两向同地主的干净对按角色分桶；两向异地主计入 landlordSplitPairs 且不分层', () => {
    // 全局地主=0：seat0→landlord、seat1→lower、seat2→upper，各 4 对，new 全胜(+2)。
    const clean = summarizeMirror(mirroredWithLandlord(() => ({ newScore: 2, legacyScore: -2, landlord: 0 })));
    expect(clean.landlordSplitPairs).toBe(0);
    const roles = Object.fromEntries((clean.byRole ?? []).map((r) => [r.role, r]));
    expect(roles.landlord.pairs).toBe(4);
    expect(roles.lower.pairs).toBe(4);
    expect(roles.upper.pairs).toBe(4);
    expect(roles.landlord.mirrorWinRateDiffPp).toBe(100);
    expect(roles.landlord.avgPairedScoreDiff).toBe(4);

    // 两向落不同地主（叫牌分叉）→ 全部对计 split，且不进任何角色桶。
    const split = summarizeMirror(mirroredWithLandlord(() => ({ newScore: 2, legacyScore: -2, landlord: 0, oldLandlord: 1 })));
    expect(split.landlordSplitPairs).toBe(12);
    expect(split.byRole ?? []).toEqual([]);
  });

  it('judgeStrengthCI：强正向(CI 下界>0)过；零差被挡；点估微正但高方差(CI 含 0)被挡而点估门放行', () => {
    const strong = summarizeMirror(mirroredWithLandlord(() => ({ newScore: 2, legacyScore: -2, landlord: 0 })));
    expect(strong.avgPairedScoreDiffCI!.lo).toBeGreaterThan(0);
    expect(judgeStrengthCI(strong, 0).pass).toBe(true);

    const zero = summarizeMirror(mirroredWithLandlord(() => ({ newScore: 2, legacyScore: 2, landlord: 0 })));
    expect(judgeStrengthCI(zero, 0).pass, '零差不得被判为增益').toBe(false);

    // 高方差微正：胜率各半(点估胜率差=0)、配对分差点估 >0，但 95% 配对 CI 下界 ≤0。
    // 点估门 judgeStrength(,0) 放行，CI 门 judgeStrengthCI 挡住——证明 CI 更严。
    const noisy = summarizeMirror(mirroredWithLandlord((seed, seat) => {
      const newWins = (seed + seat) % 2 === 0;
      const mag = newWins ? 20 : 18; // new 赢时 +20，输时 −18 → 均值微正、方差大
      return newWins
        ? { newScore: mag, legacyScore: -mag, landlord: 0 }
        : { newScore: -mag, legacyScore: mag, landlord: 0 };
    }));
    expect(noisy.avgPairedScoreDiff).toBeGreaterThan(0);
    expect(judgeStrength(noisy, 0).pass, '点估门在微正均值下放行').toBe(true);
    expect(noisy.avgPairedScoreDiffCI!.lo).toBeLessThanOrEqual(0);
    expect(judgeStrengthCI(noisy, 0).pass, 'CI 门挡住采样噪声级的微正').toBe(false);
  });
});
