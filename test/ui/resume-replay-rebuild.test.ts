/**
 * T-RESUME-REPLAY 失败测试（规划者种入·不可改）：断局恢复后三席"最近出牌"重建（BUG-03 可修部分）。
 * 契约见 coordination/tasks/T-RESUME-REPLAY.md（2026-07-07 规划者修订：重建收进纯岛 ui/resume-rebuild.ts）。
 * 规则钉死：
 *   新纯岛 `ui/resume-rebuild.ts` export `rebuildRecentEvents(events: GameEvent[]): FlowEvent[]`——
 *     把存档回放的 fullGameEvents 逐个包成 { type:'round', event } 并 slice(-12)（镜像 skeleton live 路径
 *     的 recentEvents 截断·game-scene-skeleton.ts:386），顺序保持；
 *   不伪造事件：输出只含 'round' 包装，不得出现 deal/bid/landlordDecided/bottomRevealed/settled
 *     （底牌保守牌背 = revealedBottomCards 保持 null·由 skeleton 接线 + 双层视觉预审截图验收·种子只钉纯变换）；
 *   消费等价：seats-renderer:261 的 round 解包 → deriveLastActions 链在重建输入上须给出与全量历史一致的
 *     三席末次动作（复用 last-action-view 纯函数·不重算规则）；
 *   skeleton 接线（恢复路径 this.recentEvents = rebuildRecentEvents(this.fullGameEvents)）由审查者逐行核 +
 *     视觉预审兜底——cc 组件不可入 vitest，故种子经动态 import 钉纯岛本体。
 * 今日红因：ui/resume-rebuild.ts 不存在 → 案例①②动态 import 失败；案例③为 deriveLastActions 既有语义绿锚。
 * 底牌面值恢复延后 = 用户裁决③（与叫抢存档一次升版），本任务不修、报告如实记录。
 */
import { describe, expect, it } from 'vitest';
import { deriveLastActions } from '../../assets/scripts/ui/last-action-view';
import { Category, Rank, Suit, type Card, type HandPattern } from '../../assets/scripts/rules';
import { Side, type GameEvent, type SeatIndex } from '../../assets/scripts/game';
import type { FlowEvent } from '../../assets/scripts/flow';

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

function single(rank: Rank): HandPattern {
  return { category: Category.Single, mainRank: rank, length: 1, cards: [card(rank, Suit.Spade)] };
}

function play(seat: SeatIndex, rank: Rank): GameEvent {
  return { type: 'play', seat, pattern: single(rank) };
}

function pass(seat: SeatIndex): GameEvent {
  return { type: 'pass', seat };
}

async function loadRebuild(): Promise<(events: GameEvent[]) => FlowEvent[]> {
  const mod = await import('../../assets/scripts/ui/resume-rebuild');
  return mod.rebuildRecentEvents;
}

/** 15 条真实形态历史：含被顶掉的旧动作、reset、炸弹伴随事件；末 12 条内三席均有动作。 */
function history15(): GameEvent[] {
  return [
    play(0, Rank.R5), // 旧动作·将被截断丢弃（第 -15 条）
    pass(1), //           旧动作·将被截断丢弃
    pass(2), //           旧动作·将被截断丢弃
    { type: 'reset', leader: 0 },
    play(0, Rank.R8), //  seat0 旧动作·后被 K 顶掉
    play(1, Rank.R10),
    play(2, Rank.J),
    play(0, Rank.K), //   seat0 末次 → 出 K
    pass(1),
    { type: 'play', seat: 2, pattern: { category: Category.Bomb, mainRank: Rank.R9, length: 4, cards: [card(Rank.R9, Suit.Spade), card(Rank.R9, Suit.Heart), card(Rank.R9, Suit.Diamond), card(Rank.R9, Suit.Club)] } },
    { type: 'bomb', seat: 2 }, // 炸弹伴随事件·seat2 末次 → 炸弹
    { type: 'reset', leader: 2 },
    pass(0), //           ——被 seat0 的 K 之后覆盖？否：此为 seat0 更晚动作 → seat0 末次实为 不要
    play(1, Rank.A), //   seat1 末次 → 出 A
    pass(0), //           seat0 末次 → 不要（第 -1 条）
  ];
}

describe('T-RESUME-REPLAY 恢复画面重建（纯岛 rebuildRecentEvents）', () => {
  it('① 结构：round 包装·顺序保持·slice(-12) 镜像 live 截断·空入空出', async () => {
    const rebuildRecentEvents = await loadRebuild();
    const history = history15();

    const rebuilt = rebuildRecentEvents(history);
    expect(rebuilt).toHaveLength(12);
    expect(rebuilt.every((e) => e.type === 'round')).toBe(true);
    // 顺序与内容 = 全量历史的末 12 条逐个包装（引用/深等均可·断言深等）
    expect(rebuilt.map((e) => (e.type === 'round' ? e.event : null))).toEqual(history.slice(-12));

    expect(rebuildRecentEvents([])).toEqual([]);
    // 少于 12 条则全量包装
    expect(rebuildRecentEvents(history.slice(0, 3))).toHaveLength(3);
  });

  it('② 消费等价 + 不伪造：解包→deriveLastActions 三席末次与全量一致；无动作席位守 "—"；零非 round 事件', async () => {
    const rebuildRecentEvents = await loadRebuild();
    const history = history15();

    // seats-renderer.ts:261 消费镜像：round 解包后交 deriveLastActions
    const unwrap = (events: FlowEvent[]): GameEvent[] =>
      events.flatMap((event) => (event.type === 'round' ? [event.event] : []));

    const rows = deriveLastActions(unwrap(rebuildRecentEvents(history)));
    expect(rows).toEqual(deriveLastActions(history)); // 与全量历史推导一致（钉截断不丢三席末次）
    expect(rows).toEqual([
      { seat: 0, text: '不要' },
      { seat: 1, text: '出 A' },
      { seat: 2, text: '炸弹' },
    ]);

    // 不伪造：seat1 从未动作的稀疏历史 → '—'（不得无中生有）；输出零 deal/bottomRevealed/settled/bid
    const sparse: GameEvent[] = [play(0, Rank.R6), { type: 'reset', leader: 0 }, play(2, Rank.Q)];
    const sparseRebuilt = rebuildRecentEvents(sparse);
    expect(sparseRebuilt.some((e) => e.type !== 'round')).toBe(false);
    expect(deriveLastActions(unwrap(sparseRebuilt))).toEqual([
      { seat: 0, text: '出 6' },
      { seat: 1, text: '—' },
      { seat: 2, text: '出 Q' },
    ]);
  });

  it('③ 绿锚：deriveLastActions 既有语义零改动（末次覆盖·reset/win 跳过·缺席 "—"）——复用目标钉死', () => {
    const rows = deriveLastActions([
      play(0, Rank.R7),
      pass(1),
      { type: 'reset', leader: 0 }, // 跳过·不算动作
      play(0, Rank.R2), //             覆盖 seat0 旧动作
      { type: 'win', seat: 0, side: Side.Landlord }, // 跳过·不算动作
    ]);
    expect(rows).toEqual([
      { seat: 0, text: '出 2' },
      { seat: 1, text: '不要' },
      { seat: 2, text: '—' },
    ]);
  });
});
