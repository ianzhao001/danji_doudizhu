import { EventTouch, Node } from 'cc';
import type { Card } from '../../../rules';
import { cardKey } from '../../../rules/guards';
import { type CardStage, type CardStagePhase } from '../../card-stage';
import {
  dragSelectCardsFromOrigin,
  type InteractiveSlot,
} from '../../hand-interaction';
import { applyDragSelection, dragSelectionModeFromCard } from '../../selection';
import type { TableZones } from '../../table-zones';
import { RESOURCE_PATHS } from '../../asset-keys';
import { t } from '../../strings';
import { UI_TEXT_COLORS } from '../../ui-text-colors';
import { THEME, addUiTransform, toColor } from '../ui-helpers';
import { CARD_SIZE } from './card-node';

const TABLE_TEXT = toColor(UI_TEXT_COLORS.primary);

/** uiRoot and CardStage share the same centred local x axis. */
export function handLocalXFromTouch(this: any, event: EventTouch): number {
  const ui = event.getUILocation();
  const world = this.uiRoot!.worldPosition;
  return Math.round(ui.x - world.x);
}

export function interactiveSlotsFromStage(stage: CardStage): InteractiveSlot[] {
  return stage.handHits.map((hit) => {
    const placement = stage.byKey.get(hit.key);
    if (!placement || placement.zone !== 'hand') {
      throw new Error(`card-stage hand hit has no hand placement: ${hit.key}`);
    }
    return {
      card: placement.card,
      x: hit.left,
      y: placement.y,
      selected: placement.selected,
      hitRight: hit.right,
    };
  });
}

export function bindHandDragHandlers(this: any): void {
  const clearHandDrag = (): void => {
    this.handDragActive = false;
    this.handDragMoved = false;
    this.handDragMode = null;
    this.handDragOriginCard = null;
    this.handDragStartX = 0;
    this.handDragCurrentX = 0;
  };
  this.onHandDragStart = (event: EventTouch, card: Card) => {
    if (this.cardAnimator?.isBusy() || !this.displayHandSlots?.length) return;
    const startX = handLocalXFromTouch.call(this, event);
    const mode = dragSelectionModeFromCard(this.selected, card);
    this.handDragActive = true;
    this.handDragMoved = false;
    this.handDragMode = mode;
    this.handDragOriginCard = card;
    this.handDragStartX = startX;
    this.handDragCurrentX = startX;
  };
  this.onHandDragMove = (event: EventTouch) => {
    if (!this.handDragActive) return;
    this.handDragCurrentX = handLocalXFromTouch.call(this, event);
    if (Math.abs(this.handDragCurrentX - this.handDragStartX) > 4) this.handDragMoved = true;
  };
  const settleHandDrag = (): boolean => {
    const moved = this.handDragMoved;
    const mode = this.handDragMode;
    const originCard = this.handDragOriginCard;
    const currentX = this.handDragCurrentX;
    const slots = this.displayHandSlots;
    clearHandDrag();
    if (!moved || mode === null || !originCard || !slots?.length) return false;
    const dragged = dragSelectCardsFromOrigin(slots, originCard, currentX);
    this.selected = applyDragSelection(this.selected, dragged, mode);
    if (dragged.length > 0) this.playUiSound?.(RESOURCE_PATHS.audioSelect);
    this.render();
    return true;
  };
  this.onHandDragEnd = (event: EventTouch) => {
    if (!this.handDragActive) return false;
    this.handDragCurrentX = handLocalXFromTouch.call(this, event);
    return settleHandDrag();
  };
  this.onHandDragCancel = () => {
    if (this.handDragActive) clearHandDrag();
  };
}

/**
 * The dock skin and hidden backs are presentation. Revealed physical bottom
 * cards live in CardStage; only duplicates already claimed by hand/table are
 * echoed here as non-physical mini decorations.
 */
export function renderBottomCardsDock(
  this: any,
  cards: Card[] | null,
  layout: TableZones,
  canvas: { width: number; height: number },
  stage: CardStage,
): void {
  const dock = this.ensureNode('bottom-cards-dock-runtime', this.uiRoot!);
  const pos = this.rectPoint(layout.bottomCardsDock, canvas, 0.5, 0.5);
  dock.setPosition(pos.x, pos.y, 0);
  addUiTransform(dock, layout.bottomCardsDock.width, layout.bottomCardsDock.height);

  const spacing = 30;
  const skinWidth = Math.round(spacing * (313 / 71.5));
  const skinHeight = Math.round(skinWidth * (134 / 313));
  this.addSprite(RESOURCE_PATHS.bottomCardsDockV15, 0, 0, skinWidth, skinHeight, dock, 'bottom-cards-dock-skin');

  const startX = -spacing;
  for (let index = 0; index < 3; index += 1) {
    const x = startX + index * spacing;
    const card = cards?.[index];
    if (!card) {
      const back = this.ensureNode(`bottom-card-back-${index}`, dock);
      back.setPosition(x, 0, 0);
      this.fitSpriteInBox(back, RESOURCE_PATHS.cardBackV13, 26, 38);
      continue;
    }

    const physical = stage.byKey.get(cardKey(card));
    if (physical?.zone === 'bottom') continue;
    const decoration = this.addDisplayCard(card, x, 0, dock, `bottom-decoration-${index}`, false);
    const scale = Math.min(0.44, layout.bottomCardsDock.height / CARD_SIZE.height);
    decoration.setScale(scale, scale, 1);
  }
}

/** Single persistent parent and the only physical-card render path. */
export function renderCardStage(this: any, stage: CardStage): Node {
  const layer = this.ensureNode('card-layer-runtime', this.uiRoot!);
  layer.setPosition(0, 0, 0);
  this.cardLayer = layer;
  this.displayHandSlots = interactiveSlotsFromStage(stage);

  stage.placements.forEach((placement, index) => {
    const node = this.renderStageCard(placement, layer);
    if (!this.cardAnimator?.isAnimating()) node.setSiblingIndex(index);
  });
  return layer;
}

/** Keep the legacy pulse target empty; physical cards never reparent into it. */
export function renderPlayAreaFxTarget(
  this: any,
  layout: TableZones,
  canvas: { width: number; height: number },
  stage: CardStage,
  phase: CardStagePhase,
): void {
  const area = this.ensureNode('play-area-runtime', this.uiRoot!);
  const pos = this.rectPoint(layout.dropZoneHero, canvas, 0.5, 0.5);
  area.setPosition(pos.x, pos.y, 0);
  addUiTransform(area, layout.dropZoneHero.width, layout.dropZoneHero.height);
  // W-VISION-COLOR-R2 用户签收：中央落牌区只保留常驻 FX 命中根，
  // 不铺托盘皮、不显示空态文字，让 gameTableBgC1 连续露出。
  void stage;
  void phase;
  this.playAreaRoot = area;
}

export function renderHandPlaceholder(
  this: any,
  stage: CardStage,
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  if (stage.handHits.length > 0 || this.runtime?.settlement?.()) return;
  const title = this.rectPoint(layout.heroHandLarge, canvas, 0.5, 0.22);
  this.addLabel(
    t('tutorial.playerHand'),
    title.x,
    title.y,
    'action',
    this.uiRoot!,
    140,
    30,
    'hand-title',
    TABLE_TEXT,
  );
}
