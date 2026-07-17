import { describe, expect, it } from 'vitest';
import type { SeatIndex, TopPlay } from '../../assets/scripts/game';
import { Rank, Suit, recognize, type Card } from '../../assets/scripts/rules';
import { cardKey } from '../../assets/scripts/rules/guards';
import {
  deckOrigin,
  deriveCardStage,
  hasTableCards,
  seatOrigin,
  type CardStageCanvas,
  type DeriveCardStageArgs,
} from '../../assets/scripts/ui/card-stage';
import type { Rect } from '../../assets/scripts/ui/table-layout';
import { tableZones, type TableZones } from '../../assets/scripts/ui/table-zones';

const LANDSCAPE: readonly CardStageCanvas[] = [
  { width: 844, height: 390 },
  { width: 812, height: 375 },
  { width: 915, height: 412 },
  { width: 780, height: 360 },
];

const CARD_BOX = { width: 64, height: 90 } as const;
const LIFT = 18;

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

function topPlay(seat: SeatIndex, cards: Card[]): TopPlay {
  const pattern = recognize(cards);
  if (!pattern) throw new Error('test fixture must be a legal hand pattern');
  return { seat, pattern };
}

function stagePoint(canvas: CardStageCanvas, rect: Rect): { x: number; y: number } {
  return {
    x: rect.x + rect.width / 2 - canvas.width / 2,
    y: canvas.height / 2 - (rect.y + rect.height / 2),
  };
}

function screenPoint(canvas: CardStageCanvas, point: { x: number; y: number }): { x: number; y: number } {
  return {
    x: point.x + canvas.width / 2,
    y: canvas.height / 2 - point.y,
  };
}

function baseArgs(canvas: CardStageCanvas): DeriveCardStageArgs {
  return {
    zones: tableZones(canvas.width, canvas.height),
    canvas,
    heroSeat: 1,
    heroHand: [
      card(Rank.R10, Suit.Spade),
      card(Rank.R3, Suit.Heart),
      card(Rank.A, Suit.Club),
      card(Rank.R3, Suit.Spade),
    ],
    selected: new Set<string>(),
    top: topPlay(2, [card(Rank.R7, Suit.Diamond)]),
    bottomCards: [
      card(Rank.R4, Suit.Spade),
      card(Rank.R5, Suit.Heart),
      card(Rank.R6, Suit.Club),
    ],
    phase: 'playing',
    cardBox: CARD_BOX,
    liftOffset: LIFT,
  };
}

function expectFiniteStage(stage: ReturnType<typeof deriveCardStage>): void {
  for (const placement of stage.placements) {
    for (const value of [placement.x, placement.y, placement.scale, placement.angle, placement.z]) {
      expect(Number.isFinite(value), `${placement.key} placement contains a non-finite value`).toBe(true);
    }
    if (placement.spawnFrom) {
      for (const value of [
        placement.spawnFrom.x,
        placement.spawnFrom.y,
        placement.spawnFrom.scale,
        placement.spawnFrom.angle,
      ]) {
        expect(Number.isFinite(value), `${placement.key} spawnFrom contains a non-finite value`).toBe(true);
      }
    }
  }
  for (const hit of stage.handHits) {
    expect(Number.isFinite(hit.left)).toBe(true);
    expect(Number.isFinite(hit.right)).toBe(true);
    expect(hit.right).toBeGreaterThanOrEqual(hit.left);
  }
}

