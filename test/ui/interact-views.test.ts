import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deriveActionButtons } from '../../assets/scripts/ui/action-buttons';
import { deriveFollowUx } from '../../assets/scripts/ui/follow-ux';
import { dragSelectCards, layoutHandInteractive } from '../../assets/scripts/ui/hand-interaction';
import { sortByRank, sortForDisplay } from '../../assets/scripts/ui/selection';
import { GamePhase, Side, type GameSnapshot, type TopPlay } from '../../assets/scripts/game';
import { Rank, Suit, recognize, type Card } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const W = 390;
const cardWidth = 60;

function snap(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [3, 3, 3],
    winner: null,
    viewerHand: cards('5 9 K'),
    ...overrides,
  };
}

function top(spec: string, seat: 0 | 1 | 2 = 1): TopPlay {
  return { seat, pattern: recognize(cards(spec))! };
}

describe('deriveFollowUx mustPass', () => {
  it('领出回合 false', () => {
    expect(deriveFollowUx({ snapshot: snap({ turn: 0, top: null }) }).mustPass).toBe(false);
  });

  it('跟牌可压 false', () => {
    const snapshot = snap({ turn: 0, top: top('3'), viewerHand: cards('K') });
    expect(deriveFollowUx({ snapshot }).mustPass).toBe(false);
  });

  it('跟牌不可压 true', () => {
    const snapshot = snap({ turn: 0, top: top('K K'), viewerHand: cards('3 4 5') });
    expect(deriveFollowUx({ snapshot }).mustPass).toBe(true);
  });

  it('非 viewer 回合 false', () => {
    const snapshot = snap({ turn: 1, top: top('K K'), viewerHand: cards('3 4 5') });
    expect(deriveFollowUx({ snapshot, viewerSeat: 0 }).mustPass).toBe(false);
  });

  it('viewerHand 未提供时不抛错且按空手牌处理', () => {
    const snapshot = snap({ turn: 0, top: top('3'), viewerHand: undefined });
    expect(() => deriveFollowUx({ snapshot })).not.toThrow();
    expect(deriveFollowUx({ snapshot }).mustPass).toBe(true);
  });
});

describe('deriveFollowUx 与 deriveActionButtons 一致性', () => {
  it('mustPass===true 时 hint 为 false 且任意选牌 play 不可真', () => {
    const snapshot = snap({ turn: 0, top: top('2'), viewerHand: cards('3 4 5') });
    const follow = deriveFollowUx({ snapshot });
    expect(follow.mustPass).toBe(true);

    const buttons = deriveActionButtons({ snapshot, selectedCards: [], viewerSeat: 0 });
    expect(buttons.hint).toBe(false);

    for (const selected of [cards('3'), cards('4 5'), cards('3 4 5')]) {
      const withSelection = deriveActionButtons({ snapshot, selectedCards: selected, viewerSeat: 0 });
      expect(withSelection.play).toBe(false);
    }
  });

  it('另一组：大顺子压不住', () => {
    const snapshot = snap({
      turn: 0,
      top: top('9 10 J Q K'),
      viewerHand: cards('3 4 5'),
    });
    expect(deriveFollowUx({ snapshot }).mustPass).toBe(true);
    expect(deriveActionButtons({ snapshot, selectedCards: cards('3'), viewerSeat: 0 }).play).toBe(false);
    expect(deriveActionButtons({ snapshot, selectedCards: [], viewerSeat: 0 }).hint).toBe(false);
  });
});

describe('deriveFollowUx alerts', () => {
  it('单席报单', () => {
    const alerts = deriveFollowUx({ snapshot: snap({ handCounts: [1, 3, 3] }) }).alerts;
    expect(alerts).toEqual([{ seat: 0, kind: 'lastOne' }]);
  });

  it('单席报双', () => {
    const alerts = deriveFollowUx({ snapshot: snap({ handCounts: [3, 2, 3] }) }).alerts;
    expect(alerts).toEqual([{ seat: 1, kind: 'lastTwo' }]);
  });

  it('两席同时报（1+2）', () => {
    const alerts = deriveFollowUx({ snapshot: snap({ handCounts: [1, 2, 3] }) }).alerts;
    expect(alerts).toEqual([
      { seat: 0, kind: 'lastOne' },
      { seat: 1, kind: 'lastTwo' },
    ]);
  });

  it('0 张不报', () => {
    expect(deriveFollowUx({ snapshot: snap({ handCounts: [0, 3, 3] }) }).alerts).toEqual([]);
  });

  it('对局结束返回空', () => {
    const settled = snap({
      phase: GamePhase.Settled,
      winner: Side.Landlord,
      handCounts: [1, 2, 0],
    });
    expect(deriveFollowUx({ snapshot: settled }).alerts).toEqual([]);
  });
});

