import { Color, Graphics, Node, Sprite, UIOpacity, Vec3, tween } from 'cc';
import { Rank, Suit, type Card } from '../../../rules';
import { cardKey } from '../../../rules/guards';
import { cardView } from '../../card-view';
import { RESOURCE_PATHS, type ResourcePath } from '../../asset-keys';
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

export function addDisplayCard(this: any, card: Card, x: number, y: number, parent: Node, name: string, animate: boolean): Node {
  const node = this.addCardNode(card, x, y, parent, name, false);
  if (this.settings.animation && animate) this.animateCardPlay(node, x, y);
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
  const fillNode = this.ensureNode('card-fill', node);
  fillNode.setPosition(0, 0, 0);
  fillNode.setSiblingIndex(0);
  addUiTransform(fillNode, CARD_SIZE.width, CARD_SIZE.height);
  this.drawCardBase(fillNode, CARD_SIZE.width, CARD_SIZE.height);

  const bgNode = this.ensureNode('card-bg', node);
  bgNode.setPosition(0, 0, 0);
  bgNode.setSiblingIndex(1);
  addUiTransform(bgNode, CARD_SIZE.width, CARD_SIZE.height);
  const sprite = bgNode.getComponent(Sprite) ?? bgNode.addComponent(Sprite);
  this.configureCardSprite(sprite);
  this.loadSprite(this.cardSpritePath(card), sprite);
  node.off(Node.EventType.TOUCH_START);
  node.off(Node.EventType.TOUCH_END);
  node.off(Node.EventType.TOUCH_CANCEL);
  if (interactive) {
    node.on(Node.EventType.TOUCH_START, () => this.setCardPressed(node, true), this);
    node.on(Node.EventType.TOUCH_END, () => {
      this.setCardPressed(node, false);
      this.toggleCard(card);
    }, this);
    node.on(Node.EventType.TOUCH_CANCEL, () => this.setCardPressed(node, false), this);
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
      addUiTransform(suitNode, CARD_SUIT_ICON_SIZE, CARD_SUIT_ICON_SIZE);
      const suitSprite = suitNode.getComponent(Sprite) ?? suitNode.addComponent(Sprite);
      this.configureCardSprite(suitSprite);
      this.loadSprite(suitPath, suitSprite);
    }
  }
  return node;
}

export function cardFaceColor(this: any, suit: Suit | 'joker'): Color {
  return suit === Suit.Heart || suit === Suit.Diamond
    ? new Color(204, 65, 92, 255)
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

export function drawCardBase(this: any, parent: Node, width: number, height: number): void {
  const graphics = parent.getComponent(Graphics) ?? parent.addComponent(Graphics);
  graphics.clear();
  graphics.fillColor = new Color(255, 252, 245, 248);
  graphics.strokeColor = new Color(248, 143, 173, 230);
  graphics.lineWidth = 1.5;
  graphics.roundRect(-width / 2, -height / 2, width, height, 7);
  graphics.fill();
  graphics.stroke();
}

export function setCardPressed(this: any, node: Node, pressed: boolean): void {
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  opacity.opacity = pressed ? CARD_PRESS_OPACITY : 255;
  const scale = pressed ? CARD_PRESS_SCALE : 1;
  node.setScale(scale, scale, 1);
}
