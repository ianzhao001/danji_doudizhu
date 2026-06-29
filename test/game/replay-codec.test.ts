import { describe, expect, it } from 'vitest';
import { decodeReplay, encodeReplay, REPLAY_VERSION } from '../../assets/scripts/game/replay-codec';
import { Side, type GameEvent } from '../../assets/scripts/game';
import { Category, Rank, Suit, type Card, type HandPattern } from '../../assets/scripts/rules';

function c(rank: Rank, suit: Suit = Suit.Spade): Card {
  return { rank, suit: rank >= Rank.SmallJoker ? Suit.Joker : suit };
}

function pattern(category: Category, cards: Card[], mainRank = cards[0].rank): HandPattern {
  return { category, mainRank, length: cards.length, cards };
}

const events: GameEvent[] = [
  { type: 'play', seat: 0, pattern: pattern(Category.Single, [c(Rank.R3)]) },
  { type: 'pass', seat: 1 },
  { type: 'play', seat: 2, pattern: pattern(Category.Bomb, [c(Rank.R8), c(Rank.R8, Suit.Heart), c(Rank.R8, Suit.Club), c(Rank.R8, Suit.Diamond)], Rank.R8) },
  { type: 'bomb', seat: 2 },
  { type: 'play', seat: 0, pattern: pattern(Category.Rocket, [c(Rank.SmallJoker), c(Rank.BigJoker)], Rank.BigJoker) },
  { type: 'rocket', seat: 0 },
  { type: 'reset', leader: 0 },
  { type: 'win', seat: 0, side: Side.Landlord },
];

describe('replay codec', () => {
  it('round-trips event streams', () => {
    expect(decodeReplay(encodeReplay(events))).toEqual(events);
  });

  it('round-trips empty streams', () => {
    expect(decodeReplay(encodeReplay([]))).toEqual([]);
  });

  it('is deterministic', () => {
    expect(encodeReplay(events)).toBe(encodeReplay(events));
  });

  it('writes a versioned wire object', () => {
    expect(JSON.parse(encodeReplay([]))).toEqual({ version: REPLAY_VERSION, events: [] });
  });

  it('rejects malformed JSON and missing or unsupported versions', () => {
    expect(() => decodeReplay('{')).toThrow(/corrupted replay: invalid JSON/);
    expect(() => decodeReplay(JSON.stringify({ events: [] }))).toThrow(/corrupted replay: unsupported version/);
    expect(() => decodeReplay(JSON.stringify({ version: 999, events: [] }))).toThrow(/corrupted replay: unsupported version: 999/);
  });

  it('rejects malformed events', () => {
    const badEvents = [
      [null],
      [{ type: 'unknown', seat: 0 }],
      [{ type: 'pass', seat: 9 }],
      [{ type: 'win', seat: 1, side: 'x' }],
      [{ type: 'play', seat: 1 }],
      [{ type: 'play', seat: 1, pattern: { category: Category.Single, mainRank: Rank.R3, length: 2, cards: [c(Rank.R3)] } }],
    ];

    for (const bad of badEvents) {
      expect(() => decodeReplay(JSON.stringify({ version: REPLAY_VERSION, events: bad }))).toThrow(
        /corrupted replay: events contains invalid entry/,
      );
    }
  });

  it('rejects non-array events', () => {
    expect(() => decodeReplay(JSON.stringify({ version: REPLAY_VERSION, events: {} }))).toThrow(
      /corrupted replay: events must be an array/,
    );
  });
});
