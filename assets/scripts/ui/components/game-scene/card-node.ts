import { Color, EventTouch, Node, Sprite, SpriteFrame, UIOpacity, resources } from 'cc';
import { Rank, Suit, type Card } from '../../../rules';
import { cardKey } from '../../../rules/guards';
import type { CardPlacement } from '../../card-stage';
import { cardView } from '../../card-view';
import { RESOURCE_PATHS, spriteFrameResourcePath, type ResourcePath } from '../../asset-keys';
import { THEME } from '../../theme';
import { addUiTransform } from '../ui-helpers';
import { cardRuntimeNodeName } from './card-animator';

export const CARD_SIZE = { width: 64, height: 90 };
const CARD_SUIT_ICON_SIZE = 21;
export const HAND_LIFT = 18;
const CARD_PRESS_SCALE = 0.96;
const CARD_PRESS_OPACITY = 214;

type RuntimeCardNode = Node & {
  __cardStageKey?: string;
  __cardStageZone?: CardPlacement['zone'];
  __cardStageZ?: number;
};

export function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

export function cardsSignature(cards: Card[]): string {
  return cards.map(cardKey).join('|');
}

function suitText(suit: Suit | 'joker'): string {
  switch (suit) {
    case Suit.Spade:
      return '♠';
    case Suit.Heart:
      return '♥';
    case Suit.Club:
      return '♣';
    case Suit.Diamond:
      return '♦';
    default:
      return '★';
  }
}

/** Render one physical card. Identity and parent are stable across all zones. */
export function renderStageCard(this: any, placement: CardPlacement, parent: Node): Node {
  const node = this.ensureNode(cardRuntimeNodeName(placement.key), parent) as RuntimeCardNode;
  node.__cardStageKey = placement.key;
  node.__cardStageZone = placement.zone;

  const owned = Boolean(this.cardAnimator?.owns(placement.key));
  if (!owned) applyPlacementTransform(node, placement);

  const interactive = placement.interactive && !owned && !this.cardAnimator?.isBusy();
  renderCardContent.call(this, node, placement.card, placement.faceUp, interactive);
  return node;
}

export function addDisplayCard(
  this: any,
  card: Card,
  x: number,
  y: number,
  parent: Node,
  name: string,
  animate: boolean,
  flyFrom?: { dx: number; dy: number },
): Node {
  // Non-physical mini echoes (last-play pills / duplicated public bottom cards)
  // deliberately stay outside card-layer-runtime and never enter choreography.
  const node = this.ensureNode(`${name}:${cardKey(card)}`, parent) as RuntimeCardNode;
  node.setPosition(x, y, 0);
  node.setScale(1, 1, 1);
  node.angle = 0;
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  opacity.opacity = 255;
  renderCardContent.call(this, node, card, true, false);
  void animate;
  void flyFrom;
  return node;
}

function applyPlacementTransform(node: RuntimeCardNode, placement: CardPlacement): void {
  node.setPosition(placement.x, placement.y, 0);
  node.setScale(placement.scale, placement.scale, 1);
  node.angle = placement.angle;
  node.__cardStageZ = placement.z;
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  opacity.opacity = 255;
}

function renderCardContent(this: any, node: Node, card: Card, faceUp: boolean, interactive: boolean): void {
  addUiTransform(node, CARD_SIZE.width, CARD_SIZE.height);
  const parentSprite = node.getComponent(Sprite);
  if (parentSprite) parentSprite.destroy();
  // v1.6 用户追加①「去掉卡牌背景的那个面板」:原先每张牌先画一层 `card-fill`(Graphics 的 surface 圆角面板
  // + brand 描边)当卡面图的兜底,再把卡面图盖上去。卡面图一旦带透明边,这层兜底就从边缘露出来——
  // 17 张并排时连成一整条"面板"(用户截图所指)。删掉兜底层:卡面图本身就是完整的牌面,不需要底板。
  // 未 ensureNode 的旧 `card-fill` 子节点由 render prune 自动销毁。
  const bgNode = this.ensureNode('card-bg', node);
  bgNode.setPosition(0, 0, 0);
  bgNode.setSiblingIndex(0);
  // 等比内接:卡面/王牌裁后比例各不相同,直接塞进 64×90 会触发门 E。
  this.fitSpriteInBox(
    bgNode,
    faceUp ? this.cardSpritePath(card) : RESOURCE_PATHS.cardBackV13,
    CARD_SIZE.width,
    CARD_SIZE.height,
  );
  node.off(Node.EventType.TOUCH_START);
  node.off(Node.EventType.TOUCH_MOVE);
  node.off(Node.EventType.TOUCH_END);
  node.off(Node.EventType.TOUCH_CANCEL);
  if (interactive) {
    node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
      this.setCardPressed(node, true);
      this.onHandDragStart?.(event, card);
    }, this);
    node.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
      this.onHandDragMove?.(event);
    }, this);
    node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
      this.setCardPressed(node, false);
      if (this.onHandDragEnd?.(event)) return;
      this.toggleCard(card);
    }, this);
    node.on(Node.EventType.TOUCH_CANCEL, () => {
      this.setCardPressed(node, false);
      this.onHandDragCancel?.();
    }, this);
  }

  if (!faceUp) return;

  const view = cardView(card);

  const faceColor = this.cardFaceColor(view.suitKey);
  const cornerLabel = this.addLabel(
    `${view.rankLabel}${suitText(view.suitKey)}`,
    -9,
    24,
    'cardRank',
    node,
    38,
    22,
    'card-rank-label',
  );
  if (view.suitKey === 'joker') {
    // v1.6 王字角标 = 11/13；复用现有语义阶梯，不引入第 10 个字号角色。
    cornerLabel.fontSize = THEME.typography.assistive.size;
    cornerLabel.lineHeight = THEME.typography.secondary.lineHeight;
  }
  cornerLabel.isBold = false;
  cornerLabel.color = faceColor;

  if (view.suitKey !== 'joker') {
    const suitPath = this.suitSpritePath(view.suitKey);
    if (suitPath) {
      const suitNode = this.ensureNode('card-suit-icon', node);
      suitNode.setPosition(0, -7, 0);
      // 花色裁后比例也非正方,正方显示框必须等比内接(门 E)。
      this.fitSpriteInBox(suitNode, suitPath, CARD_SUIT_ICON_SIZE, CARD_SUIT_ICON_SIZE);
    }
  }
}