describe('W-VISION card-stage 纯几何岛', () => {
  it('table 占用只认真实桌牌：纯手牌/底牌为空，TopPlay 为非空', () => {
    const args = baseArgs(LANDSCAPE[0]);
    const noTable = deriveCardStage({ ...args, top: null });
    const withTable = deriveCardStage(args);

    expect(noTable.placements.some((placement) => placement.zone === 'hand')).toBe(true);
    expect(noTable.placements.some((placement) => placement.zone === 'bottom')).toBe(true);
    expect(hasTableCards(noTable)).toBe(false);
    expect(withTable.placements.some((placement) => placement.zone === 'table')).toBe(true);
    expect(hasTableCards(withTable)).toBe(true);
  });

  it('手牌按 rank 升序且同点保持输入顺序，命中区与手牌同序', () => {
    const stage = deriveCardStage({ ...baseArgs(LANDSCAPE[0]), top: null, bottomCards: null });
    const hand = stage.placements.filter((placement) => placement.zone === 'hand');
    const expected = [
      card(Rank.R3, Suit.Heart),
      card(Rank.R3, Suit.Spade),
      card(Rank.R10, Suit.Spade),
      card(Rank.A, Suit.Club),
    ].map(cardKey);

    expect(hand.map((placement) => placement.key)).toEqual(expected);
    expect(stage.handHits.map((hit) => hit.key)).toEqual(expected);
    for (let index = 1; index < hand.length; index += 1) {
      expect(hand[index].x).toBeGreaterThan(hand[index - 1].x);
    }
  });

  it('选中牌只增加 liftOffset，不改变其余手牌几何和 z', () => {
    const args = { ...baseArgs(LANDSCAPE[0]), top: null, bottomCards: null };
    const selectedCard = args.heroHand[1];
    const normal = deriveCardStage(args).byKey.get(cardKey(selectedCard))!;
    const lifted = deriveCardStage({ ...args, selected: new Set([cardKey(selectedCard)]) }).byKey.get(
      cardKey(selectedCard),
    )!;

    expect(normal.selected).toBe(false);
    expect(lifted.selected).toBe(true);
    expect(lifted.y - normal.y).toBeCloseTo(LIFT, 8);
    expect(lifted.x).toBe(normal.x);
    expect(lifted.scale).toBe(normal.scale);
    expect(lifted.angle).toBe(normal.angle);
    expect(lifted.z).toBe(normal.z);
  });

  it('TopPlay 依实际席位落到 hero/right/left 各自 dropZone，spawnFrom 来自对应视觉席', () => {
    const canvas = LANDSCAPE[0];
    const zones = tableZones(canvas.width, canvas.height);
    const heroSeat: SeatIndex = 1;
    const cases: Array<{ actual: SeatIndex; visual: SeatIndex; zone: Rect; originZone: Rect }> = [
      { actual: 1, visual: 0, zone: zones.dropZoneHero, originZone: zones.heroHandLarge },
      { actual: 2, visual: 1, zone: zones.dropZoneRight, originZone: zones.opponentRightBody },
      { actual: 0, visual: 2, zone: zones.dropZoneLeft, originZone: zones.opponentLeftBody },
    ];

    for (const { actual, visual, zone, originZone } of cases) {
      const played = card((Rank.R8 + actual) as Rank, Suit.Diamond);
      const stage = deriveCardStage({
        ...baseArgs(canvas),
        zones,
        heroSeat,
        heroHand: [],
        bottomCards: null,
        top: topPlay(actual, [played]),
      });
      const placement = stage.byKey.get(cardKey(played))!;
      const expected = stagePoint(canvas, zone);
      const screen = screenPoint(canvas, placement);

      expect(placement.zone).toBe('table');
      expect(placement.x).toBeCloseTo(expected.x, 8);
      expect(placement.y).toBeCloseTo(expected.y, 8);
      expect(screen.x).toBeGreaterThanOrEqual(zone.x);
      expect(screen.x).toBeLessThanOrEqual(zone.x + zone.width);
      expect(screen.y).toBeGreaterThanOrEqual(zone.y);
      expect(screen.y).toBeLessThanOrEqual(zone.y + zone.height);
      const expectedOrigin = stagePoint(canvas, originZone);
      expect(seatOrigin(zones, canvas, visual)).toEqual(expectedOrigin);
      expect(placement.spawnFrom).toMatchObject(expectedOrigin);
    }
  });

  it('多张 TopPlay 从 pattern.cards 全量落位，牌组中心仍对齐所属 dropZone', () => {
    const canvas = LANDSCAPE[0];
    const zones = tableZones(canvas.width, canvas.height);
    const played = [
      card(Rank.R9, Suit.Spade),
      card(Rank.R9, Suit.Heart),
      card(Rank.R9, Suit.Club),
      card(Rank.R9, Suit.Diamond),
      card(Rank.R10, Suit.Spade),
      card(Rank.R10, Suit.Heart),
      card(Rank.J, Suit.Spade),
      card(Rank.J, Suit.Heart),
    ];
    const stage = deriveCardStage({
      ...baseArgs(canvas),
      zones,
      heroHand: [],
      bottomCards: null,
      top: topPlay(1, played),
    });
    const table = stage.placements.filter((placement) => placement.zone === 'table');
    const expected = stagePoint(canvas, zones.dropZoneHero);

    expect(table.map((placement) => placement.key)).toEqual(played.map(cardKey));
    expect(table.reduce((sum, placement) => sum + placement.x, 0) / table.length).toBeCloseTo(expected.x, 8);
    expect(table.reduce((sum, placement) => sum + placement.y, 0) / table.length).toBeCloseTo(expected.y, 8);
    for (const placement of table) {
      const screen = screenPoint(canvas, placement);
      expect(screen.x).toBeGreaterThanOrEqual(zones.dropZoneHero.x);
      expect(screen.x).toBeLessThanOrEqual(zones.dropZoneHero.x + zones.dropZoneHero.width);
      expect(screen.y).toBeGreaterThanOrEqual(zones.dropZoneHero.y);
      expect(screen.y).toBeLessThanOrEqual(zones.dropZoneHero.y + zones.dropZoneHero.height);
    }
  });

  it('placements 全局按 z 严格递增，byKey 完整且指向同一 placement', () => {
    const stage = deriveCardStage(baseArgs(LANDSCAPE[0]));

    for (let index = 1; index < stage.placements.length; index += 1) {
      expect(stage.placements[index].z).toBeGreaterThan(stage.placements[index - 1].z);
    }
    expect(stage.byKey.size).toBe(stage.placements.length);
    for (const placement of stage.placements) {
      expect(stage.byKey.get(placement.key)).toBe(placement);
      expect(placement.key).toBe(cardKey(placement.card));
    }
  });

  it('底牌朝向和手牌交互性服从 phase，deal/reveal 来源为底牌托中心', () => {
    const canvas = LANDSCAPE[0];
    const args = { ...baseArgs(canvas), top: null };
    const bidding = deriveCardStage({ ...args, phase: 'bidding' });
    const playing = deriveCardStage({ ...args, phase: 'playing' });
    const origin = stagePoint(canvas, args.zones.bottomCardsDock);

    expect(deckOrigin(args.zones, canvas)).toEqual(origin);
    expect(bidding.placements.filter((placement) => placement.zone === 'bottom').every((p) => !p.faceUp)).toBe(true);
    expect(playing.placements.filter((placement) => placement.zone === 'bottom').every((p) => p.faceUp)).toBe(true);
    expect(bidding.placements.filter((placement) => placement.zone === 'hand').every((p) => !p.interactive)).toBe(true);
    expect(playing.placements.filter((placement) => placement.zone === 'hand').every((p) => p.interactive)).toBe(true);
    for (const placement of playing.placements.filter((item) => item.zone !== 'table')) {
      expect(placement.spawnFrom).toMatchObject(origin);
    }
  });

  it('同一物理牌遵循 table > hand > bottom，且 hand > bottom', () => {
    const canvas = LANDSCAPE[0];
    const duplicate = card(Rank.K, Suit.Heart);
    const args: DeriveCardStageArgs = {
      ...baseArgs(canvas),
      heroHand: [duplicate],
      selected: [],
      bottomCards: [duplicate],
      top: topPlay(1, [duplicate]),
    };

    const tableWins = deriveCardStage(args);
    expect(tableWins.placements).toHaveLength(1);
    expect(tableWins.byKey.get(cardKey(duplicate))?.zone).toBe('table');

    const handWins = deriveCardStage({ ...args, top: null });
    expect(handWins.placements).toHaveLength(1);
    expect(handWins.byKey.get(cardKey(duplicate))?.zone).toBe('hand');
    expect(handWins.handHits).toHaveLength(1);
  });

  for (const canvas of LANDSCAPE) {
    it(`${canvas.width}×${canvas.height} 输出有限且重复调用深相等`, () => {
      const args = baseArgs(canvas);
      const first = deriveCardStage(args);
      const second = deriveCardStage(args);

      expect(second).toEqual(first);
      expectFiniteStage(first);
    });
  }

  it('空输入稳定返回空 stage；非法尺寸与 liftOffset 拒绝产生 NaN', () => {
    const canvas = LANDSCAPE[0];
    const empty = deriveCardStage({
      ...baseArgs(canvas),
      heroHand: [],
      selected: [],
      top: null,
      bottomCards: null,
    });
    expect(empty.placements).toEqual([]);
    expect(empty.byKey.size).toBe(0);
    expect(empty.handHits).toEqual([]);

    expect(() => deriveCardStage({ ...baseArgs(canvas), canvas: { width: Number.NaN, height: canvas.height } })).toThrow();
    expect(() => deriveCardStage({ ...baseArgs(canvas), liftOffset: Number.POSITIVE_INFINITY })).toThrow();
  });
});
