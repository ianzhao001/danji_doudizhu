import { describe, it, expect } from 'vitest';
import { Side, type GameEvent } from '../../assets/scripts/game';
import { buildTricks } from '../../assets/scripts/game/trick-replay';
import { Category, Rank, Suit } from '../../assets/scripts/rules';

const pattern = {
  category: Category.Single,
  mainRank: Rank.R3,
  length: 1,
  cards: [{ rank: Rank.R3, suit: Suit.Spade }],
};

describe('M6-L11 buildTricks', () => {
  it('returns empty array for no events', () => {
    expect(buildTricks([])).toEqual([]);
  });

  it('groups a single trick and marks win seat at the end', () => {
    const tricks = buildTricks([
      { type: 'play', seat: 0, pattern },
      { type: 'pass', seat: 1 },
      { type: 'pass', seat: 2 },
      { type: 'win', seat: 0, side: Side.Landlord },
    ]);
    expect(tricks).toEqual([
      {
        index: 0,
        leader: 0,
        plays: [
          { seat: 0, kind: 'play' },
          { seat: 1, kind: 'pass' },
          { seat: 2, kind: 'pass' },
        ],
        winnerSeat: 0,
      },
    ]);
  });

  it('splits tricks on reset and uses reset.leader for the next trick', () => {
    const events: GameEvent[] = [
      { type: 'play', seat: 0, pattern },
      { type: 'pass', seat: 1 },
      { type: 'pass', seat: 2 },
      { type: 'reset', leader: 0 },
      { type: 'play', seat: 0, pattern },
      { type: 'pass', seat: 1 },
    ];
    const tricks = buildTricks(events);
    expect(tricks.map((trick) => trick.leader)).toEqual([0, 0]);
    expect(tricks[0].winnerSeat).toBe(0);
    expect(tricks[1].winnerSeat).toBeNull();
  });

  it('keeps bomb and rocket plays inside their trick', () => {
    const tricks = buildTricks([
      { type: 'play', seat: 0, pattern },
      { type: 'bomb', seat: 1 },
      { type: 'rocket', seat: 2 },
    ]);
    expect(tricks[0].plays.map((play) => play.kind)).toEqual(['play', 'bomb', 'rocket']);
  });

  it('is deterministic and does not mutate input events', () => {
    const events: GameEvent[] = [{ type: 'pass', seat: 1 }];
    const before = JSON.parse(JSON.stringify(events));
    expect(buildTricks(events)).toEqual(buildTricks(events));
    expect(events).toEqual(before);
  });
});
