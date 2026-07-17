/**
 * W-AI S5 种子 v2：残局对抗精确解（规划者修订 · 2026-07-17 · sota2）。
 * 算法思想通用（negamax+置换表），不吸收 GPL 代码，自研 TS。
 *
 * ── v2 修订记录（Codex B1 阻断①②，实测纠错成立，规划者致谢并修订）──
 *   ① 旧夹具 L/预算夹具用 `3 3 3 2`：333+2 本身是合法三带一可**一手清完**；且即便不清手，
 *      单 2 无人能压 → 领 333 收官——该手对旧两池都是必胜，旧「非必胜」断言为契约夹具错误。
 *   ② 旧跟牌夹具 `2 2 5` 跟单 3：可先 5 顶上、双 2 轮流控权 → 必胜，旧断言同错。
 *   ③ oracle 行动域错误地限制了**我方**着法（≤3 同点），漏掉三带一等清手型——
 *      修正为「领出时任意合法牌型可整手清完（出完即胜）+ 其余行动限单/对/三域」。
 *   本文件六个真值已由规划者在 main 上以独立临时测试预验证（含两条纠错回归钉）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/ai/endgame-solver.test.ts，重发 seed commit 后继续 B1。
 * 实现目标：assets/scripts/ai/endgameSolver.ts ——
 *   solveForcedWin({ hand, unseenByRank, minOpponentHandCount, top, nodeBudget? })
 *     : { result: 'win' | 'unknown'; move: Move | null }
 *   模型（悲观 sound）：全部未见牌并成**单一对抗方**（能力 ⊇ 现实两对手任意配合）；
 *   败线：对抗方累计甩牌 ≥ minOpponentHandCount 即判我败（现实最短对手清手的上界代理）；
 *   我清手即胜（**出完即胜：最后一手无需不可压**）。nodeBudget 按展开状态数计（零时基），
 *   耗尽返回 'unknown'（'unknown' 不代表败，落回启发/PIMC）。
 *   与旧 chooseGuaranteedLead 的关系=**包裹**：旧 prover 先跑（保钉扎省预算），miss 才进本解算器。
 *
 * ── 夹具域纪律（solver-vs-oracle 对照的前提）──
 *   对照夹具的未见池一律「每点 ≤3 张、无成对双王」→ 池内无炸弹/火箭可组，
 *   且不-win 夹具池为纯单牌（对抗方任何生成器的有效牌力一致）——oracle 与更强对抗方等价，
 *   truth 不随实现的对抗方生成器强弱漂移。
 *
 * ── 独立 oracle ──
 *   内置 ~50 行穷举对抗器（单/对/三域 + 我方清手例外），对固定夹具给出真值；
 *   solveForcedWin 的判定必须与 oracle 一致（红先行的真值来源独立于实现）。
 *
 * ── 预期红（对 main，模块不存在）── 全文件红（6 用例）。对正确实现应全绿。
 *
 * ── 负向变异自证（执行者实现后自查，报告注明红几条）──
 *   ① 删掉败线（对抗方甩牌判负）→ 「346 领出非必胜」「337 跟牌非必胜」用例红。
 *   ② 解算器最后一手要求不可压（丢「出完即胜」）→ 夹具W/跟牌胜夹具用例红。
 *   ③ nodeBudget 不生效 → 预算用例红。
 */
import { describe, expect, it } from 'vitest';
import { Rank, enumerateMoves, legalFollows, recognize, validatePlay, type Card, type HandPattern } from '../../assets/scripts/rules';
import { solveForcedWin } from '../../assets/scripts/ai/endgameSolver';
import { toRankCounts } from '../../assets/scripts/ai/rollout';
import { cards } from '../rules/_util';

/* ───────────────── 独立 oracle（单/对/三域 + 清手例外，规划者已在 main 预验证）───────────────── */

type OracleTop = { size: number; rank: number } | null; // 单/对/三的简化 top；null=自由领出

function simpleTopOf(pattern: HandPattern | null): OracleTop {
  if (!pattern) return null;
  const size = pattern.cards.length;
  if (size > 3) throw new Error('oracle 只支持单/对/三域夹具');
  return { size, rank: pattern.mainRank };
}

