/**
 * W-AI-R2 种子：提示会话失效矩阵（规划者预写红种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制到 test/ui/hint-session.test.ts（新建），独立 seed commit（R2a 棒）。
 * 实现目标：assets/scripts/ui/hint-flow.ts 判别式重写——
 *   HintSession{ key, hints, cursor }；key = String(deriveWorldSeed(snapshot, history))
 *   （复用 PIMC 规范串：turn/top/hand/history 任一变更 ⇒ key 变 ⇒ 会话失效重建）。
 *   轮换零重算：命中会话时第 2..N 按不得重跑 rankHintCandidates（榜单缓存于 session）。
 *
 * ── 契约 ──
 *   ① 失效矩阵：同局面同历史 → key 恒等（会话可复用）；turn/top/hand/history 各变一维 → key 必变；
 *   ② 过期会话（key 不匹配当前局面）→ 视同首按重建（返回 hints[0]，新 session.key=当前）；
 *   ③ 轮换回绕：cursor 沿榜单 (i+1)%N，session.hints 全程不变（引用同一榜单）；
 *   ④ 判别式封闭：kind ∈ {move, passAdvice, none}；kind=move 时 session.hints 非空且 cursor 有界。
 *
 * ── 预期红（对 R2 基线 main）── hint-flow 新签名/HintSession 未落 → 全文件红。
 * ── 负向变异自证（执行者实现后自查）──
 *   ① session.key 改用「手牌长度」弱键 → top 变更失效用例红。
 *   ② 过期会话继续沿旧榜单轮换 → 过期重建用例红。
 *   ③ 轮换时重跑 rankHintCandidates 并重排 → 榜单不变性用例红（引用/内容漂移）。
 */
import { describe, expect, it } from 'vitest';
import { pickHint, type HintSession } from '../../assets/scripts/ui/hint-flow';
import { deriveWorldSeed } from '../../assets/scripts/ai/pimc';
import { createPlayingRound, snapshot, type GameSnapshot } from '../../assets/scripts/game';
import { createRng, deal, recognize, type Card } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const keysOf = (list: Card[]): string => list.map((c) => `${c.rank}:${c.suit}`).sort().join(',');

function leadSnapshot(seed: number): GameSnapshot {
  return snapshot(createPlayingRound(deal(createRng(seed)), 0), 0);
}

function press(snap: GameSnapshot, selected: readonly Card[], session: HintSession | null) {
  return pickHint({ snapshot: snap, history: [], selected: [...selected], session });
}

describe('W-AI-R2 提示会话失效矩阵', () => {
  it('key 复用 deriveWorldSeed 规范串：同局面恒等；turn/top/hand/history 各变一维必变', () => {
    const base = leadSnapshot(3);
    const sameKey = String(deriveWorldSeed(base, []));
    expect(String(deriveWorldSeed(base, []))).toBe(sameKey);

    const turnChanged = { ...base, turn: 1 as const };
    expect(String(deriveWorldSeed(turnChanged, []))).not.toBe(sameKey);

    const topChanged = { ...base, top: { seat: 1 as const, pattern: recognize(cards('6'))! } };
    expect(String(deriveWorldSeed(topChanged, []))).not.toBe(sameKey);

    const handChanged = { ...base, viewerHand: base.viewerHand!.slice(1) };
    expect(String(deriveWorldSeed(handChanged, []))).not.toBe(sameKey);

    const historyChanged = deriveWorldSeed(base, [{ type: 'play', seat: 1, pattern: recognize(cards('6'))! }]);
    expect(String(historyChanged)).not.toBe(sameKey);
  });

  it('首按建会话：kind=move、session.key=当前局面键、cursor 有界、hints 非空 ≤6', () => {
    const snap = leadSnapshot(5);
    const verdict = press(snap, [], null);
    expect(verdict.kind).toBe('move');
    if (verdict.kind !== 'move') return;
    expect(verdict.session.key).toBe(String(deriveWorldSeed(snap, [])));
    expect(verdict.session.hints.length).toBeGreaterThan(0);
    expect(verdict.session.hints.length).toBeLessThanOrEqual(6);
    expect(verdict.session.cursor).toBeGreaterThanOrEqual(0);
    expect(verdict.session.cursor).toBeLessThan(verdict.session.hints.length);
    expect(keysOf(verdict.move.cards)).toBe(keysOf(verdict.session.hints[0].cards));
  });

  it('轮换回绕且榜单不变：连按 N+1 次回到首项，session.hints 内容全程一致（零重算面）', () => {
    const snap = leadSnapshot(7);
    const first = press(snap, [], null);
    expect(first.kind).toBe('move');
    if (first.kind !== 'move') return;
    const boardKeys = first.session.hints.map((m) => keysOf(m.cards));
    let session = first.session;
    let selected = first.move.cards;
    const seen: string[] = [keysOf(first.move.cards)];
    for (let press2 = 0; press2 < boardKeys.length; press2 += 1) {
      const next = press(snap, selected, session);
      expect(next.kind).toBe('move');
      if (next.kind !== 'move') return;
      expect(next.session.hints.map((m) => keysOf(m.cards)), '榜单在会话生命周期内不得漂移').toEqual(boardKeys);
      seen.push(keysOf(next.move.cards));
      session = next.session;
      selected = next.move.cards;
    }
    expect(seen[boardKeys.length], `轮满 ${boardKeys.length} 按后回绕首项`).toBe(seen[0]);
  });

  it('过期会话（局面已变）→ 视同首按重建，不沿旧榜单轮换', () => {
    const snapA = leadSnapshot(9);
    const first = press(snapA, [], null);
    expect(first.kind).toBe('move');
    if (first.kind !== 'move') return;

    const snapB = leadSnapshot(10); // 另一副牌：hand/top 全变 → key 必不匹配
    const stale = press(snapB, first.move.cards, first.session);
    expect(stale.kind).toBe('move');
    if (stale.kind !== 'move') return;
    expect(stale.session.key).toBe(String(deriveWorldSeed(snapB, [])));
    const freshFirst = press(snapB, [], null);
    expect(freshFirst.kind).toBe('move');
    if (freshFirst.kind !== 'move') return;
    expect(keysOf(stale.move.cards), '过期会话必须重建并给出新局面首选').toBe(keysOf(freshFirst.move.cards));
  });

  it('确定性：同入参（含会话）两次调用深相等', () => {
    const snap = leadSnapshot(11);
    const first = press(snap, [], null);
    expect(first).toEqual(press(snap, [], null));
    if (first.kind !== 'move') return;
    const second = press(snap, first.move.cards, first.session);
    expect(second).toEqual(press(snap, first.move.cards, first.session));
  });
});
