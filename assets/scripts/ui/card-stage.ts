/**
 * W-VISION S2 card-stage geometry island.
 *
 * Coordinates use uiRoot's centred local space: screen x moves right, local y
 * moves up. The module is deliberately engine-free, but its output can be
 * written directly to Cocos transforms by S3.
 */

import type { SeatIndex, TopPlay } from '../game';
import type { Card } from '../rules';
import { cardKey } from '../rules/guards';
import { layoutHand } from './hand-layout';
import { sortByRank } from './selection';
import type { Rect } from './table-layout';
import type { TableZones } from './table-zones';

export type CardZone = 'hand' | 'table' | 'bottom' | 'offstage';
export type CardStagePhase = 'bidding' | 'playing' | 'settled' | 'disposed';

export interface CardPlacement {
  key: string;
  card: Card;
  zone: CardZone;
  x: number;
  y: number;
  scale: number;
  angle: number;
  z: number;
  faceUp: boolean;
  selected: boolean;
  interactive: boolean;
  spawnFrom: { x: number; y: number; scale: number; angle: number } | null;
}

export interface CardStage {
  /** Physical cards in ascending z order. */
  placements: readonly CardPlacement[];
  byKey: ReadonlyMap<string, CardPlacement>;
  /** Stage-local x hit intervals, ordered from the low hand rank. */
  handHits: readonly { key: string; left: number; right: number }[];
}

/** Presentation-safe table occupancy query; hand/bottom cards do not fill the play tray. */
export function hasTableCards(stage: CardStage): boolean {
  return stage.placements.some((placement) => placement.zone === 'table');
}

export interface CardStageCanvas {
  width: number;
  height: number;
}

export interface CardStageBox {
  width: number;
  height: number;
}

export interface DeriveCardStageArgs {
  zones: TableZones;
  canvas: CardStageCanvas;
  heroSeat: SeatIndex;
  heroHand: readonly Card[];
  selected: readonly Card[] | ReadonlySet<string>;
  top: TopPlay | null;
  bottomCards: readonly Card[] | null;
  phase: CardStagePhase;
  cardBox: CardStageBox;
  liftOffset: number;
}

interface PlacementCandidate {
  placement: CardPlacement;
  priority: number;
  handHit?: { key: string; left: number; right: number };
}

const BOTTOM_Z = 1_000;
const TABLE_Z = 2_000;
const HAND_Z = 3_000;
const BOTTOM_PRIORITY = 1;
const HAND_PRIORITY = 2;
const TABLE_PRIORITY = 3;

export function deriveCardStage(args: DeriveCardStageArgs): CardStage {
  validateArgs(args);

  const deck = deckOrigin(args.zones, args.canvas);
  const candidates = [
    ...bottomCandidates(args, deck),
    ...handCandidates(args, deck),
    ...tableCandidates(args),
  ];

  /*
   * bottomCards are public information and may also remain in the landlord's
   * hand or current trick. Those are visual references to one physical card,
   * not additional identities. Preserve cardKey's global uniqueness with the
   * physical priority table > hand > bottom. A persistent decorative bottom
   * copy belongs in S3's non-physical presentation layer, never in CardStage.
   */
  const chosen = new Map<string, PlacementCandidate>();
  for (const candidate of candidates) {
    const current = chosen.get(candidate.placement.key);
    if (!current || candidate.priority > current.priority) {
      chosen.set(candidate.placement.key, candidate);
    }
  }

  // Creator 3.8's project-script downlevel pass compiles `[...map.values()]`
  // as `[].concat(iterator)` instead of consuming the iterator. Array.from
  // keeps the pure result identical in Node and in the web-mobile bundle.
  const placements = Array.from(chosen.values())
    .map((candidate) => candidate.placement)
    .sort((a, b) => a.z - b.z);
  const byKey = new Map<string, CardPlacement>();
  for (const placement of placements) byKey.set(placement.key, placement);

  const handHits = candidates
    .filter((candidate) => candidate.priority === HAND_PRIORITY && candidate.handHit)
    .filter((candidate) => byKey.get(candidate.placement.key)?.zone === 'hand')
    .map((candidate) => candidate.handHit!);

  return { placements, byKey, handHits };
}

