import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  Category,
  Rank,
  Suit,
  type Card,
  type HandPattern,
} from '../../assets/scripts/rules';
import { Side, type GameEvent } from '../../assets/scripts/game';
import { deriveLastActions } from '../../assets/scripts/ui/last-action-view';
import { deriveLastPlays } from '../../assets/scripts/ui/last-play-view';

function c(rank: Rank, suit: Suit = Suit.Spade): Card {
  return { rank, suit: rank >= Rank.SmallJoker ? Suit.Joker : suit };
}

function pattern(category: Category, cards: Card[], mainRank = cards[0].rank): HandPattern {
  return { category, mainRank, length: cards.length, cards };
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

  it('单/对/顺子/三带一：cards 与 pattern.cards 全等，text 与 deriveLastActions 一致', () => {
    const cases: GameEvent[] = [
      { type: 'play', seat: 0, pattern: pattern(Category.Single, [c(Rank.K)]) },
      { type: 'play', seat: 1, pattern: pattern(Category.Pair, [c(Rank.Q), c(Rank.Q, Suit.Heart)], Rank.Q) },
      {
        type: 'play',
        seat: 2,
        pattern: pattern(
          Category.Straight,
          [c(Rank.R3), c(Rank.R4), c(Rank.R5), c(Rank.R6), c(Rank.R7)],
          Rank.R7,
        ),
      },
      {
        type: 'play',
        seat: 0,
        pattern: pattern(Category.TripsSingle, [c(Rank.R8), c(Rank.R8, Suit.Heart), c(Rank.R8, Suit.Club), c(Rank.R4)], Rank.R8),
      },
    ];

    const plays = deriveLastPlays(cases);
    const texts = deriveLastActions(cases);

    for (const row of plays) {
      const textRow = texts.find((t) => t.seat === row.seat)!;
      expect(row.text).toBe(textRow.text);
    }

    const single = plays.find((row) => row.seat === 0)!;
    expect(single.kind).toBe('play');
    expect(single.cards).toBe(cases[3].type === 'play' ? cases[3].pattern.cards : []);
    expect(single.cards).toEqual(cases[3].type === 'play' ? cases[3].pattern.cards : []);

    const pair = plays.find((row) => row.seat === 1)!;
    expect(pair.cards).toEqual((cases[1] as Extract<GameEvent, { type: 'play' }>).pattern.cards);

    const straight = plays.find((row) => row.seat === 2)!;
    expect(straight.cards).toEqual((cases[2] as Extract<GameEvent, { type: 'play' }>).pattern.cards);
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
