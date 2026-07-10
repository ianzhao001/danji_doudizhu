import { Button, Color, Graphics, Label, Node, Sprite, SpriteFrame, UITransform, resources } from 'cc';
import { spriteFrameResourcePath, type ResourcePath } from '../asset-keys';
import { THEME, type ThemeColor } from '../theme';

type EnsureNode = (name: string, parent: Node) => Node;
type SpriteLoader = (path: ResourcePath, sprite: Sprite | null) => void;

interface SkinnedButtonLayout {
  renderHeight: number;
  label: {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    lineHeight: number;
  };
  icon?: {
    x: number;
    y: number;
    size: number;
  };
}

interface SkinnedButtonLayoutInput {
  name: string;
  width: number;
  height: number;
  enabled: boolean;
  selected: boolean;
  iconPath: ResourcePath | null;
}

function labelColor(enabled: boolean): Color {
  return enabled ? toColor(THEME.palette.textOnAccent) : toColor(THEME.palette.textOnAccent, 120);
}

export function toColor(token: ThemeColor, alpha?: number): Color {
  return new Color(token.r, token.g, token.b, alpha ?? token.a);
}
export { THEME };

export function addUiTransform(node: Node, width: number, height: number): UITransform {
  const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  transform.setContentSize(width, height);
  return transform;
}

export function drawPanel(parent: Node, width: number, height: number, fill: Color): void {
  const graphics = parent.getComponent(Graphics) ?? parent.addComponent(Graphics);
  graphics.clear();
  graphics.fillColor = fill;
  graphics.roundRect(-width / 2, -height / 2, width, height, THEME.radius.md);
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
    ? toColor(THEME.palette.selectedTint)
    : enabled
      ? toColor(THEME.palette.textOnAccent, 70)
      : toColor(THEME.palette.textOnAccent, 30);
  graphics.roundRect(-width / 2, -height / 2, width, height, THEME.radius.md);
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
  label.color = options.color ?? toColor(THEME.palette.textOnAccent);
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
  button.normalColor = selected ? toColor(THEME.palette.selectedTint) : toColor(THEME.palette.textOnAccent, 70);
  button.pressedColor = toColor(selected ? THEME.palette.selectedTint : THEME.palette.textOnAccent, selected ? 170 : 150);
  button.hoverColor = toColor(THEME.palette.textOnAccent, 100);
  button.disabledColor = toColor(THEME.palette.textOnAccent, 24);
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

export function addSkinnedSprite(
  ensureNode: EnsureNode,
  load: SpriteLoader,
  options: {
    path: ResourcePath;
    x: number;
    y: number;
    width: number;
    height: number;
    parent: Node;
    name: string;
    sliced?: boolean;
  },
): Node {
  const node = ensureNode(options.name, options.parent);
  node.setPosition(options.x, options.y, 0);
  addUiTransform(node, options.width, options.height);
  const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
  sprite.type = options.sliced ? Sprite.Type.SLICED : Sprite.Type.SIMPLE;
  sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  load(options.path, sprite);
  return node;
}

export function drawPanelSkin(
  ensureNode: EnsureNode,
  load: SpriteLoader,
  options: {
    path: ResourcePath;
    parent: Node;
    width: number;
    height: number;
    name?: string;
  },
): Node {
  options.parent.getComponent(Graphics)?.clear();
  const skin = addSkinnedSprite(ensureNode, load, {
    path: options.path,
    x: 0,
    y: 0,
    width: options.width,
    height: options.height,
    parent: options.parent,
    name: options.name ?? 'panel-skin',
    sliced: true,
  });
  skin.setSiblingIndex(0);
  return skin;
}

export function addSkinnedButton(
  ensureNode: EnsureNode,
  load: SpriteLoader,
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
    owner?: unknown;
    selected?: boolean;
    skinPath(name: string, enabled: boolean, selected: boolean): ResourcePath;
    textColor(name: string, enabled: boolean, selected: boolean): Color;
    iconPath?(name: string): ResourcePath | null;
    layout(input: SkinnedButtonLayoutInput): SkinnedButtonLayout;
  },
): Label {
  const selected = options.selected ?? false;
  const iconPath = options.iconPath?.(options.name) ?? null;
  const layout = options.layout({
    name: options.name,
    width: options.width,
    height: options.height,
    enabled: options.enabled,
    selected,
    iconPath,
  });
  const node = ensureNode(options.name, options.parent);
  node.setPosition(options.x, options.y, 0);
  addUiTransform(node, options.width, layout.renderHeight);
  const button = node.getComponent(Button) ?? node.addComponent(Button);
  const bg = addSkinnedSprite(ensureNode, load, {
    path: options.skinPath(options.name, options.enabled, selected),
    x: 0,
    y: 0,
    width: options.width,
    height: layout.renderHeight,
    parent: node,
    name: 'button-bg',
    sliced: true,
  });
  bg.setSiblingIndex(0);
  button.target = bg;
  button.transition = Button.Transition.COLOR;
  button.interactable = options.enabled;
  button.normalColor = toColor(THEME.palette.textOnAccent);
  button.pressedColor = toColor(THEME.palette.selectedTint, 255);
  button.hoverColor = toColor(THEME.palette.textOnAccent);
  button.disabledColor = toColor(THEME.palette.textOnAccent);
  node.off(Button.EventType.CLICK);
  node.on(Button.EventType.CLICK, options.cb, options.owner);

  if (iconPath && layout.icon) {
    addSkinnedSprite(ensureNode, load, {
      path: iconPath,
      x: layout.icon.x,
      y: layout.icon.y,
      width: layout.icon.size,
      height: layout.icon.size,
      parent: node,
      name: 'button-icon',
    });
  }

  const label = addLabel(ensureNode, {
    text: options.text,
    x: layout.label.x,
    y: layout.label.y,
    fontSize: layout.label.fontSize,
    parent: node,
    width: layout.label.width,
    height: layout.label.height,
    name: 'button-label',
    color: options.textColor(options.name, options.enabled, selected),
    lineHeightOffset: 4,
  });
  label.lineHeight = layout.label.lineHeight;
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