/**
 * Absolute visual-seat origin used by the current repository contract:
 * seat 0 = hero/bottom, seat 1 = right, seat 2 = left.
 */
export function seatOrigin(
  zones: TableZones,
  canvas: CardStageCanvas,
  seat: SeatIndex,
): { x: number; y: number } {
  if (seat === 0) return rectCenter(zones.heroHandLarge, canvas);
  if (seat === 1) return rectCenter(zones.opponentRightBody, canvas);
  return rectCenter(zones.opponentLeftBody, canvas);
}

/** The shared deal/reveal source at the centre of the three-card dock. */
export function deckOrigin(zones: TableZones, canvas: CardStageCanvas): { x: number; y: number } {
  return rectCenter(zones.bottomCardsDock, canvas);
}

function handCandidates(args: DeriveCardStageArgs, deck: { x: number; y: number }): PlacementCandidate[] {
  if (args.heroHand.length === 0) return [];

  const sorted = sortByRank([...args.heroHand]);
  const slots = layoutHand(sorted.length, {
    containerWidth: args.zones.heroHandLarge.width,
    cardWidth: args.cardBox.width,
  });
  const selectedKeys = selectionKeys(args.selected);
  const centreY = args.canvas.height / 2
    - (args.zones.heroHandLarge.y + args.zones.heroHandLarge.height / 2);

  return sorted.map((card, index) => {
    const key = cardKey(card);
    const selected = selectedKeys.has(key);
    const left = args.zones.heroHandLarge.x + slots[index].x - args.canvas.width / 2;
    const nextLeft = index + 1 < slots.length
      ? args.zones.heroHandLarge.x + slots[index + 1].x - args.canvas.width / 2
      : left + args.cardBox.width;
    return {
      priority: HAND_PRIORITY,
      placement: {
        key,
        card,
        zone: 'hand',
        x: left + args.cardBox.width / 2,
        y: centreY + (selected ? args.liftOffset : 0),
        scale: 1,
        angle: 0,
        z: HAND_Z + index,
        faceUp: true,
        selected,
        interactive: args.phase === 'playing',
        spawnFrom: { x: deck.x, y: deck.y, scale: 0.18, angle: 0 },
      },
      handHit: { key, left, right: nextLeft },
    };
  });
}

function bottomCandidates(
  args: DeriveCardStageArgs,
  deck: { x: number; y: number },
): PlacementCandidate[] {
  const cards = args.bottomCards ?? [];
  if (cards.length === 0) return [];

  const scale = clamp(args.zones.bottomCardsDock.height / args.cardBox.height, 0.3, 0.52);
  const step = Math.min(30, args.cardBox.width * scale + 2);
  const startX = deck.x - ((cards.length - 1) * step) / 2;

  return cards.map((card, index) => ({
    priority: BOTTOM_PRIORITY,
    placement: {
      key: cardKey(card),
      card,
      zone: 'bottom',
      x: startX + index * step,
      y: deck.y,
      scale,
      angle: 0,
      z: BOTTOM_Z + index,
      faceUp: args.phase !== 'bidding',
      selected: false,
      interactive: false,
      spawnFrom: { x: deck.x, y: deck.y, scale: 0.12, angle: 0 },
    },
  }));
}