/** 我方视角必胜判定：myHand 用真实 enumerateMoves；对抗方 = advCounts 任意单/对/三。 */
function oracleWin(
  myHand: Card[],
  advCounts: number[],
  shed: number,
  shedLimit: number,
  top: OracleTop,
  myTurn: boolean,
  memo: Map<string, boolean>,
): boolean {
  if (myHand.length === 0) return true;
  if (shed >= shedLimit) return false;
  const key = `${myHand.map((c) => c.rank).sort((a, b) => a - b).join('.')}|${advCounts.join('')}|${shed}|${top ? `${top.size}-${top.rank}` : 'L'}|${myTurn ? 1 : 0}`;
  const hit = memo.get(key);
  if (hit !== undefined) return hit;
  memo.set(key, false); // 防环占位（本域每两步必有进展，无真环，纯防御）

  let result: boolean;
  if (myTurn) {
    const moves = enumerateMoves(myHand).filter((move) => {
      if (!top && move.cards.length === myHand.length) return true; // 清手例外:出完即胜,任意合法牌型
      if (move.cards.length > 3) return false; // oracle 域:单/对/三
      if (move.cards.length >= 2 && !move.cards.every((c) => c.rank === move.cards[0].rank)) return false;
      if (!top) return true;
      return move.cards.length === top.size && move.pattern.mainRank > top.rank;
    });
    result = moves.some((move) => {
      const rest = myHand.slice();
      for (const card of move.cards) rest.splice(rest.findIndex((c) => c.rank === card.rank), 1);
      if (rest.length === 0) return true;
      return oracleWin(rest, advCounts, shed, shedLimit, { size: move.cards.length, rank: move.pattern.mainRank }, false, memo);
    });
    if (!result && top) {
      // 跟必败/跟不上 → 我过牌：对抗方获得领出权。
      result = oracleWin(myHand, advCounts, shed, shedLimit, null, false, memo);
    }
  } else {
    // 对抗方：可过（把领出权还给我，若它正跟我的 top）或出任意可行单/对/三（跟须压过 top）。
    // 我方必胜 = 对抗方所有选择下我都仍必胜。
    const options: Array<{ rank: number; size: number } | 'pass'> = [];
    if (top) options.push('pass');
    for (let rank = Rank.R3; rank <= Rank.BigJoker; rank += 1) {
      const available = advCounts[rank] ?? 0;
      for (let size = 1; size <= Math.min(3, available); size += 1) {
        if (top && (size !== top.size || rank <= top.rank)) continue;
        options.push({ rank, size });
      }
    }
    result = options.every((option) => {
      if (option === 'pass') return oracleWin(myHand, advCounts, shed, shedLimit, null, true, memo);
      const next = advCounts.slice();
      next[option.rank] -= option.size;
      return oracleWin(myHand, next, shed + option.size, shedLimit, { size: option.size, rank: option.rank }, true, memo);
    });
  }
  memo.set(key, result);
  return result;
}

function oracleVerdict(handSpec: string, unseenSpec: string, minOpp: number, topSpec: string | null): boolean {
  return oracleWin(
    cards(handSpec),
    toRankCounts(cards(unseenSpec)),
    0,
    minOpp,
    simpleTopOf(topSpec ? recognize(cards(topSpec))! : null),
    topSpec === null,
    new Map(),
  );
}

/* ───────────────────────────────── 契约用例 ───────────────────────────────── */

