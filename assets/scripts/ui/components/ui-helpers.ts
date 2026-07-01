import { Button, Color, Graphics, Label, Node, Sprite, SpriteFrame, UITransform, resources } from 'cc';
import { spriteFrameResourcePath, type ResourcePath } from '../asset-keys';

type EnsureNode = (name: string, parent: Node) => Node;

function labelColor(enabled: boolean): Color {
  return enabled ? new Color(255, 255, 255, 255) : new Color(255, 255, 255, 120);
}

export function addUiTransform(node: Node, width: number, height: number): UITransform {
  const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  transform.setContentSize(width, height);
  return transform;
}

export function drawPanel(parent: Node, width: number, height: number, fill: Color): void {
  const graphics = parent.getComponent(Graphics) ?? parent.addComponent(Graphics);
  graphics.clear();
  graphics.fillColor = fill;
  graphics.roundRect(-width / 2, -height / 2, width, height, 8);
  graphics.fill();
}

function drawButtonBackground(
  ensureNode: EnsureNode,
  parent: Node,
  width: number,
  height: number,
  enabled: boolean,
  selected: boolean,
): Node {
  const node = ensureNode('button-bg', parent);
  addUiTransform(node, width, height);
  const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
  graphics.clear();
  graphics.fillColor = selected
    ? new Color(255, 224, 232, 150)
    : enabled
      ? new Color(255, 255, 255, 70)
      : new Color(255, 255, 255, 30);
  graphics.roundRect(-width / 2, -height / 2, width, height, 8);
  graphics.fill();
  return node;
}

export function addLabel(
  ensureNode: EnsureNode,
  options: {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    parent: Node;
    width: number;
    height: number;
    name: string;
    color?: Color;
    lineHeightOffset?: number;
  },
): Label {
  const node = ensureNode(options.name, options.parent);
  node.setPosition(options.x, options.y, 0);
  addUiTransform(node, options.width, options.height);
  const label = node.getComponent(Label) ?? node.addComponent(Label);
  label.string = options.text;
  label.fontSize = options.fontSize;
  label.lineHeight = options.fontSize + (options.lineHeightOffset ?? 5);
  label.horizontalAlign = Label.HorizontalAlign.CENTER;
  label.verticalAlign = Label.VerticalAlign.CENTER;
  label.color = options.color ?? new Color(255, 255, 255, 255);
  return label;
}

export function addButton(
  ensureNode: EnsureNode,
  options: {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    enabled: boolean;
    cb: () => void;
    parent: Node;
    name: string;
    selected?: boolean;
    fontSize: number;
    lineHeight: number;
    owner?: unknown;
  },
): Label {
  const node = ensureNode(options.name, options.parent);
  node.setPosition(options.x, options.y, 0);
  addUiTransform(node, options.width, options.height);
  const button = node.getComponent(Button) ?? node.addComponent(Button);
  const selected = options.selected ?? false;
  button.target = drawButtonBackground(ensureNode, node, options.width, options.height, options.enabled, selected);
  button.transition = Button.Transition.COLOR;
  button.interactable = options.enabled;
  button.normalColor = selected ? new Color(255, 224, 232, 150) : new Color(255, 255, 255, 70);
  button.pressedColor = new Color(255, 214, 226, selected ? 170 : 150);
  button.hoverColor = new Color(255, 255, 255, 100);
  button.disabledColor = new Color(255, 255, 255, 24);
  node.off(Button.EventType.CLICK);
  node.on(Button.EventType.CLICK, options.cb, options.owner);

  const labelNode = ensureNode('button-label', node);
  addUiTransform(labelNode, options.width, options.height);
  const label = labelNode.getComponent(Label) ?? labelNode.addComponent(Label);
  label.string = options.text;
  label.fontSize = options.fontSize;
  label.lineHeight = options.lineHeight;
  label.horizontalAlign = Label.HorizontalAlign.CENTER;
  label.verticalAlign = Label.VerticalAlign.CENTER;
  label.color = labelColor(options.enabled);
  return label;
}

export function loadSprite(path: ResourcePath, sprite: Sprite | null, cache?: Map<string, SpriteFrame>): void {
  if (!sprite) return;
  const cached = cache?.get(path);
  if (cached) {
    sprite.spriteFrame = cached;
    return;
  }
  resources.load(spriteFrameResourcePath(path), SpriteFrame, (error, frame) => {
    if (!error && frame) {
      cache?.set(path, frame);
      sprite.spriteFrame = frame;
    }
  });
}