function tableCandidates(args: DeriveCardStageArgs): PlacementCandidate[] {
  const cards = args.top?.pattern.cards ?? [];
  if (!args.top || cards.length === 0) return [];

  const visualSeat = relativeVisualSeat(args.top.seat, args.heroSeat);
  const zone = dropZoneForVisualSeat(args.zones, visualSeat);
  const geometry = tableCardGeometry(cards.length, zone, args.cardBox);
  const origin = seatOrigin(args.zones, args.canvas, visualSeat);

  return cards.map((card, index) => {
    const row = geometry.rows === 1 || index < geometry.cardsPerRow ? 0 : 1;
    const indexInRow = row === 0 ? index : index - geometry.cardsPerRow;
    const rowCount = row === 0
      ? Math.min(cards.length, geometry.cardsPerRow)
      : cards.length - geometry.cardsPerRow;
    const rowStartX = zone.x + zone.width / 2 - ((rowCount - 1) * geometry.step) / 2;
    const screenX = rowStartX + indexInRow * geometry.step;
    const screenY = zone.y + zone.height / 2
      + (geometry.rows === 1 ? 0 : (row === 0 ? -1 : 1) * geometry.rowSpacing / 2);
    const point = stagePoint(args.canvas, screenX, screenY);
    return {
      priority: TABLE_PRIORITY,
      placement: {
        key: cardKey(card),
        card,
        zone: 'table',
        x: point.x,
        y: point.y,
        scale: geometry.scale,
        angle: 0,
        z: TABLE_Z + index,
        faceUp: true,
        selected: false,
        interactive: false,
        spawnFrom: { x: origin.x, y: origin.y, scale: 1, angle: 0 },
      },
    };
  });
}

function tableCardGeometry(count: number, zone: Rect, cardBox: CardStageBox): {
  rows: 1 | 2;
  cardsPerRow: number;
  scale: number;
  step: number;
  rowSpacing: number;
} {
  const rows: 1 | 2 = count >= 8 ? 2 : 1;
  const cardsPerRow = Math.max(1, Math.ceil(count / rows));
  const heightScale = rows === 1
    ? zone.height / cardBox.height
    : (zone.height - 5) / (cardBox.height * 2);
  const scale = clamp(heightScale, 0.58, 0.94);
  const visualWidth = cardBox.width * scale;
  const visualHeight = cardBox.height * scale;
  const fittingStep = cardsPerRow <= 1 ? 0 : (zone.width - visualWidth) / (cardsPerRow - 1);
  const step = cardsPerRow <= 1 ? 0 : clamp(fittingStep, 8, visualWidth + 2);
  const rowSpacing = rows === 1 ? 0 : visualHeight + 5;
  return { rows, cardsPerRow, scale, step, rowSpacing };
}

function selectionKeys(selected: readonly Card[] | ReadonlySet<string>): Set<string> {
  if (Array.isArray(selected)) return new Set((selected as readonly Card[]).map(cardKey));
  return new Set(selected as ReadonlySet<string>);
}

function relativeVisualSeat(seat: SeatIndex, heroSeat: SeatIndex): SeatIndex {
  return ((seat - heroSeat + 3) % 3) as SeatIndex;
}

function dropZoneForVisualSeat(zones: TableZones, seat: SeatIndex): Rect {
  if (seat === 0) return zones.dropZoneHero;
  if (seat === 1) return zones.dropZoneRight;
  return zones.dropZoneLeft;
}

function rectCenter(rect: Rect, canvas: CardStageCanvas): { x: number; y: number } {
  const screenX = clamp(rect.x + rect.width / 2, 0, canvas.width);
  const screenY = clamp(rect.y + rect.height / 2, 0, canvas.height);
  return stagePoint(canvas, screenX, screenY);
}

function stagePoint(canvas: CardStageCanvas, screenX: number, screenY: number): { x: number; y: number } {
  return {
    x: screenX - canvas.width / 2,
    y: canvas.height / 2 - screenY,
  };
}

function validateArgs(args: DeriveCardStageArgs): void {
  positiveFinite(args.canvas.width, 'canvas.width');
  positiveFinite(args.canvas.height, 'canvas.height');
  positiveFinite(args.cardBox.width, 'cardBox.width');
  positiveFinite(args.cardBox.height, 'cardBox.height');
  if (!Number.isFinite(args.liftOffset) || args.liftOffset < 0) {
    throw new Error('deriveCardStage: liftOffset must be a non-negative finite number');
  }
}

function positiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`deriveCardStage: ${name} must be a positive finite number`);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
