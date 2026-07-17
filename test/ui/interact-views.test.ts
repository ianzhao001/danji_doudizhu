import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deriveActionButtons } from '../../assets/scripts/ui/action-buttons';
import { deriveFollowUx } from '../../assets/scripts/ui/follow-ux';
import {
  dragSelectCards,
  dragSelectCardsFromOrigin,
  layoutHandInteractive,
} from '../../assets/scripts/ui/hand-interaction';
import {
  applyDragSelection,
  dragSelectionModeFromCard,
  sortByRank,
  sortForDisplay,
} from '../../assets/scripts/ui/selection';
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
    const right = s[s.length - 1].hitRight;
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
    const lastEnd = s[s.length - 1].hitRight;
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
    const lastEnd = s[s.length - 1].hitRight;
    const picked = dragSelectCards(s, s[0].x, lastEnd);
    expect(picked).toEqual(s.map((slot) => slot.card));
  });
});

describe('dragSelectCards 4b（裁定新增）', () => {
  it('重叠态末张右半区命中：20 张/390/60 扫 x=380 命中末张', () => {
    const hand = cards('3 4 5 6 7 8 9 10 J Q K A 2 3 4 5 6 7 8 9');
    expect(hand).toHaveLength(20);
    const s = layoutHandInteractive({
      hand,
      selected: [],
      containerWidth: 390,
      cardWidth: 60,
      liftOffset: 10,
    });
    const last = s[s.length - 1];
    expect(last.hitRight).toBeCloseTo(390, 5);
    expect(dragSelectCards(s, 380, 380)).toEqual([last.card]);
  });

  it('单张手牌左右越界不命中（x=1e6 返回空）', () => {
    const hand = cards('K');
    const s = layoutHandInteractive({
      hand,
      selected: [],
      containerWidth: 390,
      cardWidth: 60,
      liftOffset: 10,
    });
    expect(dragSelectCards(s, 1e6, 1e6)).toEqual([]);
  });

  it('hitRight 契约：非末张=下一张 x，末张=自身 x+cardWidth', () => {
    const hand = cards('3 4 5 6 7');
    const s = layoutHandInteractive({
      hand,
      selected: [],
      containerWidth: 390,
      cardWidth: 60,
      liftOffset: 10,
    });
    for (let index = 0; index < s.length - 1; index += 1) {
      expect(s[index].hitRight).toBe(s[index + 1].x);
    }
    const last = s[s.length - 1];
    expect(last.hitRight).toBeCloseTo(last.x + 60, 5);
  });
});

describe('W-VISION S5 划选模式在手势起点锁定', () => {
  const hand = cards('3 5 7 K');

  function slots(selectedSpec: string) {
    return layoutHandInteractive({
      hand,
      selected: cards(selectedSpec),
      containerWidth: W,
      cardWidth,
      liftOffset: 10,
    });
  }

  it('抬升牌与右邻水平重叠时，仍按真实 TOUCH_START 牌锁 remove 并包含起手牌', () => {
    const denseHand = cards('3 4 5 6 7 8 9 10 J Q K A 2 3 4 5 6 7 8 9');
    const base = layoutHandInteractive({
      hand: denseHand,
      selected: [],
      containerWidth: W,
      cardWidth,
      liftOffset: 10,
    });
    const initial = [base[5].card, base[6].card, base[7].card];
    const s = layoutHandInteractive({
      hand: denseHand,
      selected: initial,
      containerWidth: W,
      cardWidth,
      liftOffset: 10,
    });
    const origin = s[5].card;
    const overlapX = s[7].x + 0.1;

    // 20 张牌确实重叠：origin 的 60px 实体延伸进右二邻槽。
    expect(origin).toEqual(base[5].card);
    expect(s[5].x + cardWidth).toBeGreaterThan(overlapX);
    // 旧的 raw-x 锚会误吃右邻；新 helper 只选 origin 向左真实经过的 i3..i5。
    expect(dragSelectCards(s, overlapX, s[3].x)).toContainEqual(s[7].card);
    const dragged = dragSelectCardsFromOrigin(s, origin, s[3].x);
    const mode = dragSelectionModeFromCard(initial, origin);

    expect(mode).toBe('remove');
    expect(dragged).toEqual(s.slice(3, 6).map((slot) => slot.card));
    expect(applyDragSelection(initial, dragged, mode)).toEqual([s[6].card, s[7].card]);
  });

  it('未选牌起手固定 add；正反扫都保留既有选择', () => {
    const s = slots('7');
    const initial = [s[2].card];
    const mode = dragSelectionModeFromCard(initial, s[1].card);

    const right = applyDragSelection(
      initial,
      dragSelectCardsFromOrigin(s, s[1].card, s[3].hitRight),
      mode,
    );
    const left = applyDragSelection(
      initial,
      dragSelectCardsFromOrigin(s, s[1].card, s[0].x),
      mode,
    );

    expect(mode).toBe('add');
    expect(right).toEqual([s[2].card, s[1].card, s[3].card]);
    expect(left).toEqual([s[2].card, s[0].card, s[1].card]);
  });

  it('最薄 wiring：card-node 传真实牌；settle 保留起手牌；cancel 不结算', () => {
    const source = readFileSync(
      new URL('../../assets/scripts/ui/components/game-scene/play-area-renderer.ts', import.meta.url),
      'utf8',
    );
    const cardNode = readFileSync(
      new URL('../../assets/scripts/ui/components/game-scene/card-node.ts', import.meta.url),
      'utf8',
    );
    const cancelBody = source.match(/this\.onHandDragCancel = \(\) => \{([\s\S]*?)\n  \};/)?.[1] ?? '';

    expect(cardNode).toContain('this.onHandDragStart?.(event, card);');
    expect(source).toContain('this.onHandDragStart = (event: EventTouch, card: Card) => {');
    expect(source).toContain('const mode = dragSelectionModeFromCard(this.selected, card);');
    expect(source).toContain('this.handDragMode = mode;');
    expect(source).toContain('this.handDragOriginCard = card;');
    expect(source).toContain('const dragged = dragSelectCardsFromOrigin(slots, originCard, currentX);');
    expect(source).toContain('this.selected = applyDragSelection(this.selected, dragged, mode);');
    expect(cancelBody).toContain('clearHandDrag();');
    expect(cancelBody).not.toContain('settleHandDrag');
    expect(cancelBody).not.toContain('applyDragSelection');
    expect(source).not.toContain('submitPlay');
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
    expect(sortForDisplay(input)[5]).toEqual(R3S);
    expect(sortForDisplay(input)[6]).toEqual(R3H);
  });

  it('同点数内保持 sortByRank 稳定序不反转', () => {
    expect(sortForDisplay([R3S, R3H, R5C])).toEqual([R5C, R3S, R3H]);
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
