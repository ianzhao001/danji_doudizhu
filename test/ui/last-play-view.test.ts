import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  Category,
  Rank,
  Suit,
  type Card,
  type HandPattern,
} from '../../assets/scripts/rules';
import { type GameEvent, type SeatIndex } from '../../assets/scripts/game';
import { deriveLastActions } from '../../assets/scripts/ui/last-action-view';
import { deriveLastPlays } from '../../assets/scripts/ui/last-play-view';

function c(rank: Rank, suit: Suit = Suit.Spade): Card {
  return { rank, suit: rank >= Rank.SmallJoker ? Suit.Joker : suit };
}

function pattern(category: Category, cards: Card[], mainRank = cards[0].rank): HandPattern {
  return { category, mainRank, length: cards.length, cards };
}

function assertPlayRow(events: GameEvent[], seat: SeatIndex): void {
  const playEvent = events.find(
    (event): event is Extract<GameEvent, { type: 'play' }> =>
      event.type === 'play' && event.seat === seat,
  )!;
  const row = deriveLastPlays(events).find((item) => item.seat === seat)!;
  const textRow = deriveLastActions(events).find((item) => item.seat === seat)!;

  expect(row.kind).toBe('play');
  expect(row.cards).toBe(playEvent.pattern.cards);
  expect(row.cards).toEqual(playEvent.pattern.cards);
  expect(row.text).toBe(textRow.text);
}

describe('deriveLastPlays', () => {
  it('空事件流 → 三席 kind=null', () => {
    expect(deriveLastPlays([])).toEqual([
      { seat: 0, kind: null, cards: [], emphasis: null, text: '—' },
      { seat: 1, kind: null, cards: [], emphasis: null, text: '—' },
      { seat: 2, kind: null, cards: [], emphasis: null, text: '—' },
    ]);
  });

  it('恒返回长度 3、席序 0→2', () => {
    const rows = deriveLastPlays([
      { type: 'play', seat: 2, pattern: pattern(Category.Single, [c(Rank.A)]) },
    ]);
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.seat)).toEqual([0, 1, 2]);
  });

  it('单张：cards 与 pattern.cards 全等，text 与 deriveLastActions 一致', () => {
    assertPlayRow(
      [{ type: 'play', seat: 0, pattern: pattern(Category.Single, [c(Rank.K)]) }],
      0,
    );
  });

  it('对子：cards 与 pattern.cards 全等，text 与 deriveLastActions 一致', () => {
    assertPlayRow(
      [{
        type: 'play',
        seat: 1,
        pattern: pattern(Category.Pair, [c(Rank.Q), c(Rank.Q, Suit.Heart)], Rank.Q),
      }],
      1,
    );
  });

  it('顺子：cards 与 pattern.cards 全等，text 与 deriveLastActions 一致', () => {
    assertPlayRow(
      [{
        type: 'play',
        seat: 2,
        pattern: pattern(
          Category.Straight,
          [c(Rank.R3), c(Rank.R4), c(Rank.R5), c(Rank.R6), c(Rank.R7)],
          Rank.R7,
        ),
      }],
      2,
    );
  });

  it('三带一：cards 与 pattern.cards 全等，text 与 deriveLastActions 一致', () => {
    assertPlayRow(
      [{
        type: 'play',
        seat: 0,
        pattern: pattern(
          Category.TripsSingle,
          [c(Rank.R8), c(Rank.R8, Suit.Heart), c(Rank.R8, Suit.Club), c(Rank.R4)],
          Rank.R8,
        ),
      }],
      0,
    );
  });

  it('炸弹：play+bomb 相邻 → emphasis bomb、cards 4 张、text 炸弹', () => {
    const bombCards = [c(Rank.R7), c(Rank.R7, Suit.Heart), c(Rank.R7, Suit.Club), c(Rank.R7, Suit.Diamond)];
    const events: GameEvent[] = [
      { type: 'play', seat: 1, pattern: pattern(Category.Bomb, bombCards, Rank.R7) },
      { type: 'bomb', seat: 1 },
    ];
    const row = deriveLastPlays(events).find((r) => r.seat === 1)!;
    expect(row.kind).toBe('play');
    expect(row.cards).toHaveLength(4);
    expect(row.cards).toEqual(bombCards);
    expect(row.emphasis).toBe('bomb');
    expect(row.text).toBe('炸弹');
    expect(deriveLastActions(events).find((r) => r.seat === 1)!.text).toBe('炸弹');
  });

  it('火箭：play+rocket 相邻 → emphasis rocket、cards 2 张', () => {
    const rocketCards = [c(Rank.SmallJoker), c(Rank.BigJoker)];
    const events: GameEvent[] = [
      { type: 'play', seat: 0, pattern: pattern(Category.Rocket, rocketCards, Rank.BigJoker) },
      { type: 'rocket', seat: 0 },
    ];
    const row = deriveLastPlays(events).find((r) => r.seat === 0)!;
    expect(row.emphasis).toBe('rocket');
    expect(row.cards).toEqual(rocketCards);
    expect(row.text).toBe('火箭');
  });

  it('非相邻 bomb 不污染旧 play 的 emphasis', () => {
    const events: GameEvent[] = [
      { type: 'play', seat: 0, pattern: pattern(Category.Single, [c(Rank.R3)]) },
      { type: 'pass', seat: 1 },
      { type: 'bomb', seat: 0 },
    ];
    const row = deriveLastPlays(events).find((r) => r.seat === 0)!;
    expect(row.kind).toBe('play');
    expect(row.cards).toEqual([c(Rank.R3)]);
    expect(row.emphasis).toBeNull();
  });

  it('pass 覆盖旧 play', () => {
    const events: GameEvent[] = [
      { type: 'play', seat: 0, pattern: pattern(Category.Single, [c(Rank.K)]) },
      { type: 'pass', seat: 0 },
    ];
    const row = deriveLastPlays(events).find((r) => r.seat === 0)!;
    expect(row.kind).toBe('pass');
    expect(row.cards).toEqual([]);
    expect(row.text).toBe('不要');
  });

  it('reset 清空三席（注：deriveLastActions 忽略 reset，本函数按 spec 清空）', () => {
    const events: GameEvent[] = [
      { type: 'play', seat: 0, pattern: pattern(Category.Single, [c(Rank.K)]) },
      { type: 'play', seat: 1, pattern: pattern(Category.Single, [c(Rank.A)]) },
      { type: 'reset', leader: 0 },
    ];
    const rows = deriveLastPlays(events);
    expect(rows.every((row) => row.kind === null && row.cards.length === 0 && row.text === '—')).toBe(true);
  });

  it('入参数组与事件对象未被修改', () => {
    const events: GameEvent[] = [
      { type: 'play', seat: 0, pattern: pattern(Category.Single, [c(Rank.K)]) },
    ];
    const frozen = structuredClone(events);
    deriveLastPlays(events);
    expect(events).toEqual(frozen);
  });

  it('源码零 from \'cc\'', () => {
    const source = readFileSync(new URL('../../assets/scripts/ui/last-play-view.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/from\s+['"]cc['"]/);
  });
});
