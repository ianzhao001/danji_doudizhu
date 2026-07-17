/**
 * W-AI S9：着法枚举完备性守护门（规划者直落 main · 2026-07-17 · sota2）。
 * 吸收出处：kwai/DouZero(Apache-2.0) move_generator 的 14 牌型完备枚举法——
 * 以「全子集穷举 × recognize」为真值，校验 enumerateMoves 与识别器口径完全一致。
 * rules 层冻结：本文件纯测试零产品改动。预期**绿**（守护门）；
 * 负向自证（落库前规划者已执行）：临时从 enumerateMoves 删去四带两对分支 → 本门红。
 */
import { describe, expect, it } from 'vitest';
import { Rank, enumerateMoves, recognize, type Card } from '../../assets/scripts/rules';
import { cards } from './_util';

const RANK_TOKEN: Record<number, string> = {
  [Rank.R3]: '3', [Rank.R4]: '4', [Rank.R5]: '5', [Rank.R6]: '6', [Rank.R7]: '7',
  [Rank.R8]: '8', [Rank.R9]: '9', [Rank.R10]: '10', [Rank.J]: 'J', [Rank.Q]: 'Q',
  [Rank.K]: 'K', [Rank.A]: 'A', [Rank.R2]: '2', [Rank.SmallJoker]: 'x', [Rank.BigJoker]: 'X',
};

function rankKey(handCards: readonly Card[]): string {
  return handCards.map((card) => card.rank).sort((a, b) => a - b).join('.');
}

/** 全子多重集穷举（按点数计数域），返回每个非空子集的 rank 数组。 */
function allSubMultisets(hand: Card[]): number[][] {
  const counts = new Map<number, number>();
  for (const card of hand) counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
  const entries = [...counts.entries()].sort((a, b) => a[0] - b[0]);
  const out: number[][] = [];
  const walk = (index: number, picked: number[]): void => {
    if (index === entries.length) {
      if (picked.length > 0) out.push(picked.slice());
      return;
    }
    const [rank, available] = entries[index];
    for (let take = 0; take <= available; take += 1) {
      for (let i = 0; i < take; i += 1) picked.push(rank);
      walk(index + 1, picked);
      for (let i = 0; i < take; i += 1) picked.pop();
    }
  };
  walk(0, []);
  return out;
}

function materialize(ranks: number[]): Card[] {
  return cards(ranks.map((rank) => RANK_TOKEN[rank]).join(' '));
}

/** 真值集：全子集 × recognize 非空 → 该子多重集是一个合法着法。 */
function oracleMoveKeys(hand: Card[]): Set<string> {
  const keys = new Set<string>();
  for (const ranks of allSubMultisets(hand)) {
    const candidate = materialize(ranks);
    if (recognize(candidate)) keys.add(rankKey(candidate));
  }
  return keys;
}

const FIXTURES = [
  '3 3 3 3 4 4 5',        // 炸弹 / 四带二单 / 三带 / 对 / 单
  '3 3 3 4 4 4 5 6',      // 飞机±单翼 / 双三条 / 三带一二
  '10 J Q K A',           // 高位顺子
  'x X 2 2 3',            // 火箭 / 对2 / 单
  '3 3 4 4 5 5 6',        // 连对 / 拖不动的 445566? — 以 oracle 为准
  '2 2 2 3 3 3 4',        // 2 不入链：只有三条/三带，无飞机
  '3 4 5 6 7 8 9',        // 长顺子的全部子顺
] as const;

describe('W-AI S9 着法枚举完备性（DouZero 口径守护门）', () => {
  it('门自证：oracle 在微型手上给出精确真值（单/对/非法组合）', () => {
    const keys = oracleMoveKeys(cards('3 3 4'));
    expect(keys.has('3')).toBe(true);
    expect(keys.has('3.3')).toBe(true);
    expect(keys.has('4')).toBe(true);
    expect(keys.has('3.4')).toBe(false); // 非法组合不入真值
    expect(keys.has('3.3.4')).toBe(false);
    expect(keys.size).toBe(3);
  });

  for (const spec of FIXTURES) {
    it(`双向完备：enumerateMoves(${spec}) ≡ 全子集×recognize 真值`, () => {
      const hand = cards(spec);
      const oracle = oracleMoveKeys(hand);
      const enumerated = new Map<string, number>();
      for (const move of enumerateMoves(hand)) {
        const key = rankKey(move.cards);
        enumerated.set(key, (enumerated.get(key) ?? 0) + 1);
        expect(recognize(move.cards), `枚举产物必可识别: ${key}`).not.toBeNull();
      }
      const missing = [...oracle].filter((key) => !enumerated.has(key)).sort();
      const extra = [...enumerated.keys()].filter((key) => !oracle.has(key)).sort();
      expect(missing, `enumerateMoves 漏枚举: ${missing.join(' | ')}`).toEqual([]);
      expect(extra, `enumerateMoves 多枚举(识别器不认): ${extra.join(' | ')}`).toEqual([]);
      const duplicated = [...enumerated.entries()].filter(([, n]) => n > 1).map(([key]) => key);
      expect(duplicated, `同一点数组合重复枚举: ${duplicated.join(' | ')}`).toEqual([]);
    });
  }
});