describe('W-AI S5v2 endgameSolver 残局对抗精确解', () => {
  it('oracle 自证：四夹具真值 + 两条执行者纠错回归钉（真值独立于实现）', () => {
    expect(oracleVerdict('3 3 3 2', '4 5 6 7', 4, null), '3332 领出必胜(333+2 一手清)').toBe(true);
    expect(oracleVerdict('3 4 6', '7 8', 2, null), '346 领出非必胜(对方两张全大于我)').toBe(false);
    expect(oracleVerdict('4 4 2', '5 6', 2, '3'), '442 跟单3 必胜(2 控权→44 清手)').toBe(true);
    expect(oracleVerdict('3 3 7', '8 9', 2, '6'), '337 跟单6 非必胜').toBe(false);
    // Codex B1 阻断纠错回归钉:旧夹具的真值确为「必胜」——契约错误不再复发。
    expect(oracleVerdict('3 3 3 2', '4 4 4 5', 2, null), '旧夹具L 真值=必胜(2 无人能压→333 清手)').toBe(true);
    expect(oracleVerdict('2 2 5', '6 7', 2, '3'), '旧跟牌夹具 真值=必胜(5 顶上,双 2 控权)').toBe(true);
  });

  it('一手清完直接判胜（出完即胜，含混合牌型三带一）：move 即整手', () => {
    const straight = solveForcedWin({
      hand: cards('3 4 5 6 7'), unseenByRank: toRankCounts(cards('9 9 K')), minOpponentHandCount: 3, top: null,
    });
    expect(straight.result).toBe('win');
    expect(straight.move).not.toBeNull();
    expect(straight.move!.cards).toHaveLength(5);
    expect(validatePlay(straight.move!.cards, null).ok).toBe(true);

    const tripsSingle = solveForcedWin({
      hand: cards('3 3 3 2'), unseenByRank: toRankCounts(cards('4 4 4 5')), minOpponentHandCount: 2, top: null,
    });
    expect(tripsSingle.result, '333+2 是合法三带一,一手清完必胜').toBe('win');
    expect(tripsSingle.move).not.toBeNull();
    expect(validatePlay(tripsSingle.move!.cards, null).ok).toBe(true);
  });

  it('夹具W：solver 判 win 且首着法合法可执行（与 oracle 一致）', () => {
    const hand = cards('3 3 3 2');
    const verdict = solveForcedWin({
      hand, unseenByRank: toRankCounts(cards('4 5 6 7')), minOpponentHandCount: 4, top: null,
    });
    expect(verdict.result).toBe('win');
    expect(verdict.move).not.toBeNull();
    expect(validatePlay(verdict.move!.cards, null).ok).toBe(true);
    const legal = new Set(enumerateMoves(hand).map((m) => m.cards.map((c) => c.rank).sort((a, b) => a - b).join('.')));
    expect(legal.has(verdict.move!.cards.map((c) => c.rank).sort((a, b) => a - b).join('.'))).toBe(true);
  });

  it('夹具L2（领出非必胜）：3 4 6 对 {7,8}·minOpp=2——oracle 判假,solver 不得谎报 win', () => {
    const verdict = solveForcedWin({
      hand: cards('3 4 6'), unseenByRank: toRankCounts(cards('7 8')), minOpponentHandCount: 2, top: null,
    });
    expect(verdict.result).not.toBe('win');
  });

  it('跟牌态双向：442 跟单3 必胜（须搜到 2 先控权的深线）；337 跟单6 非必胜', () => {
    const hand = cards('4 4 2');
    const top = recognize(cards('3'))!;
    const win = solveForcedWin({
      hand, unseenByRank: toRankCounts(cards('5 6')), minOpponentHandCount: 2, top,
    });
    expect(win.result).toBe('win');
    expect(win.move).not.toBeNull();
    const followKeys = new Set(legalFollows(hand, top).map((m) => m.cards.map((c) => c.rank).join('.')));
    expect(followKeys.has(win.move!.cards.map((c) => c.rank).join('.')), '首着法必须是合法跟牌').toBe(true);

    const lose = solveForcedWin({
      hand: cards('3 3 7'), unseenByRank: toRankCounts(cards('8 9')), minOpponentHandCount: 2,
      top: recognize(cards('6'))!,
    });
    expect(lose.result).not.toBe('win');
  });

  it('预算与确定性：搜索型夹具 nodeBudget=1 → unknown；同入参两跑深相等', () => {
    const starved = solveForcedWin({
      hand: cards('4 4 2'), unseenByRank: toRankCounts(cards('5 6')), minOpponentHandCount: 2,
      top: recognize(cards('3'))!, nodeBudget: 1,
    });
    expect(starved.result).toBe('unknown');
    expect(starved.move).toBeNull();

    const args = {
      hand: cards('4 4 2'), unseenByRank: toRankCounts(cards('5 6')), minOpponentHandCount: 2,
      top: recognize(cards('3'))!,
    };
    expect(solveForcedWin(args)).toEqual(solveForcedWin(args));
  });
});
