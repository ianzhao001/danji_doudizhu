/**
 * sota2-R4 B3 种子①（规划者预写红种子 · 2026-07-21 · sota2）：
 * ui/.../match-log-recorder 装配层——首个 playing persist 抓局面、每手幂等覆盖、结算落库、诊断配对。
 *
 * 落位：Codex 逐字节复制到 test/ui/match-log-recorder.test.ts，独立 seed commit（先红取证）。
 * 预期红（对当前 main，规划者已预验）：整文件红（match-log-recorder 模块不存在，import 失败）。
 *
 * 契约（B3 卡片同源）：
 *   - createMatchLogRecorder({storage, now, seed, resumed, difficulty, heroSeat})
 *     → { onPersist(payload), onSettled(finish), onDiag(draft) }。
 *   - onPersist：payload.round.phase===Playing && payload.events.length===0 视为开局快照
 *     （抓 initialHands/bottom/landlord/bidMultiplier/startedAt=now()）；此后每次全量覆盖 events。
 *   - onSettled：写一条 MatchLogEntry 落库（saveMatchLog）并清缓冲；重复调用不产生第二条。
 *   - onDiag：与下一次 persist 新增的 play/pass 事件配对，写 eventIndex。
 *
 * 负向变异自证（实现后逐条自查，报告注明红几条）：
 *   ① 开局快照改成"任意 persist 都重抓"→ 用例② 红（initialHands 被 later 状态污染）。
 *   ② onSettled 不清缓冲/重复落两条 → 用例③ 红。
 *   ③ 诊断 eventIndex 配错（用 persist 时全量长度而非新增事件位）→ 用例④ 红。
 */
import { describe, expect, it } from 'vitest';
import { createMatchLogRecorder } from '../../assets/scripts/ui/components/game-scene/match-log-recorder';
import { loadMatchLog } from '../../assets/scripts/data/match-log';
import { memoryStorage } from '../../assets/scripts/runtime/storage-adapter';
import { GamePhase, Side, type GameEvent, type SeatIndex } from '../../assets/scripts/game';
import { Category, Rank, Suit, type Card, type HandPattern } from '../../assets/scripts/rules';

function card(rank: Rank, suit: Suit = Suit.Spade): Card {
  return { rank, suit };
}

function singlePattern(c: Card): HandPattern {
  return { category: Category.Single, mainRank: c.rank, length: 1, cards: [c] };
}

const HANDS: [Card[], Card[], Card[]] = [
  [card(Rank.R3), card(Rank.R4)],
  [card(Rank.R5, Suit.Heart)],
  [card(Rank.R6, Suit.Club)],
];

function round(events: GameEvent[]): { round: unknown; heroSeat: SeatIndex; bidMultiplier: number; events: GameEvent[] } {
  return {
    round: {
      phase: GamePhase.Playing,
      landlord: 0 as SeatIndex,
      seats: HANDS.map((hand, index) => ({ index: index as SeatIndex, hand: hand.slice() })),
      turn: 0 as SeatIndex,
      top: null,
      passesInARow: 0,
      winner: null,
      bombsPlayed: 0,
      bottom: null,
    },
    heroSeat: 1 as SeatIndex,
    bidMultiplier: 2,
    events,
  };
}

const playEvent: GameEvent = { type: 'play', seat: 0, pattern: singlePattern(card(Rank.R3)) };

function makeRecorder(storage = memoryStorage()) {
  const recorder = createMatchLogRecorder({
    storage,
    now: () => 1_000,
    seed: 42,
    resumed: false,
    difficulty: 'hard',
    heroSeat: 1 as SeatIndex,
  });
  return { recorder, storage };
}

describe('sota2-R4 B3 对局记录装配层', () => {
  it('① 开局快照：首个 playing persist（events 空）抓三家初始手牌/倍数/seed', () => {
    const { recorder, storage } = makeRecorder();
    recorder.onPersist(round([]));
    recorder.onSettled({ settlement: { multiplier: 2, spring: 'none', bombs: 0, scores: [4, -2, -2] }, landlord: 0 as SeatIndex, winner: Side.Landlord });
    const saved = loadMatchLog(storage).entries[0]!;
    expect(saved.seed).toBe(42);
    expect(saved.heroSeat).toBe(1);
    expect(saved.bidMultiplier).toBe(2);
    expect(saved.initialHands[0]).toHaveLength(2);
    expect(saved.initialHands[1]).toHaveLength(1);
    expect(saved.startedAt).toBe(1_000);
  });

  it('② 每手幂等覆盖：events 全量覆盖，开局快照不被后续 persist 重抓', () => {
    const { recorder, storage } = makeRecorder();
    recorder.onPersist(round([]));
    recorder.onPersist(round([playEvent]));
    recorder.onPersist(round([playEvent, { type: 'pass', seat: 1 }]));
    recorder.onSettled({ settlement: { multiplier: 2, spring: 'none', bombs: 0, scores: [4, -2, -2] }, landlord: 0 as SeatIndex, winner: Side.Landlord });
    const saved = loadMatchLog(storage).entries[0]!;
    expect(saved.events).toHaveLength(2);
    expect(saved.initialHands[0]).toHaveLength(2); // 仍是开局态，不是出牌后的 round
  });

  it('③ 结算落库恰一条：重复 onSettled 不追加', () => {
    const { recorder, storage } = makeRecorder();
    recorder.onPersist(round([]));
    const finish = { settlement: { multiplier: 4, spring: 'none' as const, bombs: 1, scores: [8, -4, -4] as [number, number, number] }, landlord: 0 as SeatIndex, winner: Side.Landlord };
    recorder.onSettled(finish);
    recorder.onSettled(finish);
    const state = loadMatchLog(storage);
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0]!.settlement?.multiplier).toBe(4);
    expect(state.entries[0]!.finishedAt).toBe(1_000);
  });

  it('④ 诊断配对：onDiag 在先，随后 persist 新增事件下标写入 eventIndex', () => {
    const { recorder, storage } = makeRecorder();
    recorder.onPersist(round([]));
    recorder.onDiag({ seat: 0 as SeatIndex, path: 'lead-structural' });
    recorder.onPersist(round([playEvent]));
    recorder.onDiag({ seat: 1 as SeatIndex, path: 'structured-pass' });
    recorder.onPersist(round([playEvent, { type: 'pass', seat: 1 }]));
    recorder.onSettled({ settlement: { multiplier: 2, spring: 'none', bombs: 0, scores: [4, -2, -2] }, landlord: 0 as SeatIndex, winner: Side.Landlord });
    const saved = loadMatchLog(storage).entries[0]!;
    expect(saved.ai).toHaveLength(2);
    expect(saved.ai[0]).toMatchObject({ seat: 0, path: 'lead-structural', eventIndex: 0 });
    expect(saved.ai[1]).toMatchObject({ seat: 1, path: 'structured-pass', eventIndex: 1 });
  });

  it('⑤ resumed 标记透传（续局记录 seed 不可复现发牌，重放以 events 为准）', () => {
    const storage = memoryStorage();
    const recorder = createMatchLogRecorder({
      storage,
      now: () => 2_000,
      seed: 43,
      resumed: true,
      difficulty: 'normal',
      heroSeat: 0 as SeatIndex,
    });
    recorder.onPersist(round([]));
    recorder.onSettled({ settlement: { multiplier: 1, spring: 'none', bombs: 0, scores: [-2, 1, 1] }, landlord: 0 as SeatIndex, winner: Side.Farmer });
    expect(loadMatchLog(storage).entries[0]!.resumed).toBe(true);
  });
});
