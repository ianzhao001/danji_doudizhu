import { Button, Color, Graphics, Label, Node, Overflow, Sprite, SpriteFrame, UITransform, Vec3, resources } from 'cc';
import { pressFeedback } from '../animation-params';
import { spriteFrameResourcePath, type ResourcePath } from '../asset-keys';
import { THEME, type ThemeColor, type TypographyRole } from '../theme';
import { applyRegularFont } from './game-scene/font-loader';

type EnsureNode = (name: string, parent: Node) => Node;
type SpriteLoader = (path: ResourcePath, sprite: Sprite | null) => SpriteFrame | null;

// W-VISION-COLOR-R2-d 用户整改：禁用按钮仍需清楚可辨，同时保留降权。
// 门 M 锁定运行时皮肤 alpha 在 [96,160]；文字禁用色与 THEME.alpha.disabled 保持原契约。
export const BUTTON_DISABLED_SKIN_ALPHA = 120;

interface SkinnedButtonLayout {
  renderHeight: number;
  label: {
    x: number;
    y: number;
    width: number;
    height: number;
    role: TypographyRole;
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

function isEmphasisRole(role: TypographyRole): boolean {
  return role === 'prominentAction'
    || role === 'sectionTitle'
    || role === 'cardRank'
    || role === 'hero'
    || role === 'display';
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
    role: TypographyRole;
    parent: Node;
    width: number;
    height: number;
    name: string;
    color?: Color;
    overflow?: Overflow;
  },
): Label {
  const node = ensureNode(options.name, options.parent);
  node.setPosition(options.x, options.y, 0);
  addUiTransform(node, options.width, options.height);
  const label = node.getComponent(Label) ?? node.addComponent(Label);
  const typography = THEME.typography[options.role];
  label.string = options.text;
  label.fontSize = typography.size;
  label.lineHeight = typography.lineHeight;
  label.isBold = isEmphasisRole(options.role);
  label.horizontalAlign = Label.HorizontalAlign.CENTER;
  label.verticalAlign = Label.VerticalAlign.CENTER;
  // Cocos 默认 NONE 会让文字直接溢出。所有 Label 在唯一出口显式收口；
  // 当前单行 HUD/按钮优先 SHRINK，需要截断或自适应高度的文本可由调用方显式选 CLAMP/RESIZE_HEIGHT。
  label.overflow = options.overflow ?? Label.Overflow.SHRINK;
  label.color = options.color ?? toColor(THEME.palette.textOnAccent);
  applyRegularFont(label);
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
    role: TypographyRole;
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
  const typography = THEME.typography[options.role];
  label.string = options.text;
  label.fontSize = typography.size;
  label.lineHeight = typography.lineHeight;
  label.isBold = isEmphasisRole(options.role);
  label.horizontalAlign = Label.HorizontalAlign.CENTER;
  label.verticalAlign = Label.VerticalAlign.CENTER;
  label.overflow = Label.Overflow.SHRINK;
  label.color = labelColor(options.enabled);
  applyRegularFont(label);
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
  if (options.sliced) node.setScale(1, 1, 1);
  addUiTransform(node, options.width, options.height);
  const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
  sprite.type = options.sliced ? Sprite.Type.SLICED : Sprite.Type.SIMPLE;
  sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  const frame = load(options.path, sprite);
  // W-VISION S4R:矮九宫格若直接拿目标尺寸切片,capInsets 会在局部坐标里互相压住。
  // 预载命中时先在源图高度尺度完成切片,再把整张皮等比回缩到目标屏上尺寸；
  // capInsets 仍使用 SpriteFrame/meta 的原值。异步未命中时保持旧的目标尺寸降级路径，
  // 避免先缩空节点、待资源回来后再闪变。
  if (options.sliced && frame && frame.rect.height > 0 && options.height > 0) {
    const sourceScale = frame.rect.height / options.height;
    addUiTransform(node, options.width * sourceScale, frame.rect.height);
    const renderScale = 1 / sourceScale;
    node.setScale(renderScale, renderScale, 1);
  }
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
    /** v1.5 P-BTN-FEEL:按压手感——animated 时用 SCALE 过渡;点击音由调用方注入(经 sound 开关)。
     * W3-B:rippleAt 由场景方注入涟漪挂点(game=fx 层免剪/lobby=场景根),仅 animated 时触发。 */
    feel?: { animated: boolean; onClickSound?: () => void; rippleAt?: (worldPos: Vec3, sizeBase: number) => void };
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
  // W-VISION-COLOR-R2:禁用大按钮不得切第三张灰色皮。沿用黄/绿角色皮，
  // R2-d 把皮肤透明度从近消失提高到可辨的 120；文字仍由调用方使用 disabledButton。
  const skinTint = new Color(255, 255, 255, options.enabled ? 255 : BUTTON_DISABLED_SKIN_ALPHA);
  const bgSprite = bg.getComponent(Sprite);
  if (bgSprite) bgSprite.color = skinTint;
  // v1.5 P-BTN-FEEL:动效开=SCALE 按压(参数出自 pressFeedback());动效关=保持既有 COLOR 过渡。
  if (options.feel?.animated) {
    // SCALE 认领按钮根节点：背景的 scale-safe 回缩只负责九宫格，不再被 Button
    // 在 COLOR→SCALE 或缓存 miss→hit 的复用路径里拉回 1。
    button.target = node;
    const press = pressFeedback();
    button.transition = Button.Transition.SCALE;
    button.zoomScale = press.scale;
    button.duration = press.ms / 1000;
  } else {
    button.target = bg;
    button.transition = Button.Transition.COLOR;
    button.normalColor = toColor(THEME.palette.textOnAccent);
    button.pressedColor = toColor(THEME.palette.selectedTint, 255);
    button.hoverColor = toColor(THEME.palette.textOnAccent);
    button.disabledColor = skinTint;
  }
  button.interactable = options.enabled;
  node.off(Button.EventType.CLICK);
  const feel = options.feel;
  if (feel?.onClickSound || (feel?.animated && feel?.rippleAt)) {
    node.on(Button.EventType.CLICK, function wrappedClick(this: unknown) {
      feel.onClickSound?.();
      if (feel.animated) feel.rippleAt?.(node.worldPosition.clone(), layout.renderHeight);
      (options.cb as () => void).call(options.owner ?? this);
    }, options.owner);
  } else {
    node.on(Button.EventType.CLICK, options.cb, options.owner);
  }

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
    role: layout.label.role,
    parent: node,
    width: layout.label.width,
    height: layout.label.height,
    name: 'button-label',
    color: options.textColor(options.name, options.enabled, selected),
  });
  return label;
}

export function loadSprite(path: ResourcePath, sprite: Sprite | null, cache?: Map<string, SpriteFrame>): SpriteFrame | null {
  if (!sprite) return null;
  const cached = cache?.get(path);
  if (cached) {
    sprite.spriteFrame = cached;
    return cached;
  }
  resources.load(spriteFrameResourcePath(path), SpriteFrame, (error, frame) => {
    if (!error && frame) {
      cache?.set(path, frame);
      sprite.spriteFrame = frame;
    }
  });
  return null;
}