describe('dragSelectCards', () => {
  const hand: Card[] = [
    { rank: Rank.R3, suit: Suit.Spade },
    { rank: Rank.R5, suit: Suit.Heart },
    { rank: Rank.R7, suit: Suit.Club },
    { rank: Rank.K, suit: Suit.Diamond },
  ];

  function slots() {
    return layoutHandInteractive({ hand, selected: [], containerWidth: W, cardWidth, liftOffset: 10 });
  }

  it('正向/反向扫过同区间结果相等', () => {
    const s = slots();
    const left = s[0].x;
    const right = s[s.length - 1].x + (s[1].x - s[0].x);
    const forward = dragSelectCards(s, left, right);
    const backward = dragSelectCards(s, right, left);
    expect(backward).toEqual(forward);
  });

  it('单点等价单张命中', () => {
    const s = slots();
    const x = s[1].x + (s[2].x - s[1].x) / 2;
    expect(dragSelectCards(s, x, x)).toEqual([s[1].card]);
  });

  it('越界夹取', () => {
    const s = slots();
    const lastEnd = s[s.length - 1].x + (s[1].x - s[0].x);
    const all = dragSelectCards(s, -1000, 10000);
    const clamped = dragSelectCards(s, s[0].x, lastEnd);
    expect(all).toEqual(clamped);
  });

  it('区间落在缝隙外返回空', () => {
    const s = slots();
    const gapEnd = s[0].x - 1;
    expect(dragSelectCards(s, -50, gapEnd)).toEqual([]);
  });

  it('扫过全手牌返回全量且保持手牌序', () => {
    const s = slots();
    const lastEnd = s[s.length - 1].x + (s[1].x - s[0].x);
    const picked = dragSelectCards(s, s[0].x, lastEnd);
    expect(picked).toEqual(s.map((slot) => slot.card));
  });
});

describe('sortForDisplay', () => {
  const R3S = { rank: Rank.R3, suit: Suit.Spade };
  const R3H = { rank: Rank.R3, suit: Suit.Heart };
  const R5C = { rank: Rank.R5, suit: Suit.Club };
  const Kd = { rank: Rank.K, suit: Suit.Diamond };
  const smallJ = { rank: Rank.SmallJoker, suit: Suit.Joker };
  const bigJ = { rank: Rank.BigJoker, suit: Suit.Joker };
  const r2 = { rank: Rank.R2, suit: Suit.Spade };

  it('含双王+2+普通点的混合手降序正确', () => {
    const input = [R3S, bigJ, R5C, smallJ, Kd, r2, R3H];
    expect(sortForDisplay(input).map((c) => c.rank)).toEqual([
      Rank.BigJoker,
      Rank.SmallJoker,
      Rank.R2,
      Rank.K,
      Rank.R5,
      Rank.R3,
      Rank.R3,
    ]);
    expect(sortForDisplay(input)[5]).toEqual(R3H);
    expect(sortForDisplay(input)[6]).toEqual(R3S);
  });

  it('不改入参', () => {
    const input = [Kd, R3H, R5C];
    const frozen = [...input];
    sortForDisplay(input);
    expect(input).toEqual(frozen);
  });

  it('与 sortByRank 元素集合相等', () => {
    const input = [Kd, R3H, R5C, bigJ];
    const asc = sortByRank(input);
    const desc = sortForDisplay(input);
    expect(desc).toHaveLength(asc.length);
    for (const card of asc) {
      expect(desc.some((c) => c.rank === card.rank && c.suit === card.suit)).toBe(true);
    }
  });
});

describe('零 cc 护栏', () => {
  const files = [
    '../../assets/scripts/ui/follow-ux.ts',
    '../../assets/scripts/ui/hand-interaction.ts',
    '../../assets/scripts/ui/selection.ts',
  ];

  it.each(files)('%s 不含 from \'cc\'', (relativePath) => {
    const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
    expect(source).not.toMatch(/from\s+['"]cc['"]/);
  });
});
