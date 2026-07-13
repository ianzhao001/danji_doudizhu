import { EventTouch, Sprite } from 'cc';
import type { SeatIndex, TopPlay } from '../../../game';
import type { Card } from '../../../rules';
import { cardKey } from '../../../rules/guards';
import { dealCardDelay, dealFlight } from '../../animation-params';
import { dragSelectCards, layoutHandInteractive, type InteractiveSlot } from '../../hand-interaction';
import { isSelected, sortByRank } from '../../selection';
import { deriveScreenVM } from '../../screen-view';
import { t } from '../../strings';
import type { Rect } from '../../table-layout';
import type { TableZones } from '../../table-zones';
import { RESOURCE_PATHS } from '../../asset-keys';
import { THEME, addUiTransform, toColor } from '../ui-helpers';
import { dropZoneForSeat, visualSideForSeat } from './seat-display';
import { CARD_SIZE, HAND_LIFT, cardsSignature } from './card-node';

const HERO_SEAT: SeatIndex = 0;
const TABLE_TEXT = toColor(THEME.palette.tableFelt);
const GAME_TEXT = {
  playerHand: t('tutorial.playerHand'),
};

interface PlayAreaLayout {
  screenX: number;
  screenY: number;
  width: number;
  height: number;
  rows: number;
  cardsPerRow: number;
  cardScale: number;
  spacing: number;
  rowSpacing: number;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function layoutDisplayHandSlots(args: {
  hand: Card[];
  selected: Card[];
  containerWidth: number;
  cardWidth: number;
  liftOffset: number;
}): InteractiveSlot[] {
  // V8 用户签收意见①（2026-07-11）：手牌左→右依次增大（升序，王最右）——覆盖第一波降序判断。
  // sortForDisplay（降序）保留导出与测试，仅此处不再消费。
  const sortedHand = sortByRank(args.hand);
  const geometrySlots = layoutHandInteractive({
    hand: sortedHand,
    selected: [],
    containerWidth: args.containerWidth,
    cardWidth: args.cardWidth,
    liftOffset: args.liftOffset,
  });
  return sortedHand.map((card, index) => {
    const selected = isSelected(args.selected, card);
    return {
      card,
      x: geometrySlots[index].x,
      y: selected ? -args.liftOffset : 0,
      selected,
      hitRight: geometrySlots[index].hitRight,
    };
  });
}

export function handLocalXFromTouch(this: any, event: EventTouch, handFrame: { x: number }, canvas: { width: number; height: number }): number {
  const ui = event.getUILocation();
  // uiRoot 是无 UITransform 的容器节点（getComponent 为 null，此前的非空断言在 TOUCH_START 首帧即抛错，
  // 导致引擎不 claim 该 touch、MOVE/END 永不派发）。uiRoot scale=1 且无旋转，本地坐标 = UI 世界坐标 - 节点世界坐标。
  const world = this.uiRoot!.worldPosition;
  return Math.round(ui.x - world.x + canvas.width / 2 - handFrame.x);
}

export function bindHandDragHandlers(this: any): void {
  this.onHandDragStart = (event: EventTouch) => {
    if (!this.displayHandSlots?.length) return;
    const canvas = this.canvasSize();
    const handFrame = this.handLayoutFrame(canvas);
    this.handDragActive = true;
    this.handDragMoved = false;
    this.handDragStartX = handLocalXFromTouch.call(this, event, handFrame, canvas);
    this.handDragCurrentX = this.handDragStartX;
  };
  this.onHandDragMove = (event: EventTouch) => {
    if (!this.handDragActive) return;
    const canvas = this.canvasSize();
    const handFrame = this.handLayoutFrame(canvas);
    this.handDragCurrentX = handLocalXFromTouch.call(this, event, handFrame, canvas);
    if (Math.abs(this.handDragCurrentX - this.handDragStartX) > 4) this.handDragMoved = true;
  };
  const settleHandDrag = (): boolean => {
    const moved = this.handDragMoved;
    this.handDragActive = false;
    this.handDragMoved = false;
    if (!moved || !this.displayHandSlots?.length) return false;
    const dragged = dragSelectCards(this.displayHandSlots, this.handDragStartX, this.handDragCurrentX);
    this.selected = dragged.reduce(
      (selected: Card[], card: Card) => (isSelected(selected, card) ? selected : [...selected, card]),
      this.selected.slice(),
    );
    // v1.5 P-AUDIO-WIRE:划选结算即时音(与单点 toggle 同 select.wav)。
    if (dragged.length > 0) this.playUiSound?.(RESOURCE_PATHS.audioSelect);
    this.render();
    return true;
  };
  this.onHandDragEnd = (event: EventTouch) => {
    if (!this.handDragActive) return false;
    const canvas = this.canvasSize();
    const handFrame = this.handLayoutFrame(canvas);
    this.handDragCurrentX = handLocalXFromTouch.call(this, event, handFrame, canvas);
    return settleHandDrag();
  };
  this.onHandDragCancel = () => {
    // 引擎对「触点移出起始节点后抬起」派发 TOUCH_CANCEL 而非 TOUCH_END——跨卡划选必然出界走此分支，
    // 故 CANCEL 也按已划过区间结算（currentX 取最后一次 MOVE），否则划选永不生效。
    if (!this.handDragActive) return;
    settleHandDrag();
  };
}

export function renderBottomCardsDock(this: any, cards: Card[] | null, layout: TableZones, canvas: { width: number; height: number }): void {
  const dock = this.ensureNode('bottom-cards-dock-runtime', this.uiRoot!);
  const pos = this.rectPoint(layout.bottomCardsDock, canvas, 0.5, 0.5);
  dock.setPosition(pos.x, pos.y, 0);
  addUiTransform(dock, layout.bottomCardsDock.width, layout.bottomCardsDock.height);
  // v1.5 P-DOCK-SKIN:v15 三槽托盘按源图槽几何反推尺寸——槽距/内容宽=71.5/313,
  // 迷你牌间距 30 时托盘 131×56 恰好三槽对位;整图等比拉伸(不切片)保槽形与 220:320 牌比。
  const spacing = 30;
  const skinWidth = Math.round(spacing * (313 / 71.5));
  const skinHeight = Math.round(skinWidth * (134 / 313));
  this.addSprite(RESOURCE_PATHS.bottomCardsDockV15, 0, 0, skinWidth, skinHeight, dock, 'bottom-cards-dock-skin');

  const startX = -spacing;
  const signature = cards ? cardsSignature(cards) : 'backs';
  const animateReveal = Boolean(cards) && this.settings.animation && signature !== this.lastBottomCardsSignature;
  this.lastBottomCardsSignature = signature;
  for (let index = 0; index < 3; index += 1) {
    const x = startX + index * spacing;
    if (cards?.[index]) {
      const cardNode = this.addDisplayCard(cards[index], x, 0, dock, `bottom-card-${index}`, animateReveal);
      cardNode.setScale(0.44, 0.44, 1);
      continue;
    }
    const back = this.ensureNode(`bottom-card-back-${index}`, dock);
    back.setPosition(x, 0, 0);
    // v1.6 用户追加①同治:暗牌走的是这条独立路径(不经 addCardNode),原先直接给 26×38 会把
    // 204:272 的牌背拉伸 9.6%(门E)。改等比内接,与手牌/花色同一口径。
    this.fitSpriteInBox(back, RESOURCE_PATHS.cardBackV13, 26, 38);
  }
}

export function renderPlayArea(this: any, top: TopPlay | null, layout: TableZones, canvas: { width: number; height: number }): void {
  const area = this.ensureNode('play-area-runtime', this.uiRoot!);
  this.playAreaRoot = area;
  const dropZone = top ? dropZoneForSeat(layout, top.seat) : layout.dropZoneHero;
  const cards = top?.pattern.cards ?? [];
  const playLayout = this.playAreaLayout(top?.seat ?? HERO_SEAT, cards.length, dropZone, layout, canvas);
  const pos = this.screenPoint(canvas, playLayout.screenX, playLayout.screenY);
  const width = playLayout.width;
  const height = playLayout.height;
  area.setPosition(pos.x, pos.y, 0);
  addUiTransform(area, width, height);

  if (!top) {
    this.lastPlayAreaSignature = '';
    return;
  }

  const signature = `${top.seat}:${cardsSignature(cards)}`;
  const animate = this.settings.animation && signature !== this.lastPlayAreaSignature;
  this.lastPlayAreaSignature = signature;
  // v1.5 P-CARD-FLIGHT(R2):方向飞入只随真实 play 事件触发——事件回调预置 pendingPlayFlightSeat,
  // 此处一次性消费;断局恢复首帧无 play 事件(pending=null)→flyFrom=undefined→旧无方向淡入。
  const flightSeat = this.pendingPlayFlightSeat;
  this.pendingPlayFlightSeat = null;
  const side = top.seat === HERO_SEAT ? 'hero' : visualSideForSeat(top.seat);
  const flyFrom = animate && flightSeat === top.seat
    ? side === 'hero' ? { dx: 0, dy: -140 } : side === 'left' ? { dx: -180, dy: 40 } : { dx: 180, dy: 40 }
    : undefined;
  cards.forEach((card, index) => {
    const position = this.playCardPosition(index, cards.length, playLayout);
    const node = this.addDisplayCard(card, position.x, position.y, area, `play-card-${index}`, animate, flyFrom);
    node.setScale(playLayout.cardScale, playLayout.cardScale, 1);
  });
}

export function playAreaLayout(this: any,
  seat: SeatIndex,
  cardCount: number,
  dropZone: Rect,
  layout: TableZones,
  canvas: { width: number; height: number },
): PlayAreaLayout {
  const isSideSeat = seat !== HERO_SEAT;
  const rows = cardCount >= 8 ? 2 : 1;
  const cardsPerRow = Math.max(1, Math.ceil(Math.max(1, cardCount) / rows));
  const maxWidth = isSideSeat
    ? Math.min(330, Math.max(248, Math.round(canvas.width * 0.37)))
    : Math.min(360, Math.max(180, dropZone.width + 124));
  const baseCardScale = clampNumber(
    (maxWidth - Math.max(0, cardsPerRow - 1) * 2) / (CARD_SIZE.width * cardsPerRow),
    rows > 1 ? 0.58 : 0.66,
    isSideSeat ? 0.88 : 0.94,
  );
  const hudBand = isSideSeat ? this.sideSeatPlaySafeBand(seat, layout, canvas) : null;
  const bandHeight = hudBand ? Math.max(1, hudBand.bottom - hudBand.top) : Infinity;
  const verticalScaleCap = rows > 1
    ? (bandHeight - 5) / (CARD_SIZE.height * rows)
    : bandHeight / CARD_SIZE.height;
  const cardScale = hudBand
    ? clampNumber(Math.min(baseCardScale, verticalScaleCap), rows > 1 ? 0.58 : 0.66, baseCardScale)
    : baseCardScale;
  const visualCardWidth = CARD_SIZE.width * cardScale;
  const visualCardHeight = CARD_SIZE.height * cardScale;
  const spacing = cardCount <= 1 ? 0 : visualCardWidth + 2;
  const rowSpacing = visualCardHeight + 5;
  const contentWidth = visualCardWidth * cardsPerRow + Math.max(0, cardsPerRow - 1) * 2;
  const width = Math.ceil(contentWidth + 28);
  const height = Math.ceil(visualCardHeight * rows + (rows - 1) * 5 + 34);
  let screenX = dropZone.x + dropZone.width / 2;
  if (isSideSeat) {
    const side = visualSideForSeat(seat);
    const portraitReserve = Math.max(140, Math.round(canvas.width * 0.18));
    const safeLeft = side === 'left' ? portraitReserve : Math.round(canvas.width * 0.48);
    const safeRight = side === 'left' ? Math.round(canvas.width * 0.52) : canvas.width - portraitReserve;
    const minCenter = safeLeft + width / 2;
    const maxCenter = safeRight - width / 2;
    screenX = minCenter <= maxCenter ? clampNumber(screenX, minCenter, maxCenter) : (safeLeft + safeRight) / 2;
  }
  let screenY = dropZone.y + dropZone.height / 2 + (rows > 1 ? 8 : 0);
  if (hudBand) {
    const verticalBounds = this.playAreaCardVerticalBounds(rows, visualCardHeight, rowSpacing);
    const minCenterY = hudBand.top - verticalBounds.top;
    const maxCenterY = hudBand.bottom - verticalBounds.bottom;
    screenY = minCenterY <= maxCenterY
      ? clampNumber(screenY, minCenterY, maxCenterY)
      : (hudBand.top + hudBand.bottom - verticalBounds.top - verticalBounds.bottom) / 2;
  }
  return { screenX, screenY, width, height, rows, cardsPerRow, cardScale, spacing, rowSpacing };
}

export function sideSeatPlaySafeBand(this: any,
  seat: SeatIndex,
  layout: TableZones,
  canvas: { width: number; height: number },
): { top: number; bottom: number } {
  const side = visualSideForSeat(seat);
  const hudTop = side === 'left'
    ? Math.min(layout.strengthMeter.y, layout.memoryDock.y)
    : Math.min(layout.turnTimer.y, layout.advisorDock.y);
  return {
    top: Math.max(layout.topBar.y + layout.topBar.height + 8, Math.round(canvas.height * 0.12)),
    bottom: Math.max(1, hudTop - 8),
  };
}

export function playAreaCardVerticalBounds(this: any,
  rows: number,
  visualCardHeight: number,
  rowSpacing: number,
): { top: number; bottom: number } {
  if (rows <= 1) {
    return {
      top: 8 - visualCardHeight / 2,
      bottom: 8 + visualCardHeight / 2,
    };
  }
  return {
    top: 6 - rowSpacing / 2 - visualCardHeight / 2,
    bottom: rowSpacing / 2 + 6 + visualCardHeight / 2,
  };
}

export function playCardPosition(this: any,
  index: number,
  total: number,
  layout: PlayAreaLayout,
): { x: number; y: number } {
  const fullTopRow = total > layout.cardsPerRow ? layout.cardsPerRow : total;
  const row = index < fullTopRow ? 0 : 1;
  const indexInRow = row === 0 ? index : index - fullTopRow;
  const rowCount = row === 0 ? fullTopRow : total - fullTopRow;
  const startX = -((rowCount - 1) * layout.spacing) / 2;
  const x = startX + indexInRow * layout.spacing;
  const y = layout.rows === 1 ? -8 : ((layout.rows - 1) / 2 - row) * layout.rowSpacing - 6;
  return { x, y };
}

export function renderHand(this: any,
  hand: ReturnType<typeof deriveScreenVM>['hand'],
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  const handFrame = this.handLayoutFrame(canvas);
  // v1.6 PL-08:空手牌占位字只在对局进行中显示——结算态(打完最后一手)不再于 scrim 下露出「玩家手牌」游离字。
  if (hand.length === 0 && !this.runtime?.settlement?.()) {
    const title = this.screenPoint(canvas, handFrame.x + handFrame.width / 2, layout.heroHandLarge.y + Math.min(24, layout.heroHandLarge.height * 0.22));
    this.addLabel(GAME_TEXT.playerHand, title.x, title.y, THEME.typography.md, this.uiRoot!, 140, 30, 'hand-title', TABLE_TEXT);
  }
  const handSignature = cardsSignature(hand.map((slot) => slot.card));
  const animateDeal = this.settings.animation && handSignature !== this.lastHandSignature;
  const nextSelectedKeys = new Set<string>();
  const handTopY = layout.heroHandLarge.y + Math.round(layout.heroHandLarge.height * 0.54);
  hand.forEach((slot, index) => {
    const screenX = handFrame.x + slot.x + CARD_SIZE.width / 2;
    const screenY = handTopY + slot.y;
    const { x, y } = this.screenPoint(canvas, screenX, screenY);
    this.addCard(slot.card, x, y, slot.selected, index, hand.length, animateDeal);
    if (slot.selected) nextSelectedKeys.add(cardKey(slot.card));
  });
  this.lastHandSignature = handSignature;
  this.renderedSelectedCardKeys = nextSelectedKeys;
}

export function handLayoutFrame(this: any, canvas: { width: number; height: number }): { x: number; width: number } {
  const inset = Math.round(Math.min(96, Math.max(64, canvas.width * 0.095)));
  return {
    x: inset,
    width: Math.max(CARD_SIZE.width, canvas.width - inset * 2),
  };
}

export function armDealAnimationLock(this: any, phase: string, hand: ReturnType<typeof deriveScreenVM>['hand']): void {
  if (!this.settings.animation || phase !== 'bidding' || hand.length === 0) return;
  const handSignature = cardsSignature(hand.map((slot) => slot.card));
  if (handSignature === this.lastHandSignature) return;
  this.dealAnimationLockMs = Math.max(this.dealAnimationLockMs, dealCardDelay(hand.length - 1, hand.length) + dealFlight().durationMs);
}
