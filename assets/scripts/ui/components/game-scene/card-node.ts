import { Color, EventTouch, Node, Sprite, SpriteFrame, UIOpacity, UITransform, Vec3, resources, tween } from 'cc';
import { Rank, Suit, type Card } from '../../../rules';
import { cardKey } from '../../../rules/guards';
import { cardView } from '../../card-view';
import { RESOURCE_PATHS, spriteFrameResourcePath, type ResourcePath } from '../../asset-keys';
import { addUiTransform } from '../ui-helpers';

export const CARD_SIZE = { width: 56, height: 82 };
const CARD_SUIT_ICON_SIZE = 21;
export const HAND_LIFT = 18;
const CARD_PRESS_SCALE = 0.96;
const CARD_PRESS_OPACITY = 214;

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

export function addCard(this: any,
  card: Card,
  x: number,
  y: number,
  selected: boolean,
  index: number,
  total: number,
  animateDeal: boolean,
): void {
  const node = this.addCardNode(card, x, y, this.uiRoot!, `card-${index}`, true);
  const key = cardKey(card);
  const wasSelected = this.renderedSelectedCardKeys.has(key);
  if (this.settings.animation && animateDeal) {
    this.animateCardDeal(node, x, y, index, total);
  } else if (this.settings.animation && wasSelected !== selected) {
    const fromY = selected ? y - HAND_LIFT : y + HAND_LIFT;
    node.setPosition(x, fromY, 0);
    tween(node).to(0.12, { position: new Vec3(x, y, 0) }).start();
  } else {
    node.setPosition(x, y, 0);
  }
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
  const node = this.addCardNode(card, x, y, parent, name, false);
  if (this.settings.animation && animate) this.animateCardPlay(node, x, y, flyFrom);
  return node;
}

export function addCardNode(this: any, card: Card, x: number, y: number, parent: Node, name: string, interactive: boolean): Node {
  const node = this.ensureNode(`${name}-${cardKey(card)}`, parent);
  node.setPosition(x, y, 0);
  node.setScale(1, 1, 1);
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  opacity.opacity = 255;
  addUiTransform(node, CARD_SIZE.width, CARD_SIZE.height);
  const parentSprite = node.getComponent(Sprite);
  if (parentSprite) parentSprite.destroy();
  const view = cardView(card);
  // v1.6 用户追加①「去掉卡牌背景的那个面板」:原先每张牌先画一层 `card-fill`(Graphics 的 surface 圆角面板
  // + brand 描边)当卡面图的兜底,再把卡面图盖上去。卡面图一旦带透明边,这层兜底就从边缘露出来——
  // 17 张并排时连成一整条"面板"(用户截图所指)。删掉兜底层:卡面图本身就是完整的牌面,不需要底板。
  // 未 ensureNode 的旧 `card-fill` 子节点由 render prune 自动销毁。
  const bgNode = this.ensureNode('card-bg', node);
  bgNode.setPosition(0, 0, 0);
  bgNode.setSiblingIndex(0);
  // 等比内接:卡面/王牌裁后比例各不相同(204:262 / 204:261 / 204:277),直接给 56×82 会拉伸(门E)。
  this.fitSpriteInBox(bgNode, this.cardSpritePath(card), CARD_SIZE.width, CARD_SIZE.height);
  node.off(Node.EventType.TOUCH_START);
  node.off(Node.EventType.TOUCH_MOVE);
  node.off(Node.EventType.TOUCH_END);
  node.off(Node.EventType.TOUCH_CANCEL);
  if (interactive) {
    node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
      this.setCardPressed(node, true);
      this.onHandDragStart?.(event);
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

  const faceColor = this.cardFaceColor(view.suitKey);
  const cornerLabel = this.addLabel(
    `${view.rankLabel}${suitText(view.suitKey)}`,
    -13,
    24,
    view.suitKey === 'joker' ? 11 : 13,
    node,
    38,
    22,
    'card-rank-label',
  );
  cornerLabel.lineHeight = view.suitKey === 'joker' ? 13 : 16;
  cornerLabel.color = faceColor;

  if (view.suitKey !== 'joker') {
    const suitPath = this.suitSpritePath(view.suitKey);
    if (suitPath) {
      const suitNode = this.ensureNode('card-suit-icon', node);
      suitNode.setPosition(0, -7, 0);
      // 花色裁后比例也非正方(黑桃 98:116、方块 96:116),塞进 21×21 方框会拉伸 15~17%(门E,用户②)。
      this.fitSpriteInBox(suitNode, suitPath, CARD_SUIT_ICON_SIZE, CARD_SUIT_ICON_SIZE);
    }
  }
  return node;
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