/**
 * 等比内接:按 SpriteFrame 的真实 rect 比例,最大化地把精灵放进 (boxW × boxH),不拉伸。
 * 与 `ui-runtime-helpers.addSpriteContain` 同一原理,但直接作用于既有节点(卡牌节点树已建好)。
 * 帧异步加载,故在帧落位后定尺寸;命中缓存时同帧生效。
 */
export function fitSpriteInBox(this: any, node: Node, path: ResourcePath, boxW: number, boxH: number): void {
  addUiTransform(node, boxW, boxH);
  const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
  this.configureCardSprite(sprite);
  this.loadSprite(path, sprite);
  const fit = (frame: SpriteFrame): void => {
    // 异步回调落地时,节点可能已被 render prune 销毁(出牌/换局)——必须查 isValid,否则 use-after-destroy。
    if (!node.isValid) return;
    const rect = frame.rect;
    if (!rect || !rect.width || !rect.height) return;
    const k = Math.min(boxW / rect.width, boxH / rect.height);
    addUiTransform(node, Math.round(rect.width * k), Math.round(rect.height * k));
  };
  const cached: SpriteFrame | undefined = this.spriteFrames.get(path);
  if (cached) {
    fit(cached);
    return;
  }
  resources.load(spriteFrameResourcePath(path), SpriteFrame, (error, frame) => {
    if (!error && frame) fit(frame);
  });
}

export function cardFaceColor(this: any, suit: Suit | 'joker'): Color {
  // v1.6 二次终审:红花色原 (204,65,92) 压奶白卡面仅 4.27:1(门C 实测,差 AA 一线)——加深到 5.3:1,仍是明确的红。
  return suit === Suit.Heart || suit === Suit.Diamond
    ? new Color(196, 52, 82, 255)
    : new Color(54, 55, 66, 255);
}

export function cardSpritePath(this: any, card: Card): ResourcePath {
  if (card.suit === Suit.Joker && card.rank === Rank.SmallJoker) return RESOURCE_PATHS.jokerSmallV13;
  if (card.suit === Suit.Joker && card.rank === Rank.BigJoker) return RESOURCE_PATHS.jokerBigV13;
  return RESOURCE_PATHS.cardTemplateV13;
}

export function suitSpritePath(this: any, suit: Suit | 'joker'): ResourcePath | null {
  switch (suit) {
    case Suit.Spade:
      return RESOURCE_PATHS.suitSpadeV13;
    case Suit.Heart:
      return RESOURCE_PATHS.suitHeartV13;
    case Suit.Club:
      return RESOURCE_PATHS.suitClubV13;
    case Suit.Diamond:
      return RESOURCE_PATHS.suitDiamondV13;
    default:
      return null;
  }
}

export function configureCardSprite(this: any, sprite: Sprite): void {
  sprite.type = Sprite.Type.SIMPLE;
  sprite.sizeMode = Sprite.SizeMode.CUSTOM;
}


export function setCardPressed(this: any, node: Node, pressed: boolean): void {
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  opacity.opacity = pressed ? CARD_PRESS_OPACITY : 255;
  const scale = pressed ? CARD_PRESS_SCALE : 1;
  node.setScale(scale, scale, 1);
}
